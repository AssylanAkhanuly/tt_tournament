"""Сборка рейтинга: достать данные, позвать движок, разложить результат.

Разделение ответственности жёсткое: арифметика — в `engine.py`, здесь только
чтение протокола, запись журнала и пересчёт карточек. Поменяется методика —
меняется движок, этот файл остаётся.

Журнал (`RatingEntry`) — источник правды: значение карточки всегда равно сумме
неотменённых изменений. Поэтому откат протокола не «вычитает обратно», а
помечает строки отменёнными и пересобирает карточку заново.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Dict, Iterable, List, Optional, Sequence

from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from . import engine
from .models import RatingEntry, RatingParams, RatingProfile


def _dec(x: float, places: str = "0.01") -> Decimal:
    """Число движка → Decimal поля. Движок уже округлил до нужного знака."""
    return Decimal(str(x)).quantize(Decimal(places))


def get_or_create_profile(user, **defaults) -> RatingProfile:
    """Карточка спортсмена (п. 19). Новый входит с 1,00 (п. 6.1), и это
    записывается отдельной строкой журнала: иначе значение возьмётся ниоткуда."""
    profile = RatingProfile.objects.filter(user=user).first()
    if profile:
        return profile
    params = RatingParams.active()
    origin = defaults.pop("origin", engine.ORIGIN_NEW)
    if origin == engine.ORIGIN_ITTF:
        position = defaults.get("ittf_position") or 0
        start = engine.from_ittf_position(position, float(params.ittf_r_max), float(params.ittf_k))
    elif origin == engine.ORIGIN_LEGACY:
        start = engine.from_legacy_rating(float(defaults.pop("legacy", 1)))
    else:
        start = engine.new_player_rating()

    profile = RatingProfile.objects.create(
        user=user, origin=origin, start_value=_dec(start), value=_dec(start), **defaults
    )
    RatingEntry.objects.create(
        profile=profile,
        kind=RatingEntry.KIND_START,
        occurred_at=timezone.localdate(),
        before=Decimal("0.00"),
        delta=_dec(start),
        after=_dec(start),
        reason=dict(RatingProfile.ORIGIN_CHOICES).get(origin, ""),
    )
    return profile


def recalc_profile(profile: RatingProfile) -> RatingProfile:
    """Пересобрать карточку из журнала. Журнал — правда, карточка — его свод."""
    params = RatingParams.active()
    rows = list(profile.entries.filter(is_reverted=False).order_by("occurred_at", "created_at"))

    value = sum((r.delta for r in rows), Decimal("0.00"))
    value = max(Decimal(params.min_rating), value)

    matches = [r for r in rows if r.kind == RatingEntry.KIND_MATCH]
    profile.value = value
    profile.matches_played = len(matches)
    profile.wins = sum(1 for r in matches if r.won)
    profile.losses = sum(1 for r in matches if r.won is False)
    profile.last_match_at = max((r.occurred_at for r in matches), default=None)
    profile.status = engine.activity_status(profile.last_match_at, timezone.localdate()).status
    profile.save(
        update_fields=[
            "value", "matches_played", "wins", "losses", "last_match_at", "status", "updated_at",
        ]
    )
    return profile


# ── Пересчёт по итоговому протоколу (п. 8.1–8.2) ────────────────────


def _tournament_date(tournament) -> date:
    when = getattr(tournament, "starts_at", None) or getattr(tournament, "created_at", None)
    return timezone.localdate(when) if when else timezone.localdate()


def _collect_matches(tournament) -> List[dict]:
    """Сыгранные одиночные матчи турнира в порядке проведения (п. 14.1).

    Неявки (`is_walkover`) в рейтинг не идут: п. 16.3 запрещает начисление без
    подтверждённого результата, а последствие самой неявки — отдельное действие
    по п. 15, которое требует установленных обстоятельств (п. 15.13).
    """
    from tournaments.models import GroupMatch, Match

    out: List[dict] = []
    groups = (
        GroupMatch.objects.filter(
            group__tournament=tournament, status=GroupMatch.FINISHED, winner__isnull=False
        )
        .select_related("group")
        .order_by("group__order", "match_number")
    )
    for m in groups:
        if m.is_walkover or m.score1 is None or m.score2 is None:
            continue
        if not m.player1_id or not m.player2_id:
            continue
        out.append(
            {"id": "g%s" % m.id, "a": m.player1_id, "b": m.player2_id,
             "games": (m.score1, m.score2), "group_match": m, "match": None}
        )

    bracket = tournament.matches.filter(status=Match.FINISHED, winner__isnull=False).order_by(
        "round_number", "match_number"
    )
    for m in bracket:
        if m.is_walkover or m.score1 is None or m.score2 is None:
            continue
        if not m.player1_id or not m.player2_id:
            continue
        out.append(
            {"id": "b%s" % m.id, "a": m.player1_id, "b": m.player2_id,
             "games": (m.score1, m.score2), "group_match": None, "match": m}
        )
    return out


def tournament_has_rating(tournament) -> bool:
    """ТЗ §4.1: официальные учитываются всегда, клубный — по флагу рейтинга."""
    return bool(getattr(tournament, "is_rating", True))


@transaction.atomic
def apply_tournament(tournament, actor=None) -> int:
    """Посчитать и записать изменения рейтинга по завершённому турниру.

    Идемпотентно: повторный вызов ничего не делает, пока прежние строки не
    отменены. Возвращает число записанных строк журнала.
    """
    if not tournament_has_rating(tournament):
        return 0
    if RatingEntry.objects.filter(tournament=tournament, is_reverted=False).exists():
        return 0  # уже посчитан

    parts = list(tournament.participants.select_related("user"))
    if not parts:
        return 0

    params = RatingParams.active()
    engine_params = params.to_engine()

    profiles: Dict[object, RatingProfile] = {}
    players: List[engine.LabPlayer] = []
    for p in parts:
        profile = get_or_create_profile(p.user)
        profiles[p.user_id] = profile
        players.append(
            engine.LabPlayer(
                id=str(p.user_id),
                name=str(p.user),
                origin=profile.origin,
                start=float(profile.value),
                played=profile.matches_played,
            )
        )

    places = {str(p.user_id): p.place for p in parts if p.place}
    lab_tournament = engine.LabTournament(
        id=str(tournament.id),
        name=tournament.name,
        level=getattr(tournament, "level", engine.LEVEL_REPUBLIC),
        places=places,
        no_third_place_match=bool(getattr(tournament, "no_third_place_match", False)),
    )

    raw_matches = _collect_matches(tournament)
    by_id = {m["id"]: m for m in raw_matches}
    lab_matches = [
        engine.LabMatch(id=m["id"], tournament=str(tournament.id), a=str(m["a"]), b=str(m["b"]),
                        games=tuple(m["games"]))
        for m in raw_matches
    ]

    result = engine.run_series(players, [lab_tournament], lab_matches, engine_params)

    when = _tournament_date(tournament)
    written = 0
    for row in result.history:
        source = by_id.get(row.match_id, {})
        RatingEntry.objects.create(
            profile=profiles[_uid(parts, row.player)],
            kind=RatingEntry.KIND_MATCH,
            occurred_at=when,
            tournament=tournament,
            match=source.get("match"),
            group_match=source.get("group_match"),
            opponent_id=_uid(parts, row.opponent),
            score=row.score,
            won=row.won,
            before=_dec(row.before),
            delta=_dec(row.delta),
            after=_dec(row.after),
            expected=_dec(row.expected, "0.0001"),
            d=_dec(engine_params.d),
            k=_dec(row.k, "0.001"),
            c=_dec(row.c),
            p=_dec(row.p),
            capped=row.capped,
            transition=row.transition,
            created_by=actor,
        )
        written += 1

    # Надбавка за место в прочтении п. 10.6 — она не привязана к матчу, поэтому
    # идёт отдельной строкой (иначе её негде показать в истории п. 20).
    for standing in result.table:
        if not standing.prize_bonus:
            continue
        profile = profiles[_uid(parts, standing.id)]
        before = _dec(standing.rating - standing.prize_bonus)
        RatingEntry.objects.create(
            profile=profile,
            kind=RatingEntry.KIND_PRIZE,
            occurred_at=when,
            tournament=tournament,
            before=before,
            delta=_dec(standing.prize_bonus),
            after=_dec(standing.rating),
            p=_dec(engine.prize_factor(places.get(standing.id), engine_params,
                                       lab_tournament.no_third_place_match)),
            reason="Коэффициент места применён к итогу турнира (п. 10.6)",
            created_by=actor,
        )
        written += 1

    for part in parts:
        profile = profiles[part.user_id]
        before = profile.value
        recalc_profile(profile)
        part.rating_before = before
        part.rating_change = profile.value - before
        part.save(update_fields=["rating_before", "rating_change"])

    return written


def _uid(parts, player_id: str):
    """Строковый id движка → настоящий идентификатор пользователя."""
    for p in parts:
        if str(p.user_id) == str(player_id):
            return p.user_id
    return None


@transaction.atomic
def revert_tournament(tournament, actor=None) -> int:
    """Откатить рейтинг турнира — при возврате протокола на доработку.

    Строки не удаляются (п. 21.6 требует сохранять первоначальную запись), а
    помечаются отменёнными; карточки пересобираются из журнала.
    """
    rows = list(RatingEntry.objects.filter(tournament=tournament, is_reverted=False))
    if not rows:
        return 0
    profiles = {r.profile_id: r.profile for r in rows}
    RatingEntry.objects.filter(id__in=[r.id for r in rows]).update(
        is_reverted=True, reverted_at=timezone.now(), reverted_by=actor
    )
    for profile in profiles.values():
        recalc_profile(profile)
    tournament.participants.update(rating_before=None, rating_change=None)
    return len(rows)


# ── Неявка (п. 15.4–15.6) ───────────────────────────────────────────


@transaction.atomic
def register_no_show(user, tournament=None, reason: str = "", actor=None, occurred_at=None) -> RatingEntry:
    """Подтверждённая неявка без уважительной причины.

    Действие всегда ручное и с основанием: п. 15.13 запрещает применять
    последствие, пока обстоятельства не установлены, а п. 15.7 требует
    отдельной записи с датой, соревнованием и размером снижения.
    """
    profile = get_or_create_profile(user)
    params = RatingParams.active()
    occurrence = profile.no_shows + 1
    before = float(profile.value)
    after = engine.apply_no_show(before, occurrence, float(params.min_rating))

    entry = RatingEntry.objects.create(
        profile=profile,
        kind=RatingEntry.KIND_NO_SHOW,
        occurred_at=occurred_at or timezone.localdate(),
        tournament=tournament,
        before=_dec(before),
        delta=_dec(after - before),
        after=_dec(after),
        reason=reason,
        created_by=actor,
    )
    profile.no_shows = occurrence
    profile.save(update_fields=["no_shows", "updated_at"])
    recalc_profile(profile)
    return entry


# ── Исправление (п. 21.5–21.6) ──────────────────────────────────────


@transaction.atomic
def register_correction(user, value, reason: str, actor=None, occurred_at=None) -> RatingEntry:
    """Исправить рейтинговое значение — техническая ошибка (п. 21.5).

    Ничего не переписывает: прежние строки остаются на месте, а разница
    дописывается отдельной записью с основанием и автором. Так выполняется
    п. 21.6 — «сохраняются первоначальная запись, новая запись, дата, основание
    и лицо, внёсшее исправление», — и остаётся верным главный инвариант:
    значение карточки равно сумме журнала.

    Срока давности у исправления нет (п. 21.5): достоверность данных важнее.
    """
    if not reason.strip():
        raise ValueError("Основание обязательно (п. 21.6)")

    profile = get_or_create_profile(user)
    params = RatingParams.active()
    before = float(profile.value)
    after = max(float(params.min_rating), engine.round2(float(value)))

    entry = RatingEntry.objects.create(
        profile=profile,
        kind=RatingEntry.KIND_CORRECTION,
        occurred_at=occurred_at or timezone.localdate(),
        before=_dec(before),
        delta=_dec(engine.round2(after - before)),
        after=_dec(after),
        reason=reason.strip(),
        created_by=actor,
    )
    recalc_profile(profile)
    return entry


# ── Неактивность (п. 18) ────────────────────────────────────────────


@transaction.atomic
def refresh_activity(now: Optional[date] = None) -> Dict[str, int]:
    """Пересчитать статусы: 24 месяца без матчей — «неактивен», 60 — обнуление.

    Обнуление пишется строкой журнала, а не молчаливой правкой значения: иначе
    рейтинг исчезнет, и объяснить его нечем.
    """
    now = now or timezone.localdate()
    counts = {engine.STATUS_ACTIVE: 0, engine.STATUS_INACTIVE: 0, engine.STATUS_VOID: 0,
              engine.STATUS_NO_MATCHES: 0}
    for profile in RatingProfile.objects.all():
        activity = engine.activity_status(profile.last_match_at, now)
        counts[activity.status] = counts.get(activity.status, 0) + 1
        if activity.status == engine.STATUS_VOID and profile.value > 0:
            before = profile.value
            RatingEntry.objects.create(
                profile=profile,
                kind=RatingEntry.KIND_VOID,
                occurred_at=now,
                before=before,
                delta=-before,
                after=Decimal("0.00"),
                reason="60 месяцев без рейтинговых матчей (п. 18.4)",
            )
            recalc_profile(profile)
            profile.refresh_from_db()
        if profile.status != activity.status:
            profile.status = activity.status
            profile.save(update_fields=["status", "updated_at"])
    return counts


# ── Предпросчёт для калькулятора (ничего не сохраняет) ──────────────


def preview(players: Sequence[dict], tournaments: Sequence[dict], matches: Sequence[dict],
            params: Optional[dict] = None):
    """Посчитать присланный набор, не трогая базу.

    Это ручка калибровки: федерация крутит коэффициенты и смотрит, что получится,
    на своих данных. Расчёт тот же самый, что и боевой, — движок один.
    """
    base = RatingParams.active().to_engine()
    if params:
        clean = {k: v for k, v in params.items() if v is not None and hasattr(base, k)}
        if "prize_p" in clean:
            clean["prize_p"] = {int(k): float(v) for k, v in clean["prize_p"].items()}
        if "level_c" in clean:
            clean["level_c"] = {str(k): float(v) for k, v in clean["level_c"].items()}
        base = base.replace(**clean)

    # Стартовое значение выводится ЗДЕСЬ, а не на клиенте: новичок входит с
    # 1,00 (п. 6.1), легионер — по формуле перевода из ITTF (п. 17.4). Считай
    # это фронт сам, формула Положения оказалась бы в двух местах сразу.
    lab_players = []
    for p in players:
        player = engine.LabPlayer(
            id=str(p["id"]),
            name=p.get("name") or str(p["id"]),
            origin=p.get("origin") or engine.ORIGIN_LEGACY,
            start=float(p.get("start") or 1),
            played=int(p.get("played", 0) or 0),
            ittf_position=p.get("ittf_position"),
        )
        player.start = engine.start_rating(player, base)
        lab_players.append(player)
    lab_tournaments = [
        engine.LabTournament(
            id=str(t["id"]),
            name=t.get("name") or str(t["id"]),
            level=t.get("level") or engine.LEVEL_REPUBLIC,
            places={str(k): int(v) for k, v in (t.get("places") or {}).items()},
            no_third_place_match=bool(t.get("no_third_place_match")),
        )
        for t in tournaments
    ]
    lab_matches = [
        engine.LabMatch(
            id=str(m["id"]),
            tournament=str(m["tournament"]),
            a=str(m["a"]),
            b=str(m["b"]),
            games=(int(m["games"][0]), int(m["games"][1])),
        )
        for m in matches
    ]
    # Возвращаем и применённые коэффициенты: по ним считаются наблюдения, и
    # брать их второй раз из настроек — значит разойтись с тем, чем считали.
    return engine.run_series(lab_players, lab_tournaments, lab_matches, base), base
