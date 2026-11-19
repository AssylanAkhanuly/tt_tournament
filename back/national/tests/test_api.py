"""Национальная команда через API ✳ (19.11.2026, NATIONAL.md).

Проверяется то, что сломается при поломке прав и правил: состав ведёт только
главный тренер; врач видит состав, но не меняет его и не видит планов;
медкарту ведёт только врач, а тренер получает из неё допуск и ограничения
нагрузки — без диагнозов; допуск без срока и запись с обратным сроком
отбиваются; истёкший допуск виден как истёкший; прогресс плана — «N из M»."""
import datetime
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from rating.models import RatingProfile
from users.models import Role, User

pytestmark = pytest.mark.django_db

TODAY = datetime.date.today()


def make_user(n, name, *kinds):
    user = User.objects.create_user(phone="+7700555" + str(n).zfill(4), name=name, password="x")
    for k in kinds:
        Role.objects.create(user=user, kind=k)
    return user


def athlete(n, name, value="500"):
    user = make_user(n, name)
    RatingProfile.objects.create(user=user, value=Decimal(value), sex="m", region="Астана", birth_year=2005)
    return user


def client_for(user):
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.fixture
def world():
    coach = make_user(1, "Главный тренер", Role.KIND_NATIONAL_HEAD_COACH)
    doctor = make_user(2, "Врач сборной", Role.KIND_NATIONAL_DOCTOR)
    outsider = make_user(3, "Председатель", Role.KIND_GSK_CHAIRMAN)
    players = [athlete(100 + i, "Спортсмен %02d" % i, str(600 - i)) for i in range(3)]
    api = client_for(coach)
    r = api.post("/api/national/members/", {"user_id": str(players[0].id), "squad": "main", "age_group": "junior"}, format="json")
    assert r.status_code == 201, r.data
    return {"coach": api, "doctor": client_for(doctor), "outsider": client_for(outsider),
            "players": players, "member": r.data["id"]}


def test_roster_is_kept_by_head_coach_only(world):
    p = world["players"][1]
    assert world["doctor"].post("/api/national/members/", {"user_id": str(p.id)}, format="json").status_code == 403
    assert world["outsider"].get("/api/national/members/").status_code == 403
    r = world["coach"].post("/api/national/members/", {"user_id": str(p.id), "squad": "extended"}, format="json")
    assert r.status_code == 201
    assert r.data["squad"] == "extended" and r.data["age_group"] == "adult"
    again = world["coach"].post("/api/national/members/", {"user_id": str(p.id)}, format="json")
    assert again.status_code == 400 and "уже в сборной" in again.data["detail"]
    names = [m["person"]["name"] for m in world["doctor"].get("/api/national/members/").data]
    assert names == ["Спортсмен 00", "Спортсмен 01"]


def test_member_without_rating_card_is_refused(world):
    plain = make_user(50, "Без карточки")
    r = world["coach"].post("/api/national/members/", {"user_id": str(plain.id)}, format="json")
    assert r.status_code == 400


def test_candidates_exclude_members_and_go_by_rating(world):
    r = world["coach"].get("/api/national/members/candidates/?q=Спортсмен")
    assert [c["name"] for c in r.data] == ["Спортсмен 01", "Спортсмен 02"]
    assert world["doctor"].get("/api/national/members/candidates/").status_code == 403


def test_squad_change_and_removal(world):
    url = "/api/national/members/%s/" % world["member"]
    assert world["coach"].patch(url, {"squad": "extended"}, format="json").data["squad"] == "extended"
    assert world["coach"].patch(url, {"squad": "reserve"}, format="json").status_code == 400
    assert world["doctor"].delete(url).status_code == 403
    assert world["coach"].delete(url).status_code == 204
    assert world["coach"].get("/api/national/members/").data == []


def test_medical_card_is_kept_by_doctor_and_coach_sees_only_clearance_and_limits(world):
    url = "/api/national/members/%s/medical/" % world["member"]
    injury = {"kind": "injury", "date": str(TODAY), "title": "Растяжение связок голеностопа",
              "load_limit": "Без прыжковой работы", "until": str(TODAY + datetime.timedelta(days=14))}
    assert world["coach"].post(url, injury, format="json").status_code == 403
    assert world["doctor"].post(url, injury, format="json").status_code == 201
    clearance = {"kind": "clearance", "date": str(TODAY), "until": str(TODAY + datetime.timedelta(days=180))}
    assert world["doctor"].post(url, clearance, format="json").status_code == 201

    full = world["doctor"].get(url).data
    assert full["full"] is True and full["clearance"]["status"] == "ok"
    assert {r["kind"] for r in full["records"]} == {"injury", "clearance"}

    summary = world["coach"].get(url).data
    assert summary["full"] is False and "records" not in summary
    assert summary["limits"] == [{"load_limit": "Без прыжковой работы", "until": injury["until"]}]
    assert "Растяжение" not in str(summary)
    assert world["outsider"].get(url).status_code == 403

    row = world["coach"].get("/api/national/members/").data[0]
    assert row["clearance"]["status"] == "ok" and row["limits"] == 1


def test_clearance_needs_term_and_expired_one_shows_expired(world):
    url = "/api/national/members/%s/medical/" % world["member"]
    no_term = world["doctor"].post(url, {"kind": "clearance", "date": str(TODAY)}, format="json")
    assert no_term.status_code == 400
    backwards = {"kind": "illness", "date": str(TODAY), "until": str(TODAY - datetime.timedelta(days=1))}
    assert world["doctor"].post(url, backwards, format="json").status_code == 400
    old = {"kind": "clearance", "date": str(TODAY - datetime.timedelta(days=400)),
           "until": str(TODAY - datetime.timedelta(days=35))}
    assert world["doctor"].post(url, old, format="json").status_code == 201
    assert world["doctor"].get(url).data["clearance"]["status"] == "expired"
    # Снятое ограничение (срок прошёл) тренеру не показывается.
    assert world["coach"].get(url).data["limits"] == []


def test_doctor_deletes_record(world):
    url = "/api/national/members/%s/medical/" % world["member"]
    rec = world["doctor"].post(url, {"kind": "umo", "date": str(TODAY), "title": "Годен"}, format="json").data
    assert world["coach"].delete("/api/national/medical/%s/" % rec["id"]).status_code == 403
    assert world["doctor"].delete("/api/national/medical/%s/" % rec["id"]).status_code == 204
    assert world["doctor"].get(url).data["records"] == []


def test_training_plan_by_coach_with_progress(world):
    url = "/api/national/members/%s/plans/" % world["member"]
    period = {"starts_on": str(TODAY - datetime.timedelta(days=10)), "ends_on": str(TODAY + datetime.timedelta(days=80)),
              "goal": "Отбор на чемпионат Азии"}
    assert world["doctor"].post(url, period, format="json").status_code == 403
    assert world["doctor"].get(url).status_code == 403
    bad = world["coach"].post(url, {**period, "ends_on": str(TODAY - datetime.timedelta(days=20))}, format="json")
    assert bad.status_code == 400
    plan = world["coach"].post(url, period, format="json").data

    items_url = "/api/national/plans/%s/items/" % plan["id"]
    ids = [world["coach"].post(items_url, {"kind": k, "title": t}, format="json").data["id"]
           for k, t in (("work", "Подача: короткая под правую"), ("camp", "УТС, Алматы"), ("start", "Кубок РК"))]
    assert world["coach"].post(items_url, {"title": "  "}, format="json").status_code == 400
    assert world["coach"].patch("/api/national/plan-items/%s/" % ids[0], {"done": True}, format="json").data["done"] is True

    plans = world["coach"].get(url).data
    assert plans[0]["done"] == 1 and plans[0]["total"] == 3
    row = world["coach"].get("/api/national/members/").data[0]
    assert row["plan"] == {"plan_id": plan["id"], "done": 1, "total": 3}
    assert "plan" not in world["doctor"].get("/api/national/members/").data[0]

    assert world["coach"].delete("/api/national/plan-items/%s/" % ids[2]).status_code == 204
    assert world["coach"].get(url).data[0]["total"] == 2
