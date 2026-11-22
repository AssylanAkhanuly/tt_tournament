"""Доска планов подготовки ✳ (21.11.2026, NATIONAL.md «Доска планов»).

Строка на спортсмена, на ней пункты его планов за окно дат. Проверяется то, что
сломается при поломке: состояние пункта (выполнено / идёт / запланировано /
просрочено) считает сервер; сбор и старт лежат на датах мероприятия, работа — на
дне срока; пункт вне окна не приходит; без плана в окне — `plan: null`; врач
планов не видит — 403; личный тренер видит только своих."""
import datetime

import pytest
from django.utils import timezone

from national import board
from national.models import NationalTeamMember, PlanItem, TrainingEvent, TrainingPlan
from national.tests.test_api import athlete, client_for, make_user
from users.models import Role

pytestmark = pytest.mark.django_db
TODAY = datetime.date(2026, 12, 10)
D = datetime.timedelta


@pytest.fixture
def team():
    head = make_user(1, "Главный тренер", Role.KIND_NATIONAL_HEAD_COACH)
    personal = make_user(2, "Личный тренер", Role.KIND_PERSONAL_COACH)
    doctor = make_user(3, "Врач", Role.KIND_NATIONAL_DOCTOR)
    a, b = athlete(100, "Спортсмен А"), athlete(101, "Спортсмен Б")
    ma = NationalTeamMember.objects.create(user=a, personal_coach=personal)
    mb = NationalTeamMember.objects.create(user=b)
    plan = TrainingPlan.objects.create(member=ma, starts_on=TODAY - D(20), ends_on=TODAY + D(40), status="approved")
    camp = TrainingEvent.objects.create(kind="camp", title="УТС Алматы", city="Алматы",
                                        starts_on=TODAY - D(1), ends_on=TODAY + D(3))
    items = {
        "done": PlanItem.objects.create(plan=plan, title="Тест ОФП", due=TODAY - D(5), done=True),
        "overdue": PlanItem.objects.create(plan=plan, title="Видеоразбор", due=TODAY - D(2)),
        "planned": PlanItem.objects.create(plan=plan, title="Подача", due=TODAY + D(4)),
        "live": PlanItem.objects.create(plan=plan, kind="camp", title="Сбор", event=camp),
        "far": PlanItem.objects.create(plan=plan, title="Вне окна", due=TODAY + D(30)),
    }
    return {"head": head, "personal": personal, "doctor": doctor, "ma": ma, "mb": mb, "items": items, "plan": plan}


def test_item_state_is_decided_by_server(team):
    rows = board.plan_board(team["head"], TODAY - D(7), TODAY + D(7), TODAY)
    row = next(r for r in rows if r["member"].pk == team["ma"].pk)
    got = {i["title"]: (i["state"], i["starts_on"], i["ends_on"]) for i in row["items"]}
    assert got["Тест ОФП"] == ("done", TODAY - D(5), TODAY - D(5))
    assert got["Видеоразбор"] == ("overdue", TODAY - D(2), TODAY - D(2))
    assert got["Подача"] == ("planned", TODAY + D(4), TODAY + D(4))
    assert got["Сбор"] == ("live", TODAY - D(1), TODAY + D(3))
    assert "Вне окна" not in got
    assert row["plan"].pk == team["plan"].pk


def test_member_without_plan_in_window_has_none(team):
    rows = board.plan_board(team["head"], TODAY - D(7), TODAY + D(7), TODAY)
    row = next(r for r in rows if r["member"].pk == team["mb"].pk)
    assert row["plan"] is None and row["items"] == []


def test_who_sees_the_board(team):
    assert client_for(team["doctor"]).get("/api/national/plans/board/").status_code == 403
    r = client_for(team["personal"]).get(
        "/api/national/plans/board/", {"from": (TODAY - D(7)).isoformat(), "to": (TODAY + D(7)).isoformat()})
    assert r.status_code == 200
    rows = r.json()["rows"]
    assert [x["member"]["person"]["name"] for x in rows] == ["Спортсмен А"]
    # План согласован — личному тренеру пункт с доски не добавить, новый план — можно.
    assert rows[0]["can_add"] is False and rows[0]["can_create_plan"] is True
    head = client_for(team["head"]).get("/api/national/plans/board/", {"from": (TODAY - D(7)).isoformat(), "to": (TODAY + D(7)).isoformat()}).json()["rows"]
    by = {x["member"]["person"]["name"]: x for x in head}
    assert by["Спортсмен А"]["can_add"] is True and by["Спортсмен Б"]["can_add"] is False


def test_window_is_limited(team):
    r = client_for(team["head"]).get("/api/national/plans/board/", {"from": "2026-01-01", "to": "2026-12-31"})
    assert r.status_code == 400


# ── Растягивание пункта и создание диапазоном ✳ (22.11.2026) ──────────────────

def test_stretched_work_spans_its_days(team):
    head = client_for(team["head"])
    item = team["items"]["planned"]
    r = head.patch(f"/api/national/plan-items/{item.pk}/", {"starts_on": (TODAY + D(2)).isoformat(), "due": (TODAY + D(5)).isoformat()}, format="json")
    assert r.status_code == 200 and r.json()["starts_on"] == (TODAY + D(2)).isoformat()
    rows = board.plan_board(team["head"], TODAY - D(7), TODAY + D(7), TODAY)
    got = {i["title"]: (i["starts_on"], i["ends_on"]) for i in rows[0]["items"]}
    assert got["Подача"] == (TODAY + D(2), TODAY + D(5))
    # Начало, равное сроку, не хранится: пункт снова на одном дне.
    head.patch(f"/api/national/plan-items/{item.pk}/", {"starts_on": (TODAY + D(5)).isoformat(), "due": (TODAY + D(5)).isoformat()}, format="json")
    item.refresh_from_db()
    assert item.starts_on is None and item.due == TODAY + D(5)


def test_move_rules(team):
    head = client_for(team["head"])
    work, camp = team["items"]["planned"], team["items"]["live"]
    bad = head.patch(f"/api/national/plan-items/{work.pk}/", {"starts_on": (TODAY + D(6)).isoformat(), "due": (TODAY + D(5)).isoformat()}, format="json")
    assert bad.status_code == 400
    assert head.patch(f"/api/national/plan-items/{camp.pk}/", {"due": TODAY.isoformat()}, format="json").status_code == 400
    # План согласован — личному тренеру сроки не править.
    personal = client_for(team["personal"])
    assert personal.patch(f"/api/national/plan-items/{work.pk}/", {"due": TODAY.isoformat()}, format="json").status_code == 403
    work.refresh_from_db()
    assert work.due == TODAY + D(4)


def test_can_move_flag(team):
    rng = {"from": (TODAY - D(7)).isoformat(), "to": (TODAY + D(7)).isoformat()}
    head = client_for(team["head"]).get("/api/national/plans/board/", rng).json()["rows"]
    items = {i["title"]: i["can_move"] for i in next(x for x in head if x["member"]["person"]["name"] == "Спортсмен А")["items"]}
    assert items["Подача"] is True and items["Сбор"] is False
    personal = client_for(team["personal"]).get("/api/national/plans/board/", rng).json()["rows"]
    assert not any(i["can_move"] for i in personal[0]["items"])


def test_item_created_with_range(team):
    r = client_for(team["head"]).post(f"/api/national/plans/{team['plan'].pk}/items/", {
        "kind": "work", "title": "Многоволан", "starts_on": (TODAY + D(1)).isoformat(), "due": (TODAY + D(3)).isoformat()}, format="json")
    assert r.status_code == 201 and r.json()["starts_on"] == (TODAY + D(1)).isoformat()


# ── Профиль спортсмена ✳ (22.11.2026) ────────────────────────────────────────

def test_member_profile_and_item_state(team):
    head = client_for(team["head"])
    r = head.get(f"/api/national/members/{team['ma'].pk}/").json()
    assert r["profile"]["phone"] == "+77005550100"
    assert r["profile"]["joined"] == timezone.localtime(team["ma"].added_at).date().isoformat()
    # Строка состава несёт фото — карточки состава ✳ (22.11.2026); снимка нет — None.
    row = next(x for x in head.get("/api/national/members/").json() if x["id"] == str(team["ma"].pk))
    assert row["avatar"] is None
    plans = head.get(f"/api/national/members/{team['ma'].pk}/plans/").json()
    items = {i["title"]: i for i in plans[0]["items"]}
    assert items["Тест ОФП"]["state"] == "done"
    assert items["Сбор"]["city"] == "Алматы"
    assert items["Сбор"]["period"] == {"from": (TODAY - D(1)).isoformat(), "to": (TODAY + D(3)).isoformat()}
