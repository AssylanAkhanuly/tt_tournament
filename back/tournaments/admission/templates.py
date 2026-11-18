"""Вид соревнования засевает условия допуска турнира ✳ (19.11.2026).

Значения **копируются**, а не читаются из шаблона на лету: правка шаблона
потом не трогает заведённые турниры (см. `TournamentTemplate`).
"""
from ..models import Tournament, TournamentTemplate
from .errors import AdmissionError

# Поля, которые шаблон переносит в турнир. Новое условие допуска — строка здесь
# и одноимённое поле у обоих моделей.
SEEDED = ("applicant_kinds", "participant_limit", "region_quota")


def find(code: str) -> TournamentTemplate:
    template = TournamentTemplate.objects.filter(code=code).first()
    if template is None:
        raise AdmissionError("Неизвестный вид соревнования.")
    if template.is_team:
        # Командной ветки (команды, составы, туры) ещё нет — QUESTIONS 11.x.
        raise AdmissionError("Командные соревнования пока не заводятся.")
    return template


def seed(tournament: Tournament, template: TournamentTemplate) -> None:
    """Заполнить турнир значениями вида соревнования (без сохранения)."""
    tournament.template = template
    tournament.category = template.category
    for name in SEEDED:
        value = getattr(template, name)
        setattr(tournament, name, list(value) if isinstance(value, list) else value)
