"""Доска планов подготовки ✳ (21.11.2026, NATIONAL.md «Доска планов»).

Сводный вид: строка на члена сборной, на ней пункты его планов подготовки за
окно дат. Кого показывать — те же правила, что у карточки (`visible_members` и
`can_see_plans`); состояние пункта решает здесь сервер, экран его только
рисует.

Где пункт лежит во времени: сбор и старт — на датах мероприятия календаря
подготовки (`event.starts_on … ends_on`), работа — от начала до срока
(`starts_on … due`, без начала — на дне срока);
пункт без даты на доску не попадает — ему некуда встать."""
from datetime import date, timedelta
from typing import List, Optional

from .models import PlanItem, TrainingPlan
from .services import NationalError, can_see_plans, visible_members

MAX_DAYS = 62  # окно не длиннее двух месяцев — наше ограничение, чтобы ответ не рос без предела


def item_dates(item: PlanItem):
    if item.event_id:
        return item.event.starts_on, item.event.ends_on
    return item.starts_on or item.due, item.due


def item_state(item: PlanItem, starts_on: date, ends_on: date, today: date) -> str:
    """`done` — отмечен выполненным; `overdue` — последний день прошёл, а
    отметки нет; `live` — сегодня внутри его дат; иначе `planned`."""
    if item.done:
        return "done"
    if ends_on < today:
        return "overdue"
    if starts_on <= today:
        return "live"
    return "planned"


def window(start: Optional[date], end: Optional[date], today: date):
    start = start or today - timedelta(days=today.weekday())
    end = end or start + timedelta(days=6)
    if end < start:
        raise NationalError("Конец окна раньше начала.")
    if (end - start).days + 1 > MAX_DAYS:
        raise NationalError("Окно доски — не больше %d дней." % MAX_DAYS)
    return start, end


def plan_board(user, start: date, end: date, today: date) -> List[dict]:
    """Строки доски: `{member, plan, items}`. `plan` — план, чей период
    пересекает окно (последний по началу), или `None`; `items` — пункты всех
    планов члена, лежащие в окне, с датами и состоянием."""
    members = [m for m in visible_members(user).order_by("user__name") if can_see_plans(m, user)]
    plans = TrainingPlan.objects.filter(member__in=members, starts_on__lte=end, ends_on__gte=start)
    by_member = {}
    for p in plans.order_by("starts_on"):
        by_member[p.member_id] = p
    items = PlanItem.objects.filter(plan__member__in=members).select_related("event", "plan")
    rows = {m.pk: {"member": m, "plan": by_member.get(m.pk), "items": []} for m in members}
    for i in items:
        s, e = item_dates(i)
        if s is None or e < start or s > end:
            continue
        rows[i.plan.member_id]["items"].append({
            "item": i, "title": i.title, "kind": i.kind, "starts_on": s, "ends_on": e,
            "state": item_state(i, s, e, today), "plan_status": i.plan.status,
        })
    for r in rows.values():
        r["items"].sort(key=lambda x: (x["starts_on"], x["title"]))
    return [rows[m.pk] for m in members]
