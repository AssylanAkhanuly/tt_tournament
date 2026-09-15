"""Возраст спортсмена против возрастной категории соревнования ✳ (15.09.2026).

Замечания федерации (docs/refs/zamechaniya-reyting-i-vvod-rezultatov-2026-09-15.md):
категория соревнования — диапазон дат рождения («2009 г.р. и моложе» =
01.01.2009 — сегодня, «Ветераны 40–49» = 01.01.1977 — 31.12.1986), категорий у
соревнования может быть несколько, и при добавлении участников из рейтинга
показываются только те, кто родился в диапазоне.

Правило одно и живёт здесь, запросом к базе: по нему отбираются и кандидаты из
рейтинга, и помечаются участники турнира — двух реализаций, которые разойдутся,
нет. Границы включительно.

Спортсмен без даты рождения сверяется **по году** — наше допущение, подлежит
утверждению (QUESTIONS 5.17): у перенесённых из прежнего рейтинга год известен,
дата — не у всех. Год внутри диапазона лет подходит; нет ни даты, ни года — в
категорию не попадает.
"""
from datetime import date
from functools import reduce
from operator import or_
from typing import Dict, Iterable, List, Optional

from django.db.models import Q
from django.utils.dateparse import parse_date as _parse_date


def parse_date(value) -> Optional[date]:
    """«2009-01-01» → дата; пустое, чужой формат и несуществующий день → None."""
    if isinstance(value, date):
        return value
    try:
        return _parse_date(str(value or "").strip())
    except ValueError:
        return None


def born_between_q(born_from: date, born_to: date) -> Q:
    """Родился в диапазоне: по дате, а без неё — по году (см. шапку модуля)."""
    return Q(birth_date__gte=born_from, birth_date__lte=born_to) | Q(
        birth_date__isnull=True,
        birth_year__gte=born_from.year,
        birth_year__lte=born_to.year,
    )


def any_category_q(categories: Iterable) -> Q:
    """Проходит хотя бы в одну из категорий — «любые возраста» соревнования."""
    return reduce(or_, (born_between_q(c.born_from, c.born_to) for c in categories))


def label(born_from: date, born_to: date) -> str:
    """Подпись категории без названия: «01.01.1977 — 31.12.1986»."""
    return "%s — %s" % (born_from.strftime("%d.%m.%Y"), born_to.strftime("%d.%m.%Y"))


def membership(categories: Iterable, user_ids: List) -> Dict[object, List[int]]:
    """В какие категории турнира попадает каждый из спортсменов: {user_id: [id категории]}."""
    from .models import RatingProfile

    out: Dict[object, List[int]] = {}
    for c in categories:
        fits = RatingProfile.objects.filter(user_id__in=user_ids).filter(born_between_q(c.born_from, c.born_to))
        for uid in fits.values_list("user_id", flat=True):
            out.setdefault(uid, []).append(c.pk)
    return out
