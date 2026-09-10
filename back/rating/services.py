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
from .models import (
    RatingEntry,
    RatingParams,
    RatingProfile,
)


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


# ── Новый спортсмен (п. 6.1, 6.3, 17.4) ─────────────────────────────


class AthleteError(ValueError):
    """Спортсмена нельзя завести. Текст объясняет почему."""


@transaction.atomic
def create_athlete(
    *,
    name: str,
    region: str = "",
    sex: str = "",
    birth_year=None,
    origin: str = engine.ORIGIN_NEW,
    legacy=None,
    ittf_position=None,
):
    """Завести спортсмена с рейтинговой карточкой ✳ (11.09.2026).

    Старт по Положению: новый — 1,00 (п. 6.1), перенос прежнего — один к
    одному (п. 6.3), легионер — из позиции ITTF (п. 17.4). Считает сервер:
    формула перевода должна жить в одном месте. Вход у спортсмена появится
    со Smart Bridge; пока это только карточка, телефон — служебная метка.
    """
    import uuid

    from django.contrib.auth import get_user_model

    name = (name or "").strip()
    if not name:
        raise AthleteError("Фамилия и имя обязательны")
    if sex not in ("", "m", "f"):
        raise AthleteError("Пол — «m» или «f»")
    if birth_year not in (None, ""):
        try:
            birth_year = int(birth_year)
        except (TypeError, ValueError):
            raise AthleteError("Год рождения — число")
        if not 1920 <= birth_year <= timezone.localdate().year:
            raise AthleteError("Год рождения вне разумных границ")
    else:
        birth_year = None

    extra = {"region": (region or "").strip(), "sex": sex, "birth_year": birth_year}
    if origin == engine.ORIGIN_LEGACY:
        try:
            value = float(str(legacy).replace(",", "."))
        except (TypeError, ValueError):
            raise AthleteError("Для переноса нужен прежний рейтинг (п. 6.3)")
        if value < 0:
            raise AthleteError("Прежний рейтинг не может быть отрицательным")
        extra["legacy"] = value
    elif origin == engine.ORIGIN_ITTF:
        try:
            position = int(ittf_position)
        except (TypeError, ValueError):
            raise AthleteError("Для старта из ITTF нужна позиция в рейтинге ITTF (п. 17.4)")
        if position < 1:
            raise AthleteError("Позиция ITTF — от 1")
        extra["ittf_position"] = position
    elif origin != engine.ORIGIN_NEW:
        raise AthleteError("Неизвестное происхождение стартового значения")

    user = get_user_model().objects.create_user(phone="ath-" + uuid.uuid4().hex[:10], name=name)
    get_or_create_profile(user, origin=origin, **extra)
    return user


# ── Объединение дублей (п. 5.3) ─────────────────────────────────────


class MergeError(ValueError):
    """Карточки нельзя объединить. Текст объясняет почему."""


@transaction.atomic
def merge_profiles(keep_user, drop_user, *, reason: str, actor=None) -> RatingProfile:
    """Объединить дублирующую карточку с основной (п. 5.3).

    История дубля переходит к основной целиком — «сохраняется полная
    рейтинговая история». Кроме старта: у каждой карточки своя стартовая
    строка, и сложи их — стартовое значение удвоилось бы. Поэтому старт дубля
    остаётся в истории отменённым, а считаются только его изменения после
    старта. Счётчик неявок складывается, карточка дубля исчезает — параллельных карточек не бывает.
    Сведения об объединении — нулевой строкой журнала с основанием и автором.
    """
    if keep_user.pk == drop_user.pk:
        raise MergeError("Карточку нельзя объединить саму с собой")
    reason = (reason or "").strip()
    if not reason:
        raise MergeError("Основание объединения обязательно (п. 5.3)")
    keep = RatingProfile.objects.filter(user=keep_user).first()
    drop = RatingProfile.objects.filter(user=drop_user).first()
    if not keep or not drop:
        raise MergeError("У одного из спортсменов нет рейтинговой карточки")

    drop.entries.filter(kind=RatingEntry.KIND_START, is_reverted=False).update(
        is_reverted=True, reverted_at=timezone.now(), reverted_by=actor
    )
    RatingEntry.objects.filter(profile=drop).update(profile=keep)

    keep.no_shows += drop.no_shows
    keep.save(update_fields=["no_shows", "updated_at"])
    drop_name = drop_user.name
    drop.delete()

    recalc_profile(keep)
    RatingEntry.objects.create(
        profile=keep,
        kind=RatingEntry.KIND_MERGE,
        occurred_at=timezone.localdate(),
        before=keep.value,
        delta=Decimal("0.00"),
        after=keep.value,
        reason="Объединена карточка «%s»: %s" % (drop_name, reason),
        created_by=actor,
    )
    return keep


# ── Утверждение протокола: уровень и места (п. 10, 13) ──────────────


class ProtocolError(ValueError):
    """Протокол нельзя утвердить. Текст объясняет почему."""


@transaction.atomic
def set_protocol(tournament, *, level: str, places: Dict[str, int], no_third_place_match: bool, actor=None):
    """Задать уровень соревнования и итоговые места — и пересчитать турнир.

    Без этого C (п. 13) и P (п. 10) в настоящих турнирах всегда были бы 1,00.
    Прежние строки турнира отменяются (история сохраняется, п. 20), расчёт
    идёт заново — от значений участников до турнира.

    Честно это только для последнего турнира участников: расчёт берёт их
    текущие значения. Если после турнира у кого-то из них появились другие
    строки (турнир, неявка, исправление), пересчёт отказан — иначе поздние
    начисления остались бы посчитанными от старых чисел, а каскадного
    исправления (п. 21.6) нет.
    """
    if level not in engine.LEVELS:
        raise ProtocolError("Уровень соревнования не из таблицы п. 13")
    parts = {str(p.user_id): p for p in tournament.participants.all()}
    for uid, place in places.items():
        if uid not in parts:
            raise ProtocolError("Место указано не участнику турнира")
        if not isinstance(place, int) or place < 1:
            raise ProtocolError("Место — целое число от 1")
    taken = list(places.values())
    for place in (1, 2):
        if taken.count(place) > 1:
            raise ProtocolError("%s место может быть только у одного участника" % place)
    if taken.count(3) > (2 if no_third_place_match else 1):
        raise ProtocolError(
            "3 место не больше чем у двоих (п. 10.4)"
            if no_third_place_match
            else "3 место у двоих — только если матча за 3-е место не было (п. 10.4)"
        )

    blocked = protocol_block_reason(tournament)
    if blocked:
        raise ProtocolError(blocked)
    if RatingEntry.objects.filter(tournament=tournament, is_reverted=False).exists():
        revert_tournament(tournament, actor=actor)

    tournament.level = level
    tournament.no_third_place_match = bool(no_third_place_match)
    tournament.save(update_fields=["level", "no_third_place_match"])
    for uid, participant in parts.items():
        new_place = places.get(uid)
        if participant.place != new_place:
            participant.place = new_place
            participant.save(update_fields=["place"])

    apply_tournament(tournament, actor=actor)
    return tournament


def protocol_block_reason(tournament) -> Optional[str]:
    """Почему турнир нельзя пересчитать — или None.

    Пересчёт идёт от текущих значений участников, поэтому честен только для их
    последнего турнира. Если после него у кого-то появились другие строки
    (турнир, неявка, исправление), поздние начисления остались бы посчитанными
    от старых чисел, а каскадного исправления (п. 21.6) нет.
    """
    rows = RatingEntry.objects.filter(tournament=tournament, is_reverted=False)
    first = rows.order_by("created_at").values_list("created_at", flat=True).first()
    if first is None:
        return None
    later = (
        RatingEntry.objects.filter(
            profile_id__in=rows.values_list("profile_id", flat=True),
            is_reverted=False,
            created_at__gt=first,
        )
        .exclude(tournament=tournament)
        .exclude(kind__in=[RatingEntry.KIND_START, RatingEntry.KIND_MERGE])
    )
    if later.exists():
        return (
            "После этого турнира у участников были другие изменения рейтинга — пересчёт "
            "задел бы их (п. 21.6). Поправьте значения исправлениями"
        )
    return None


def _num(x) -> Optional[str]:
    return None if x is None else str(x)


def _side(entry) -> Optional[dict]:
    """Что матч дал одному игроку и из чего это сложилось (п. 4.6)."""
    if entry is None:
        return None
    return {
        "delta": str(entry.delta),
        "before": str(entry.before),
        "after": str(entry.after),
        "expected": _num(entry.expected),
        "k": _num(entry.k),
        "c": _num(entry.c),
        "p": _num(entry.p),
        "capped": entry.capped,
        "transition": entry.transition,
    }


def protocol_detail(tournament) -> dict:
    """Протокол целиком — для страницы председателя ✳ (11.09.2026).

    Участники с местом и тем, что турнир дал их рейтингу; все матчи протокола
    с изменением у обоих игроков. Матч без строк журнала — неучтённый (неявка,
    нет счёта, п. 16.3): его видно, чтобы было понятно, почему он не посчитан.
    `blocked` — почему утвердить нельзя, или None.
    """
    parts = list(tournament.participants.select_related("user"))
    names = {p.user_id: p.user.name for p in parts}

    by_match: Dict[str, Dict[object, RatingEntry]] = {}
    entries = RatingEntry.objects.filter(
        tournament=tournament, is_reverted=False, kind=RatingEntry.KIND_MATCH
    ).select_related("profile")
    for e in entries:
        key = ("b%s" % e.match_id) if e.match_id else ("g%s" % e.group_match_id)
        by_match.setdefault(key, {})[e.profile.user_id] = e

    matches = []
    for m in _collect_matches(tournament):
        sides = by_match.get(m["id"], {})
        source = m["match"] or m["group_match"]
        matches.append(
            {
                "id": m["id"],
                "a_id": str(m["a"]),
                "a_name": names.get(m["a"], "—"),
                "b_id": str(m["b"]),
                "b_name": names.get(m["b"], "—"),
                "score": "%s:%s" % tuple(m["games"]),
                "winner_id": str(source.winner_id) if source is not None and source.winner_id else None,
                "counted": bool(sides),
                "a": _side(sides.get(m["a"])),
                "b": _side(sides.get(m["b"])),
            }
        )

    def after(p):
        if p.rating_before is None or p.rating_change is None:
            return None
        return str(p.rating_before + p.rating_change)

    applied = RatingEntry.objects.filter(tournament=tournament, is_reverted=False).exists()
    when = getattr(tournament, "starts_at", None) or getattr(tournament, "created_at", None)
    ordered = sorted(parts, key=lambda p: (p.place is None, p.place or 0, p.user.name))
    return {
        "id": tournament.pk,
        "name": tournament.name,
        "date": timezone.localdate(when) if when else None,
        "level": tournament.level,
        "level_label": engine.LEVEL_LABELS.get(tournament.level, tournament.level),
        "no_third_place_match": tournament.no_third_place_match,
        "applied": applied,
        # Участников и матчи правят только у турнира протоколом вручную и
        # только пока он не учтён (rating/manual.py).
        "editable": getattr(tournament, "format", "") == "manual" and not applied,
        "manual": getattr(tournament, "format", "") == "manual",
        "status": tournament.status,
        "blocked": protocol_block_reason(tournament),
        "participants": [
            {
                "user_id": str(p.user_id),
                "name": p.user.name,
                "place": p.place,
                "before": _num(p.rating_before),
                "change": _num(p.rating_change),
                "after": after(p),
            }
            for p in ordered
        ],
        "matches": matches,
    }


def preview_protocol(tournament, *, level: str, places: Dict[str, int], no_third_place_match: bool) -> dict:
    """Предпросмотр утверждения — считается по-настоящему и откатывается.

    Второго расчёта нет: внутри транзакции выполняется ровно то же
    `set_protocol()`, что и при сохранении, снимается `protocol_detail()`, и
    всё откатывается. Числа предпросмотра поэтому те же, что даст сохранение.
    Если утвердить нельзя, в `blocked` — причина, а числа прежние.
    """
    with transaction.atomic():
        try:
            set_protocol(tournament, level=level, places=places, no_third_place_match=no_third_place_match)
            detail = protocol_detail(tournament)
        except ProtocolError as e:
            detail = protocol_detail(tournament)
            detail["blocked"] = str(e)
        transaction.set_rollback(True)
    tournament.refresh_from_db()
    return detail
