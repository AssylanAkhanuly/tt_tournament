"""Турнир протоколом вручную ✳ (11.09.2026).

Турниры федерации пока идут вне системы, а пилоту нужны настоящие
результаты. Председатель ГСК заводит турнир, вносит участников и кто с кем
сыграл, и утверждает протокол — рейтинг считается тем же движком, что у
турнира из сетки (`services.set_protocol` → `apply_tournament`).

Правила:
- вручную правятся только турниры формата «протокол вручную»; у турнира из
  сетки матчи ведёт судья, здесь их не трогаем;
- утверждённый протокол закрыт: сначала «вернуть на доработку». Возврат —
  с той же защитой, что пересчёт: если после турнира у участников были
  другие изменения, он отказан (каскадного исправления п. 21.6 нет);
- матч — только между участниками, без ничьей (в настольном теннисе у
  матча всегда есть победитель).
"""
from datetime import date, datetime, time
from typing import Dict, Optional

from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone

from tournaments.models import Match, Tournament, TournamentParticipant

from . import engine, services
from .models import RatingEntry


class ManualError(ValueError):
    """Действие с протоколом вручную невозможно. Текст объясняет почему."""


def _applied(tournament) -> bool:
    return RatingEntry.objects.filter(tournament=tournament, is_reverted=False).exists()


def is_editable(tournament) -> bool:
    """Можно ли править участников и матчи."""
    return tournament.format == Tournament.FORMAT_MANUAL and not _applied(tournament)


def _check_editable(tournament) -> None:
    if tournament.format != Tournament.FORMAT_MANUAL:
        raise ManualError("Участников и матчи вручную правят только у турнира, заведённого протоколом")
    if _applied(tournament):
        raise ManualError("Турнир уже учтён в рейтинге — чтобы править, верните его на доработку")


#: До скольких побед играется матч: до двух, трёх или четырёх выигранных партий.
GAMES_TO_WIN = (2, 3, 4)


def create_tournament(*, name: str, when: Optional[date], level: str, actor, games_to_win=3) -> Tournament:
    """Завести турнир протоколом: название, дата, уровень (C, п. 13) и до
    скольких побед играется матч. Дата — не позже сегодняшней: вносится
    сыгранный турнир."""
    name = (name or "").strip()
    if not name:
        raise ManualError("Название турнира обязательно")
    if level not in engine.LEVELS:
        raise ManualError("Уровень соревнования не из таблицы п. 13")
    try:
        games_to_win = int(games_to_win)
    except (TypeError, ValueError):
        games_to_win = 0
    if games_to_win not in GAMES_TO_WIN:
        raise ManualError("Матч играется до 2, 3 или 4 побед")
    today = timezone.localdate()
    when = when or today
    if when > today:
        raise ManualError("Дата турнира — не позже сегодняшней: вносится сыгранный турнир")
    return Tournament.objects.create(
        name=name,
        created_by=actor,
        starts_at=timezone.make_aware(datetime.combine(when, time(12, 0))),
        level=level,
        is_rating=True,
        format=Tournament.FORMAT_MANUAL,
        status=Tournament.STATUS_OPEN,
        games_to_win=games_to_win,
    )


@transaction.atomic
def add_participant(tournament, user) -> TournamentParticipant:
    """Добавить спортсмена; карточки нет — заводится новая со старта 1,00 (п. 6.1)."""
    _check_editable(tournament)
    if tournament.participants.filter(user=user).exists():
        raise ManualError("Спортсмен уже в турнире")
    services.get_or_create_profile(user)
    return TournamentParticipant.objects.create(tournament=tournament, user=user)


@transaction.atomic
def add_new_athlete(tournament, **athlete) -> TournamentParticipant:
    """Новый спортсмен сразу участником — одной транзакцией: если турнир его
    не примет, карточка без турнира в листе не останется."""
    _check_editable(tournament)
    return add_participant(tournament, services.create_athlete(**athlete))


@transaction.atomic
def remove_participant(tournament, user) -> None:
    _check_editable(tournament)
    if tournament.matches.filter(Q(player1=user) | Q(player2=user)).exists():
        raise ManualError("У спортсмена есть матчи в турнире — сначала удалите их")
    tournament.participants.filter(user=user).delete()


@transaction.atomic
def add_match(tournament, a, b, score_a, score_b) -> Match:
    """Кто с кем сыграл и счёт. Победитель — у кого больше."""
    _check_editable(tournament)
    ids = set(tournament.participants.values_list("user_id", flat=True))
    if a.pk not in ids or b.pk not in ids:
        raise ManualError("Матч — только между участниками турнира")
    if a.pk == b.pk:
        raise ManualError("Спортсмен не играет сам с собой")
    try:
        sa, sb = int(score_a), int(score_b)
    except (TypeError, ValueError):
        raise ManualError("Счёт — целые числа")
    if sa < 0 or sb < 0:
        raise ManualError("Счёт не может быть отрицательным")
    if sa == sb:
        raise ManualError("В настольном теннисе ничьих нет — у матча есть победитель")
    n = tournament.games_to_win
    if max(sa, sb) != n or min(sa, sb) >= n:
        raise ManualError("Матч до %d побед: у победителя ровно %d партии, у проигравшего меньше" % (n, n))

    number = (tournament.matches.aggregate(n=Max("match_number"))["n"] or 0) + 1
    return Match.objects.create(
        tournament=tournament,
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
def remove_match(tournament, match_pk) -> None:
    _check_editable(tournament)
    deleted, _ = tournament.matches.filter(pk=match_pk).delete()
    if not deleted:
        raise ManualError("Матч не найден")


def _date_block_reason(tournament) -> Optional[str]:
    """Турнир вручную не встаёт раньше уже учтённого у его участников.

    Сборка считает от текущих значений. Внести турнир задним числом значило бы
    посчитать его от чисел, в которые уже вошли более поздние результаты, и
    записать в историю с ранней датой — «рейтинг до» пошёл бы не по порядку.
    Пересчёта цепочкой нет (п. 21.6), поэтому турниры вносятся по порядку
    дат. Старт и объединение карточек не в счёт: это не результаты.
    """
    when = services._tournament_date(tournament)
    later = (
        RatingEntry.objects.filter(
            profile__user_id__in=tournament.participants.values_list("user_id", flat=True),
            is_reverted=False,
            occurred_at__gt=when,
        )
        .exclude(tournament=tournament)
        .exclude(kind__in=[RatingEntry.KIND_START, RatingEntry.KIND_MERGE])
        .select_related("profile__user")
        .order_by("occurred_at")
        .first()
    )
    if later is None:
        return None
    return (
        "У спортсмена %s есть изменения рейтинга после даты турнира (%s): турниры вносятся "
        "по порядку дат, пересчёта задним числом нет (п. 21.6)" % (later.profile.user.name, when.strftime("%d.%m.%Y"))
    )


@transaction.atomic
def approve(tournament, *, level: str, places: Dict[str, int], no_third_place_match: bool, actor=None):
    """Утвердить протокол: у турнира вручную — завершить и учесть в рейтинге;
    у любого — уровень, места и пересчёт (`services.set_protocol`)."""
    if tournament.format == Tournament.FORMAT_MANUAL and not _applied(tournament):
        if not tournament.matches.exists():
            raise ManualError("В протоколе нет матчей — учитывать нечего")
        late = _date_block_reason(tournament)
        if late:
            raise ManualError(late)
        if tournament.status != Tournament.STATUS_FINISHED:
            tournament.status = Tournament.STATUS_FINISHED
            tournament.save(update_fields=["status"])
    services.set_protocol(
        tournament, level=level, places=places, no_third_place_match=no_third_place_match, actor=actor
    )
    return tournament


def preview(tournament, *, level: str, places: Dict[str, int], no_third_place_match: bool) -> dict:
    """Предпросмотр утверждения — считается по-настоящему и откатывается.

    У черновика вручную утверждение ещё и завершает турнир, поэтому
    предпросмотр идёт через `approve()`, а не голый `set_protocol()`: иначе
    числа предпросмотра и сохранения разошлись бы. Остальное — как
    `services.preview_protocol`.
    """
    if not is_editable(tournament):
        return services.preview_protocol(
            tournament, level=level, places=places, no_third_place_match=no_third_place_match
        )
    with transaction.atomic():
        try:
            approve(tournament, level=level, places=places, no_third_place_match=no_third_place_match)
            detail = services.protocol_detail(tournament)
        except (services.ProtocolError, ManualError) as e:
            detail = services.protocol_detail(tournament)
            detail["blocked"] = str(e)
        transaction.set_rollback(True)
    tournament.refresh_from_db()
    return detail


@transaction.atomic
def return_for_rework(tournament, actor=None):
    """Снять учёт турнира, чтобы поправить участников и матчи.

    Прежние строки остаются в истории отменёнными (п. 20). Отказ — если после
    турнира у участников были другие изменения рейтинга. Только у турнира
    вручную: откат турнира из сетки — дело его организатора (RATING.md §11).
    """
    if tournament.format != Tournament.FORMAT_MANUAL:
        raise ManualError("На доработку возвращается только турнир, заведённый протоколом вручную")
    blocked = services.protocol_block_reason(tournament)
    if blocked:
        raise ManualError(blocked)
    services.revert_tournament(tournament, actor=actor)
    if tournament.format == Tournament.FORMAT_MANUAL:
        tournament.status = Tournament.STATUS_OPEN
        tournament.save(update_fields=["status"])
    return tournament
