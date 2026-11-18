"""Отказ в допуске. Текст — для человека; `errors` — по спортсменам."""
from typing import List, Optional


class AdmissionError(Exception):
    """Заявка не проходит. `status` — 400 (не проходит по правилам) или 403
    (у подающего нет роли, от имени которой он подаёт)."""

    def __init__(self, detail: str, errors: Optional[List[dict]] = None, status: int = 400):
        super().__init__(detail)
        self.detail = detail
        self.errors = errors or []
        self.status = status


def athlete_error(athlete, detail: str) -> dict:
    """Строка отказа по одному спортсмену — экран подсвечивает его в списке."""
    return {"athlete_id": str(athlete.pk), "name": athlete.name, "detail": detail}


def common_error(detail: str) -> dict:
    """Отказ по заявке целиком (предел участников), без спортсмена."""
    return {"athlete_id": None, "name": None, "detail": detail}
