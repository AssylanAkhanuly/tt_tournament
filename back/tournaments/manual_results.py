"""Результаты без расписания ✳ (03.11.2026, решение владельца продукта).

В «Расписании» два способа внести турнир: **автоматически** — расписание
главного судьи (`schedule.py`: группы, пары, время, столы) — и **вручную**:
матчи вносятся сразу со счётом, без групп, времени и столов. Так вносят
турнир, который уже сыгран или ведётся на бумаге.

Правила:
- способ «вручную» выбирают, пока расписания нет (`schedule_status = none`);
- после первого матча вручную расписание у турнира не собирается
  (`schedule.build` → `ScheduleError`), и от ручного способа не отказаться;
  без матчей — можно вернуться к выбору;
- матч — между двумя разными участниками турнира, счёт по «до N побед»
  турнира (`games_to_win`): у победителя ровно N партий, у проигравшего
  меньше; ничьих нет;
- вносят главный судья турнира, председатель ГСК и администратор федерации.

Матч хранится обычным `Match` — кругом 1, сыгранным, с победителем: тем же
видом, что у турнира протоколом вручную (`rating/manual.py`), поэтому учёт в
рейтинге при завершении турнира идёт по общему пути, второго расчёта нет.

**Завершить турнир** ✳ (03.11.2026, решение владельца продукта): когда внесён
хотя бы один матч, турнир завершается (`STATUS_FINISHED`) и рейтинг
участников пересчитывается тем же `rating.services.apply_tournament`, что и
при закрытии последнего матча сетки; у нерейтингового (`is_rating = False`)
пересчёта нет. После завершения матчи не меняются. ⚠ Мест и неявок здесь
нет — коэффициент места P у всех 1,00 (ENGINE.md).

**Вернуть из завершённых** ✳ (12.11.2026, решение владельца продукта): только
**последний завершённый турнир** (по `finished_at`, среди всех турниров).
Рейтинг турнира откатывается (`rating.services.revert_tournament`: строки
журнала помечаются отменёнными, карточки пересобираются), турнир снова идёт, и
матчи опять можно править, а потом завершить заново. Почему только последний:
рейтинг считается от значений участников на момент турнира, и откат более
раннего оставил бы следующие турниры посчитанными от старых чисел — каскадного
пересчёта нет (п. 21.6). По той же причине отказ, если после турнира у его
участников были другие строки рейтинга (исправление, неявка) —
`protocol_block_reason`. Возвращают те же, кто вносит. """
from django.db import transaction
from django.db.models import F, Max
from django.utils import timezone

from .models import Match, Tournament

MANUAL = "manual"


class ResultsError(ValueError):
    """Внести нельзя. Текст объясняет почему — его показывает экран."""


def has_manual_matches(t: Tournament) -> bool:
    return t.results_mode == MANUAL and t.matches.exists()


def can_enter(t: Tournament, user) -> bool:
    """Главный судья турнира, председатель ГСК, администратор федерации."""
    from users.models import Role
    from users.permissions import has_role

    from . import schedule

    return schedule.is_chief(t, user) or has_role(user, Role.KIND_GSK_CHAIRMAN, Role.KIND_FEDERATION_ADMIN)


@transaction.atomic
def set_manual(t: Tournament, on: bool) -> None:
    """Выбрать ручной способ или вернуться к выбору (только пока матчей нет)."""
    if on:
        if t.schedule_status != "none":
            raise ResultsError("У турнира уже есть расписание — результаты идут по нему.")
        if t.status == Tournament.STATUS_FINISHED:
            raise ResultsError("Турнир завершён.")
        t.results_mode = MANUAL
    else:
        if has_manual_matches(t):
            raise ResultsError("Матчи уже внесены вручную — способ не меняется.")
        t.results_mode = ""
    t.save(update_fields=["results_mode"])


def _check_open(t: Tournament) -> None:
    if t.results_mode != MANUAL:
        raise ResultsError("Сначала выберите «Вручную».")
    if t.status == Tournament.STATUS_FINISHED:
        raise ResultsError("Турнир завершён — результаты не меняются.")


@transaction.atomic
def add_match(t: Tournament, a_id, b_id, score_a, score_b) -> Match:
    """Кто с кем сыграл и счёт. Победитель — у кого больше партий."""
    _check_open(t)
    if str(a_id) == str(b_id):
        raise ResultsError("Спортсмен не играет сам с собой.")
    members = {str(p.user_id): p.user for p in t.participants.select_related("user")}
    a, b = members.get(str(a_id)), members.get(str(b_id))
    if not a or not b:
        raise ResultsError("Матч — только между участниками турнира.")
    try:
        sa, sb = int(score_a), int(score_b)
    except (TypeError, ValueError):
        raise ResultsError("Счёт — целые числа.")
    n = t.games_to_win
    if sa < 0 or sb < 0 or sa == sb or max(sa, sb) != n or min(sa, sb) >= n:
        raise ResultsError("Матч до %d побед: у победителя %d, у проигравшего меньше, ничьих нет." % (n, n))
    number = (t.matches.aggregate(n=Max("match_number"))["n"] or 0) + 1
    return Match.objects.create(
        tournament=t,
        round_number=1,
        match_number=number,
        player1=a,
        player2=b,
        score1=sa,
        score2=sb,
        winner=a if sa > sb else b,
        status=Match.FINISHED,
    )


@transaction.atomic
def remove_match(t: Tournament, match_id) -> None:
    _check_open(t)
    deleted, _ = t.matches.filter(pk=match_id).delete()
    if not deleted:
        raise ResultsError("Матч не найден.")


def can_finish(t: Tournament, user) -> bool:
    return (
        t.results_mode == MANUAL
        and t.status != Tournament.STATUS_FINISHED
        and t.matches.exists()
        and can_enter(t, user)
    )


@transaction.atomic
def finish(t: Tournament, actor=None) -> int:
    """Завершить турнир и пересчитать рейтинг. Возвращает число строк истории."""
    _check_open(t)
    if not t.matches.exists():
        raise ResultsError("Внесите хотя бы один матч.")
    from rating.services import apply_tournament

    t.status = Tournament.STATUS_FINISHED
    t.finished_at = timezone.now()
    t.save(update_fields=["status", "finished_at"])
    return apply_tournament(t, actor=actor)


def last_finished():
    """Последний завершённый турнир — единственный, кого можно вернуть."""
    return (
        Tournament.objects.filter(status=Tournament.STATUS_FINISHED)
        .order_by(F("finished_at").desc(nulls_last=True), "-created_at")
        .first()
    )


def unfinish_block_reason(t: Tournament):
    """Почему турнир нельзя вернуть из завершённых — или None."""
    if t.results_mode != MANUAL:
        return "Вернуть можно только турнир с результатами, внесёнными вручную."
    if t.status != Tournament.STATUS_FINISHED:
        return "Турнир не завершён."
    last = last_finished()
    if last is None or last.pk != t.pk:
        return "Вернуть можно только последний завершённый турнир."
    from rating.services import protocol_block_reason

    return protocol_block_reason(t)


def can_unfinish(t: Tournament, user) -> bool:
    return t.status == Tournament.STATUS_FINISHED and can_enter(t, user) and unfinish_block_reason(t) is None


@transaction.atomic
def unfinish(t: Tournament, actor=None) -> int:
    """Вернуть последний завершённый турнир: откатить рейтинг, турнир снова идёт.
    Возвращает число отменённых строк рейтинга."""
    t = Tournament.objects.select_for_update().get(pk=t.pk)
    blocked = unfinish_block_reason(t)
    if blocked:
        raise ResultsError(blocked)
    from rating.services import revert_tournament

    reverted = revert_tournament(t, actor=actor)
    t.status = Tournament.STATUS_IN_PROGRESS
    t.finished_at = None
    t.save(update_fields=["status", "finished_at"])
    return reverted


def rating_changes(t: Tournament) -> list:
    """Изменение рейтинга участников по этому турниру: было, изменение, стало."""
    if t.status != Tournament.STATUS_FINISHED:
        return []
    from rating.models import RatingEntry

    from .schedule import _person

    rows = (
        RatingEntry.objects.filter(tournament=t, is_reverted=False)
        .select_related("profile__user")
        .order_by("created_at", "id")
    )
    by_user: dict = {}
    for e in rows:
        u = e.profile.user
        if u.pk not in by_user:
            by_user[u.pk] = {"player": _person(u), "before": e.before, "delta": 0, "after": e.after}
        c = by_user[u.pk]
        c["delta"] += e.delta
        c["after"] = e.after
    out = sorted(by_user.values(), key=lambda c: -c["delta"])
    return [{**c, "before": str(c["before"]), "delta": str(c["delta"]), "after": str(c["after"])} for c in out]


def manual_snapshot(t: Tournament) -> list:
    """Матчи, внесённые вручную, по порядку ввода."""
    if t.results_mode != MANUAL:
        return []
    from .schedule import _person

    return [
        {
            "id": m.id,
            "number": m.match_number,
            "player1": _person(m.player1),
            "player2": _person(m.player2),
            "score1": m.score1,
            "score2": m.score2,
            "winner": str(m.winner_id) if m.winner_id else None,
        }
        for m in t.matches.select_related("player1", "player2").order_by("match_number")
    ]
