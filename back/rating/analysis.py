"""Следствия из коэффициентов: что выбранные значения значат на практике.

Это не расчёт рейтинга, а его чтение — ради этого федерация и просила пилот.
Живёт на сервере вместе с движком: доля ожидаемых побед считается по той же
формуле п. 9.3, и держать её копию на фронте значит завести вторую реализацию.
"""
from __future__ import annotations

from typing import Optional

from .engine import Params, expected_score, match_delta, round2


def win_share(strong: float, weak: float, d: float) -> float:
    """Ожидаемая доля побед более сильного при выбранном масштабе D (п. 9.3)."""
    return expected_score(strong, weak, d)


def matches_to_level(from_value: float, level: float, params: Params, limit: int = 400) -> Optional[int]:
    """Сколько побед подряд над соперниками уровня `level` нужно, чтобы дойти до
    него от `from_value`. None — при таких коэффициентах не доходит никогда."""
    rating = round2(from_value)
    for n in range(limit):
        if rating >= level:
            return n
        transition = n < params.transition_matches
        k = params.k_transition if transition else params.k_standard
        cap = (
            0.0
            if (not params.max_delta or (transition and not params.cap_in_transition))
            else params.max_delta
        )
        delta = round2(
            match_delta(rating=rating, opponent=level, won=True, d=params.d, k=k, c=1.0, p=1.0,
                        max_delta=cap)
        )
        if delta <= 0:
            return None
        rating = round2(rating + delta)
    return None


#: Опорные точки шкалы из п. 6 Положения: КМС 40,00 и МС 50,00.
LEVEL_KMS = 40.0
LEVEL_MS = 50.0


def insights(params: Params) -> dict:
    """Показатели, которые экран калибровки показывает рядом с числами."""
    return {
        "win_share_ms_over_kms": round(win_share(LEVEL_MS, LEVEL_KMS, params.d), 4),
        "win_share_gap_5": round(win_share(LEVEL_KMS + 5, LEVEL_KMS, params.d), 4),
        "win_share_gap_20": round(win_share(LEVEL_KMS + 20, LEVEL_KMS, params.d), 4),
        "matches_new_to_kms": matches_to_level(1.0, LEVEL_KMS, params),
    }
