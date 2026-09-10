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


def create_tournament(*, name: str, when: Optional[date], level: str, actor) -> Tournament:
    """Завести турнир протоколом: название, дата, уровень (C, п. 13)."""
    name = (name or "").strip()
    if not name:
        raise ManualError("Название турнира обязательно")
    if level not in engine.LEVELS:
        raise ManualError("Уровень соревнования не из таблицы п. 13")
    when = when or timezone.localdate()
    return Tournament.objects.create(
        name=name,
        created_by=actor,
        starts_at=timezone.make_aware(datetime.combine(when, time(12, 0))),
        level=level,
        is_rating=True,
        format=Tournament.FORMAT_MANUAL,
        status=Tournament.STATUS_OPEN,
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


@transaction.atomic
def approve(tournament, *, level: str, places: Dict[str, int], no_third_place_match: bool, actor=None):
    """Утвердить протокол: у турнира вручную — завершить и учесть в рейтинге;
    у любого — уровень, места и пересчёт (`services.set_protocol`)."""
    if tournament.format == Tournament.FORMAT_MANUAL and not _applied(tournament):
        if not tournament.matches.exists():
            raise ManualError("В протоколе нет матчей — учитывать нечего")
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
    турнира у участников были другие изменения рейтинга.
    """
    blocked = services.protocol_block_reason(tournament)
    if blocked:
        raise ManualError(blocked)
    services.revert_tournament(tournament, actor=actor)
    if tournament.format == Tournament.FORMAT_MANUAL:
        tournament.status = Tournament.STATUS_OPEN
        tournament.save(update_fields=["status"])
    return tournament
