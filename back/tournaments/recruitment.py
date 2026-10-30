"""Приём заявок судей ✳ (29.10.2026, решение владельца продукта; ТЗ §4.3,
экраны Э0.9–Э0.10). Ручки (`views.py`) только принимают запрос и отдают ответ —
правила здесь.

Приём открыт, пока на турнире включён переключатель и не прошёл срок
(`Tournament.referee_recruitment_active`). Судья отмечает одну или несколько
должностей; председатель ГСК назначает на одну из отмеченных — тогда судья
встаёт в коллегию турнира по правилам `roster.add_referee` (единственные
должности по одному) — или отклоняет. Чего ещё нет: резерва с очередью и
авто-отказа по закрытию приёма (Э0.10), причины отказа, уведомлений.
"""
from django.db import transaction
from django.utils import timezone

from users.models import User

from . import roster
from .models import RefereeApplication, Tournament


class RecruitmentError(Exception):
    """Нельзя; текст — для человека."""


def _clean_positions(positions) -> list:
    if not isinstance(positions, list) or not positions:
        raise RecruitmentError("Отметьте хотя бы одну должность.")
    if any(p not in roster.POSITIONS for p in positions):
        raise RecruitmentError("Неизвестная судейская должность.")
    # По старшинству, без повторов — порядок отметки ничего не значит.
    return [p for p in roster.POSITIONS if p in positions]


def mine(tournament: Tournament, user: User):
    return RefereeApplication.objects.filter(tournament=tournament, user=user).first()


def apply(tournament: Tournament, user: User, positions) -> RefereeApplication:
    if not tournament.referee_recruitment_active():
        raise RecruitmentError("Приём заявок судей закрыт.")
    positions = _clean_positions(positions)
    if roster.referee_role(tournament, user.id):
        raise RecruitmentError("Вы уже в судейской коллегии турнира.")
    current = mine(tournament, user)
    if current and current.status == RefereeApplication.STATUS_PENDING:
        raise RecruitmentError("Заявка на этот турнир уже подана.")
    if current:
        # После отказа (или снятия из коллегии) — та же заявка заново, а не вторая.
        current.positions = positions
        current.status = RefereeApplication.STATUS_PENDING
        current.position = ""
        current.decided_at = None
        current.decided_by = None
        current.save()
        return current
    return RefereeApplication.objects.create(tournament=tournament, user=user, positions=positions)


def withdraw(tournament: Tournament, user: User) -> None:
    current = mine(tournament, user)
    if current is None or current.status != RefereeApplication.STATUS_PENDING:
        raise RecruitmentError("Отозвать можно только заявку, по которой ещё нет решения.")
    current.delete()


def _pending(application: RefereeApplication):
    if application.status != RefereeApplication.STATUS_PENDING:
        raise RecruitmentError("По заявке уже есть решение.")


def accept(application: RefereeApplication, position: str, by: User) -> RefereeApplication:
    _pending(application)
    if position not in application.positions:
        raise RecruitmentError("Назначить можно только на должность из заявки.")
    with transaction.atomic():
        try:
            roster.add_referee(application.tournament, application.user, position)
        except roster.RosterError as e:
            raise RecruitmentError(str(e))
        application.status = RefereeApplication.STATUS_ACCEPTED
        application.position = position
        application.decided_at = timezone.now()
        application.decided_by = by
        application.save()
    return application


def reject(application: RefereeApplication, by: User) -> RefereeApplication:
    _pending(application)
    application.status = RefereeApplication.STATUS_REJECTED
    application.decided_at = timezone.now()
    application.decided_by = by
    application.save()
    return application
