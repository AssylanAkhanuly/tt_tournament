"""Штаб сборной ✳ (19.11.2026, NATIONAL.md): консультант, тренер сборной,
личный тренер, психолог; согласование плана; календарь подготовки; рапорты.

Ломается, если: консультант не равен главному тренеру; тренер сборной видит
чужую возрастную группу; личный тренер правит план на согласовании или не
может отправить свой; план возвращается без комментария; спортивную карточку
читает кто-то кроме психолога; старший тренер вписывает в рапорт чужой
регион; рапорт отклоняется без комментария; файл рапорта отдаётся постороннему;
история не собирает согласованный сбор."""
import datetime
from decimal import Decimal

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from rating.models import RatingProfile
from users.models import Role, User

pytestmark = pytest.mark.django_db

TODAY = datetime.date.today()
D = lambda days: str(TODAY + datetime.timedelta(days=days))  # noqa: E731


def make_user(n, name, kind=None, **role):
    user = User.objects.create_user(phone="+7700666" + str(n).zfill(4), name=name, password="x")
    if kind:
        Role.objects.create(user=user, kind=kind, **role)
    return user


def athlete(n, name, region="Астана"):
    user = make_user(n, name)
    RatingProfile.objects.create(user=user, value=Decimal("500"), sex="m", region=region, birth_year=2008)
    return user


def api(user):
    c = APIClient()
    c.force_authenticate(user)
    return c


@pytest.fixture
def w():
    people = {
        "head": make_user(1, "Главный", Role.KIND_NATIONAL_HEAD_COACH),
        "consultant": make_user(2, "Консультант", Role.KIND_NATIONAL_CONSULTANT),
        "junior_coach": make_user(3, "Тренер юношей", Role.KIND_NATIONAL_TEAM_COACH, age_group="junior"),
        "personal": make_user(4, "Личный тренер", Role.KIND_PERSONAL_COACH),
        "other_personal": make_user(5, "Другой личный", Role.KIND_PERSONAL_COACH),
        "psych": make_user(6, "Психолог", Role.KIND_NATIONAL_PSYCHOLOGIST),
        "doctor": make_user(7, "Врач", Role.KIND_NATIONAL_DOCTOR),
        "regional": make_user(8, "Старший тренер", Role.KIND_REGIONAL_HEAD_COACH, scope=Role.SCOPE_REGION, region="Астана"),
    }
    c = {k: api(v) for k, v in people.items()}
    junior = athlete(100, "Юниор Астана")
    adult = athlete(101, "Взрослый Алматы", region="Алматы")
    mj = c["consultant"].post("/api/national/members/", {"user_id": str(junior.id), "age_group": "junior"}, format="json")
    assert mj.status_code == 201, mj.data  # консультант — копия главного тренера
    ma = c["head"].post("/api/national/members/", {"user_id": str(adult.id), "age_group": "adult"}, format="json")
    r = c["head"].patch("/api/national/members/%s/" % mj.data["id"], {"personal_coach_id": str(people["personal"].id)}, format="json")
    assert r.status_code == 200 and r.data["personal_coach"]["name"] == "Личный тренер"
    return {"p": people, "c": c, "junior": mj.data["id"], "adult": ma.data["id"], "junior_user": junior, "adult_user": adult}


def names(client):
    return sorted(m["person"]["name"] for m in client.get("/api/national/members/").data)


def test_who_sees_whom(w):
    c = w["c"]
    assert names(c["head"]) == ["Взрослый Алматы", "Юниор Астана"]
    assert names(c["junior_coach"]) == ["Юниор Астана"]
    assert names(c["personal"]) == ["Юниор Астана"]
    assert names(c["other_personal"]) == []
    assert names(c["psych"]) == ["Взрослый Алматы", "Юниор Астана"]
    assert c["junior_coach"].get("/api/national/members/%s/" % w["adult"]).status_code == 403
    assert c["regional"].get("/api/national/members/").status_code == 403
    # Личным тренером — только учётка с ролью «Личный тренер».
    bad = c["head"].patch("/api/national/members/%s/" % w["adult"], {"personal_coach_id": str(w["p"]["doctor"].id)}, format="json")
    assert bad.status_code == 400
    assert c["junior_coach"].patch("/api/national/members/%s/" % w["junior"], {"squad": "extended"}, format="json").status_code == 403


def test_plan_written_by_personal_coach_and_approved_by_head(w):
    c = w["c"]
    url = "/api/national/members/%s/plans/" % w["junior"]
    assert c["other_personal"].post(url, {"starts_on": D(0), "ends_on": D(90)}, format="json").status_code == 403
    plan = c["personal"].post(url, {"starts_on": D(0), "ends_on": D(90), "goal": "Первенство Азии"}, format="json").data
    assert plan["can_edit"] and plan["can_submit"] and not plan["can_review"]
    submit = "/api/national/plans/%s/submit/" % plan["id"]
    assert c["personal"].post(submit).status_code == 400  # пустой план не отправить
    c["personal"].post("/api/national/plans/%s/items/" % plan["id"], {"kind": "work", "title": "Приём подачи"}, format="json")
    assert c["head"].post(submit).status_code == 403  # отправляет личный тренер
    assert c["personal"].post(submit).data["status"] == "submitted"

    # На согласовании личный тренер не правит.
    assert c["personal"].post("/api/national/plans/%s/items/" % plan["id"], {"title": "Ещё"}, format="json").status_code == 403
    review = "/api/national/plans/%s/review/" % plan["id"]
    assert c["junior_coach"].post(review, {"approve": True}, format="json").status_code == 403
    assert c["head"].post(review, {"approve": False}, format="json").status_code == 400  # возврат без комментария
    back = c["head"].post(review, {"approve": False, "comment": "Добавьте сбор"}, format="json").data
    assert back["status"] == "returned" and back["review_comment"] == "Добавьте сбор"
    assert c["personal"].post(submit).data["status"] == "submitted"
    ok = c["consultant"].post(review, {"approve": True}, format="json").data
    assert ok["status"] == "approved" and ok["review_comment"] == ""
    # Отметку выполнения личный тренер ставит и в согласованном плане.
    item = ok["items"][0]["id"]
    assert c["personal"].patch("/api/national/plan-items/%s/" % item, {"done": True}, format="json").data["done"] is True
    # Тренер сборной своей группы план видит, но не правит.
    seen = c["junior_coach"].get(url).data[0]
    assert seen["status"] == "approved" and not seen["can_edit"] and not seen["can_mark"]
    assert c["junior_coach"].get("/api/national/members/%s/plans/" % w["adult"]).status_code == 403


def test_medical_summary_for_those_who_train_the_athlete(w):
    c = w["c"]
    url = "/api/national/members/%s/medical/" % w["junior"]
    c["doctor"].post(url, {"kind": "injury", "date": D(0), "title": "Надрыв", "load_limit": "Без бега", "until": D(5)}, format="json")
    for who in ("personal", "junior_coach", "consultant"):
        r = c[who].get(url).data
        assert r["full"] is False and r["limits"][0]["load_limit"] == "Без бега" and "Надрыв" not in str(r)
    assert c["psych"].get(url).status_code == 403
    assert c["other_personal"].get(url).status_code == 403


def test_sport_card_only_for_psychologists(w):
    c = w["c"]
    url = "/api/national/members/%s/sport/" % w["junior"]
    assert c["head"].post(url, {"date": D(0), "text": "x"}, format="json").status_code == 403
    rec = c["psych"].post(url, {"date": D(0), "text": "Тревожность перед финалами"}, format="json")
    assert rec.status_code == 201
    assert c["psych"].post(url, {"date": D(0), "text": " "}, format="json").status_code == 400
    for who in ("head", "consultant", "doctor", "personal", "junior_coach"):
        assert c[who].get(url).status_code == 403
    assert [r["text"] for r in c["psych"].get(url).data] == ["Тревожность перед финалами"]
    assert c["psych"].delete("/api/national/sport/%s/" % rec.data["id"]).status_code == 204


def test_training_calendar(w):
    c = w["c"]
    bad = c["head"].post("/api/national/events/", {"kind": "camp", "title": "УТС", "starts_on": D(5), "ends_on": D(1)}, format="json")
    assert bad.status_code == 400
    assert c["junior_coach"].post("/api/national/events/", {"kind": "camp", "title": "УТС", "starts_on": D(1), "ends_on": D(5)}, format="json").status_code == 403
    ev = c["head"].post("/api/national/events/", {"kind": "camp", "title": "УТС", "city": "Щучинск", "age_group": "junior",
                                                  "starts_on": D(1), "ends_on": D(5)}, format="json").data
    listed = c["regional"].get("/api/national/events/").data
    assert listed["can_edit"] is False and [e["title"] for e in listed["events"]] == ["УТС"]
    assert c["head"].get("/api/national/events/").data["can_edit"] is True
    moved = c["head"].patch("/api/national/events/%s/" % ev["id"], {"starts_on": D(2), "ends_on": D(6)}, format="json")
    assert moved.data["starts_on"] == D(2)


def _event(c):
    return c["head"].post("/api/national/events/", {"kind": "camp", "title": "УТС, Алматы", "city": "Алматы",
                                                    "starts_on": D(10), "ends_on": D(20)}, format="json").data["id"]


def test_report_by_regional_coach_goes_through_return_and_approval(w):
    c = w["c"]
    event = _event(c)
    # Чужой регион в рапорт не вписать.
    foreign = c["regional"].post("/api/national/reports/", {"event_id": event, "age_group": "adult", "text": "Прошу",
                                                            "athlete_ids": [str(w["adult_user"].id)]}, format="json")
    assert foreign.status_code == 400
    cands = [p["name"] for p in c["regional"].get("/api/national/reports/candidates/").data]
    assert cands == ["Юниор Астана"]
    assert c["regional"].post("/api/national/reports/", {"event_id": event, "age_group": "junior"}, format="json").status_code == 400
    rep = c["regional"].post("/api/national/reports/", {"event_id": event, "age_group": "junior", "text": "Прошу командировать",
                                                        "athlete_ids": [str(w["junior_user"].id)]}, format="json")
    assert rep.status_code == 201, rep.data
    rid = rep.data["id"]
    decide = "/api/national/reports/%s/decide/" % rid
    assert c["junior_coach"].post(decide, {"decision": "approve"}, format="json").status_code == 403
    assert c["head"].post(decide, {"decision": "reject"}, format="json").status_code == 400
    assert c["head"].post(decide, {"decision": "return", "comment": "Нет приказа"}, format="json").data["status"] == "returned"
    # Тренер сборной видит рапорт своей группы, личный тренер — нет.
    assert [r["id"] for r in c["junior_coach"].get("/api/national/reports/").data] == [rid]
    assert c["personal"].get("/api/national/reports/").status_code == 403
    assert c["head"].patch("/api/national/reports/%s/" % rid, {"text": "x"}, format="json").status_code == 403
    again = c["regional"].patch("/api/national/reports/%s/" % rid, {"text": "Прошу, приказ приложен"}, format="json").data
    assert again["status"] == "submitted"
    done = c["head"].post(decide, {"decision": "approve"}, format="json").data
    assert done["status"] == "approved"
    assert [h["action"] for h in done["history"]] == ["submitted", "returned", "resubmitted", "approved"]
    assert done["history"][1]["comment"] == "Нет приказа"

    # История члена сборной собирает согласованный сбор.
    hist = c["head"].get("/api/national/members/%s/history/" % w["junior"]).data
    assert [(h["kind"], h["title"]) for h in hist] == [("camp", "УТС, Алматы")]


def test_report_file_is_served_only_to_those_who_see_the_report(w, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    c = w["c"]
    event = _event(c)
    upload = SimpleUploadedFile("raport.pdf", b"%PDF-1.4 test", content_type="application/pdf")
    rep = c["regional"].post("/api/national/reports/", {"event_id": event, "age_group": "junior", "file": upload}, format="multipart")
    assert rep.status_code == 201, rep.data
    assert rep.data["file_name"] == "raport.pdf"
    url = "/api/national/reports/%s/file/" % rep.data["id"]
    got = c["head"].get(url)
    assert got.status_code == 200 and b"".join(got.streaming_content) == b"%PDF-1.4 test"
    assert c["personal"].get(url).status_code == 403
    outsider = make_user(60, "Другой регион", Role.KIND_REGIONAL_HEAD_COACH, scope=Role.SCOPE_REGION, region="Алматы")
    assert api(outsider).get(url).status_code == 404
