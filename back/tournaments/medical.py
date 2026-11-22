"""Допуск участников врачом соревнований ✳ (22.11.2026, ROLES.md роль 18;
flows/18 Э18.2–Э18.4; главная схема `flow-tournaments`: «Врач допустил по
справке? — нет: не допущен врачом; да: в списке участников»).

Врач — роль `competition_doctor` с областью «турнир», одна на турнир. Он
ставит участнику «допущен» или «не допущен» (с причиной). **Допуск действует,
только если врач в турнире назначен** — у турниров без врача участники идут в
жеребьёвку как раньше (правило наше: иначе все прежние турниры встали бы).
С врачом в жеребьёвку и расписание (`schedule.build`) идут только допущенные.
Решать можно, пока расписание не отправлено: дальше состав не меняется.
"""
from django.utils import timezone

from users.models import Role

from .models import Tournament, TournamentParticipant


class MedicalError(ValueError):
    pass


def doctor_of(tournament: Tournament):
    role = Role.objects.filter(kind=Role.KIND_COMPETITION_DOCTOR, scope="tournament", scope_id=tournament.id).select_related("user").first()
    return role.user if role else None


def is_doctor(tournament: Tournament, user) -> bool:
    return Role.objects.filter(kind=Role.KIND_COMPETITION_DOCTOR, scope="tournament", scope_id=tournament.id, user_id=getattr(user, "id", None)).exists()


def requires_admission(tournament: Tournament) -> bool:
    return Role.objects.filter(kind=Role.KIND_COMPETITION_DOCTOR, scope="tournament", scope_id=tournament.id).exists()


def playing(tournament: Tournament):
    """Участники, которые идут в жеребьёвку: с врачом — только допущенные."""
    qs = tournament.participants.all()
    if requires_admission(tournament):
        qs = qs.filter(medical_status=TournamentParticipant.MEDICAL_ADMITTED)
    return qs


def decide(tournament: Tournament, user_id, status: str, note: str, by) -> TournamentParticipant:
    if not is_doctor(tournament, by):
        raise MedicalError("Допускает врач соревнований этого турнира.")
    if getattr(tournament, "schedule_status", "none") == "final":
        raise MedicalError("Расписание отправлено — состав не меняется.")
    if status not in ("", TournamentParticipant.MEDICAL_ADMITTED, TournamentParticipant.MEDICAL_DENIED):
        raise MedicalError("Решение — «допущен» или «не допущен».")
    note = (note or "").strip()
    if status == TournamentParticipant.MEDICAL_DENIED and not note:
        raise MedicalError("Укажите причину недопуска.")
    p = tournament.participants.filter(user_id=user_id).first()
    if p is None:
        raise MedicalError("Такого участника в турнире нет.")
    p.medical_status = status
    p.medical_note = note[:300]
    p.medical_by = by if status else None
    p.medical_at = timezone.now() if status else None
    p.save(update_fields=["medical_status", "medical_note", "medical_by", "medical_at"])
    return p
