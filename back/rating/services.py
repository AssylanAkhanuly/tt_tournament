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
    RatingAppeal,
    RatingEdition,
    RatingEditionRow,
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


# ── Предпросчёт для калькулятора (ничего не сохраняет) ──────────────


# ── Выпуски (п. 8.2) ────────────────────────────────────────────────

#: Кто стоит в текущей таблице: неактивные и аннулированные исключены (п. 18.2).
_OUT_OF_TABLE = (engine.STATUS_INACTIVE, engine.STATUS_VOID)


@transaction.atomic
def publish_edition(actor=None) -> RatingEdition:
    """Опубликовать выпуск: снимок всех карточек на эту минуту (п. 8.2).

    Места считаются только среди стоящих в таблице, по убыванию значения, при
    равенстве — по алфавиту (как в листе). Неактивные хранятся без места: они
    исключены из текущей таблицы, но их значение сохраняется (п. 18.2).
    """
    now = timezone.now()
    # Статусы (п. 18) — перед снимком: еженедельный выпуск и есть расписание
    # их пересчёта, иначе снимок уходил бы со вчерашним «активен».
    refresh_activity(timezone.localdate(now))
    last = RatingEdition.objects.order_by("-number").first()
    edition = RatingEdition.objects.create(
        number=(last.number + 1) if last else 1,
        published_at=now,
        published_by=actor,
        appeal_until=engine.add_working_days(timezone.localdate(now), engine.APPEAL_WORKING_DAYS),
    )

    rows = []
    place = 0
    for p in RatingProfile.objects.select_related("user").order_by("-value", "user__name"):
        in_table = p.status not in _OUT_OF_TABLE
        if in_table:
            place += 1
        rows.append(
            RatingEditionRow(
                edition=edition,
                user=p.user,
                place=place if in_table else None,
                value=p.value,
                matches_played=p.matches_played,
                wins=p.wins,
                losses=p.losses,
                status=p.status,
                sex=p.sex,
                birth_year=p.birth_year,
                region=p.region,
            )
        )
    RatingEditionRow.objects.bulk_create(rows)
    return edition


def edition_draft() -> List[dict]:
    """Что уйдёт в следующий выпуск: кто сдвинулся с прошлого и кто новый.

    Председатель смотрит на это перед публикацией. Без изменений спортсмена
    здесь нет — черновик отвечает на вопрос «что поменялось», а не повторяет
    таблицу. Сначала самые большие сдвиги, новые — в конце по алфавиту.
    """
    last = RatingEdition.objects.order_by("-number").first()
    before = {r.user_id: r.value for r in last.rows.all()} if last else {}

    out = []
    for p in RatingProfile.objects.select_related("user"):
        was = before.get(p.user_id)
        if was is not None and was == p.value:
            continue
        out.append(
            {
                "user_id": str(p.user_id),
                "name": p.user.name,
                "before": was,
                "after": p.value,
                "delta": None if was is None else p.value - was,
            }
        )
    out.sort(key=lambda d: (d["before"] is None, -abs(d["delta"] or 0), d["name"]))
    return out


# ── Апелляции (п. 21.1–21.4) ────────────────────────────────────────


class AppealError(ValueError):
    """Апелляцию нельзя принять или решить. Текст объясняет почему — его
    показывает экран, а не придумывает свой."""


def _ru(d: date) -> str:
    return d.strftime("%d.%m.%Y")


@transaction.atomic
def register_appeal(
    edition,
    user,
    *,
    received_at: Optional[date] = None,
    applicant: str = "",
    subject: str = "",
    circumstances: str = "",
    demand: str = "",
    documents: str = "",
    actor=None,
) -> RatingAppeal:
    """Зарегистрировать письменную апелляцию на выпуск (п. 21.2).

    Принимается от публикации выпуска до конца пятого рабочего дня. Срок
    рассмотрения — 10 рабочих дней с получения (п. 21.3).
    """
    received_at = received_at or timezone.localdate()
    if not (subject or "").strip():
        raise AppealError("Не указано, что обжалуется (п. 21.2)")
    if not (demand or "").strip():
        raise AppealError("Не указано требование (п. 21.2)")
    if received_at < timezone.localdate(edition.published_at):
        raise AppealError("Апелляция не может быть получена раньше публикации выпуска")
    if received_at > edition.appeal_until:
        raise AppealError(
            "Срок подачи истёк %s — 5 рабочих дней с публикации выпуска №%s (п. 21.2)"
            % (_ru(edition.appeal_until), edition.number)
        )

    return RatingAppeal.objects.create(
        edition=edition,
        user=user,
        applicant=applicant.strip(),
        subject=subject.strip(),
        circumstances=circumstances.strip(),
        demand=demand.strip(),
        documents=documents.strip(),
        received_at=received_at,
        review_until=engine.add_working_days(received_at, engine.APPEAL_REVIEW_WORKING_DAYS),
        registered_by=actor,
    )


@transaction.atomic
def decide_appeal(appeal: RatingAppeal, *, upheld: bool, decision: str, value=None, actor=None) -> RatingAppeal:
    """Решение по апелляции (п. 21.4) — окончательное.

    Удовлетворить значит исправить значение: разница дописывается строкой
    журнала со ссылкой на апелляцию (п. 21.6), опубликованный выпуск не
    трогается — изменение уйдёт в следующий.
    """
    if appeal.status != RatingAppeal.STATUS_PENDING:
        raise AppealError("По апелляции уже есть решение — оно окончательное")
    decision = (decision or "").strip()
    if not decision:
        raise AppealError("Обоснование решения обязательно (п. 21.4)")
    if upheld and value is None:
        raise AppealError("Чтобы удовлетворить апелляцию, нужно исправленное значение рейтинга")

    if upheld:
        appeal.correction = register_correction(
            appeal.user, value, reason="Апелляция №%s: %s" % (appeal.pk, decision), actor=actor
        )
    appeal.status = RatingAppeal.STATUS_UPHELD if upheld else RatingAppeal.STATUS_REJECTED
    appeal.decision = decision
    appeal.decided_at = timezone.now()
    appeal.decided_by = actor
    appeal.save()
    return appeal


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
    старта. Апелляции дубля переходят к основной, счётчик неявок
    складывается, карточка дубля исчезает — параллельных карточек не бывает.
    Сведения об объединении — нулевой строкой журнала с основанием и автором.

    Выпуски не трогаются: что было опубликовано, то и было.
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
    RatingAppeal.objects.filter(user=drop_user).update(user=keep_user)

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

    rows = RatingEntry.objects.filter(tournament=tournament, is_reverted=False)
    first = rows.order_by("created_at").values_list("created_at", flat=True).first()
    if first is not None:
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
            raise ProtocolError(
                "После этого турнира у участников были другие изменения рейтинга — пересчёт "
                "задел бы их (п. 21.6). Поправьте значения исправлениями"
            )
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
