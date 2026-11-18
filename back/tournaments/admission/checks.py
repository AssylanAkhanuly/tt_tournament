"""Проверки допуска ✳ (19.11.2026, ТЗ §4: «форматно-логический контроль
системы не пропускает заявку, если…»).

Каждая проверка — отдельная функция `(tournament, athletes) -> [ошибки]` и
читает только свою настройку турнира; настройка пустая — проверка молчит.
Новая проверка — функция здесь и строка в `CHECKS`. Проверки считают и тех,
кто уже в турнире: квота и предел — на всех заявленных, а не на одну заявку.

Чего ещё нет: взноса (нет данных об оплате — роли бухгалтера нет) и ценза по
рейтингу (у турнира нет поля со значением ценза; ТЗ §4.1, gaps Э1.3).
"""
from collections import Counter
from typing import List

from rating.ages import any_category_q
from rating.models import RatingProfile

from ..models import TournamentParticipant
from .errors import athlete_error, common_error


def _regions(athletes) -> dict:
    """{user_id: регион} из рейтинговых карточек; без региона — нет в словаре."""
    rows = RatingProfile.objects.filter(user__in=athletes).exclude(region="").values_list("user_id", "region")
    return dict(rows)


def age(tournament, athletes) -> List[dict]:
    """Проходит хотя бы в одну возрастную категорию турнира (`rating/ages.py` —
    то же правило, что у отбора кандидатов протокола). Категорий нет — без
    ограничения. Простые границы в годах (`age_min`/`age_max`) — сведения для
    афиши, не допуск: на какую дату считать полные годы, документа нет."""
    categories = list(tournament.age_categories.all())
    if not categories:
        return []
    fits = set(
        RatingProfile.objects.filter(user__in=athletes).filter(any_category_q(categories))
        .values_list("user_id", flat=True)
    )
    allowed = "; ".join(c.label for c in categories)
    return [
        athlete_error(a, "Не проходит по возрасту (%s)." % allowed)
        for a in athletes if a.pk not in fits
    ]


def participant_limit(tournament, athletes) -> List[dict]:
    """Предел участников по положению: 251-й при пределе 250 не подаст (ТЗ §4)."""
    limit = tournament.participant_limit
    if limit is None:
        return []
    already = TournamentParticipant.objects.filter(tournament=tournament).count()
    if already + len(athletes) <= limit:
        return []
    return [common_error("Предел участников — %d, мест осталось: %d." % (limit, max(limit - already, 0)))]


def region_quota(tournament, athletes) -> List[dict]:
    """Не больше N спортсменов от региона — с учётом уже заявленных. Спортсмен
    без региона в квоту не считается: квоты «ничьих» положение не знает.
    Отказ получают последние по порядку заявки — те, кто в квоту не влез."""
    quota = tournament.region_quota
    if quota is None:
        return []
    regions = _regions(athletes)
    asked = Counter(regions.values())
    errors = []
    for region, n in asked.items():
        already = TournamentParticipant.objects.filter(
            tournament=tournament, user__rating_profile__region=region
        ).count()
        if already + n > quota:
            over = [a for a in athletes if regions.get(a.pk) == region][max(quota - already, 0):]
            text = "Сверх квоты региона «%s»: квота %d, уже заявлено %d, в заявке %d." % (region, quota, already, n)
            errors += [athlete_error(a, text) for a in over]
    return errors


# Порядок — порядок сообщений на экране.
CHECKS = [age, participant_limit, region_quota]
