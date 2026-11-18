"""Допуск заявки на турнир ✳ (19.11.2026, ТЗ §4.1, §8.2). Устройство — ADMISSION.md.

Один путь для всех заявителей: спортсмен сам, старший тренер региона списком,
дальше — клуб. Ручки (`views.py`) только переводят его в HTTP.

Заявка проходит целиком или не проходит вовсе — «одна заявка на весь список,
решение по заявке целиком» (ROLES.md, роль 12): лишний по квоте валит всю
заявку, а не отрезается молча. Порядок:

1. заявитель разрешён турниром (`applicant_kinds`), у подающего есть его роль;
2. приём открыт, турнир не завершён, расписание не отправлено (`gate`);
3. каждый спортсмен — «его» и ещё не в турнире;
4. проверки `checks.CHECKS`: возраст, предел участников, квота региона.

Чего ещё нет: заявки как отдельной записи со статусом (ждёт допуска врача,
отклонена с причиной, отозвана) — прошедший проверку сразу встаёт в состав;
взноса и ценза по рейтингу (см. `checks.py`).
"""
from typing import List, Sequence

from django.db import transaction

from ..models import Tournament, TournamentGroup, TournamentParticipant
from . import applicants, checks
from .errors import AdmissionError, athlete_error

__all__ = ["AdmissionError", "apply", "gate", "locked", "can_apply_as", "PLAYERS_CLOSED", "LOCKED"]

PLAYERS_CLOSED = "Приём заявок игроков закрыт."
LOCKED = "Заявки уже поданы — условия допуска не меняются."


def gate(tournament: Tournament) -> None:
    """Принимает ли турнир заявки вообще — общее для всех заявителей."""
    if tournament.status == Tournament.STATUS_FINISHED:
        raise AdmissionError("Турнир завершён — нельзя зарегистрироваться.")
    if not tournament.player_recruitment_active():
        raise AdmissionError(PLAYERS_CLOSED)
    if tournament.schedule_status == "final":
        raise AdmissionError("Расписание отправлено — состав не меняется.")
    if tournament.status == Tournament.STATUS_IN_PROGRESS:
        if not TournamentGroup.objects.filter(tournament=tournament).exists():
            raise AdmissionError("Плей-офф уже идёт — присоединиться нельзя.")


def permit(tournament: Tournament, by, applicant_key: str) -> applicants.Applicant:
    """Разрешён ли турниром этот заявитель и есть ли у подающего его роль."""
    applicant = applicants.get(applicant_key)
    if applicant.key not in tournament.applicant_kinds:
        allowed = applicants.labels(tournament.applicant_kinds) or "никто — приём не настроен"
        raise AdmissionError("Заявку на этот турнир подаёт: %s." % allowed)
    if not applicant.acts(by):
        raise AdmissionError("У вас нет роли «%s»." % applicant.label, status=403)
    return applicant


def apply(tournament: Tournament, by, applicant_key: str, athletes: Sequence) -> List[TournamentParticipant]:
    """Подать заявку: все спортсмены встают в состав или никто."""
    applicant = permit(tournament, by, applicant_key)
    athletes = list({a.pk: a for a in athletes}.values())
    if not athletes:
        raise AdmissionError("В заявке нет спортсменов.")

    with transaction.atomic():
        # Блокировка турнира: две заявки одновременно не пройдут квоту вдвоём.
        tournament = Tournament.objects.select_for_update().get(pk=tournament.pk)
        gate(tournament)

        errors = [athlete_error(a, applicant.not_owned) for a in athletes if not applicant.owns(by, a)]
        already = set(
            TournamentParticipant.objects.filter(tournament=tournament, user__in=athletes)
            .values_list("user_id", flat=True)
        )
        errors += [athlete_error(a, "Уже в турнире.") for a in athletes if a.pk in already]
        if not errors:
            for check in checks.CHECKS:
                errors += check(tournament, athletes)
        if errors:
            raise AdmissionError("Заявка не прошла проверку.", errors)

        return [
            TournamentParticipant.objects.create(
                tournament=tournament, user=a, entered_by=by, entered_as=applicant.key,
            )
            for a in athletes
        ]


def locked(tournament: Tournament) -> bool:
    """Условия допуска заморожены: заявки уже есть или турнир начат. Иначе
    правка квоты посреди приёма сделала бы поданные заявки недействительными."""
    return tournament.status != Tournament.STATUS_OPEN or tournament.participants.exists()


def can_apply_as(user, tournament: Tournament) -> List[str]:
    """В каком качестве этот человек может подать заявку на турнир — для экрана."""
    if not user or not user.is_authenticated:
        return []
    return [
        k for k in tournament.applicant_kinds
        if k in applicants.REGISTRY and applicants.REGISTRY[k].acts(user)
    ]
