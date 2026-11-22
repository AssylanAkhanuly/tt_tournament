"""УМО и снимки члена сборной ✳ (22.11.2026, NATIONAL.md «Медкарта: УМО»)."""
import datetime

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from national import umo
from national.models import NationalTeamMember, UmoExam
from national.tests.test_api import athlete, client_for, make_user
from users.models import Role

pytestmark = pytest.mark.django_db


def _row(blocks, code):
    for b in blocks:
        for p in b["params"]:
            if p["code"] == code:
                return p
    raise KeyError(code)


# ── чистая часть ─────────────────────────────────────────────────────────────

def test_table_derived_deltas_and_status():
    exams = [
        {"values": {"weight": "65", "sessions": "11", "session_hours": "3", "ldl": "1.7", "cortisol": "300", "testosterone": "0.5"}, "height": 163},
        {"values": {"weight": "63.7", "sessions": "12", "session_hours": "3", "ldl": "2.8"}, "height": 163},
    ]
    blocks = umo.table(exams, "f")
    bmi = _row(blocks, "bmi")
    assert bmi["values"][0] == round(65 / 1.63 ** 2, 4) and bmi["calc"] is True
    vol = _row(blocks, "load_volume")
    assert vol["values"] == [33, 36] and vol["delta_prev"] == 3
    w = _row(blocks, "weight")
    assert w["last"] == 63.7 and w["delta_base_pct"] == -2.0 and round(w["delta_prev"], 1) == -1.3
    ldl = _row(blocks, "ldl")
    assert ldl["statuses"] == ["low", "ok"] and ldl["status"] == "ok"
    # кортизол/тестостерон — только где есть оба
    assert _row(blocks, "cortisol_testosterone")["values"] == [600.0, None]
    water = _row(blocks, "water_target")
    assert water["last"] == round(63.7 * 30, 4)
    nutrition = blocks[0]
    # вес, ИМТ, тестостерон, ЛПНП; статус — по последнему: ЛПНП во втором в норме
    assert nutrition["summary"] == {"numeric": 4, "low": 0, "high": 0}


def test_female_reference_hidden_for_men_and_cycle_only_for_women():
    blocks = umo.table([{"values": {"hemoglobin": "100", "crp": "9"}, "height": None}], "m")
    hb = _row(blocks, "hemoglobin")
    assert hb["ref_min"] is None and hb["status"] is None  # мужских референсов нет
    assert _row(blocks, "crp")["status"] == "high"
    assert all(p["code"] != "menstrual" for p in blocks[0]["params"])
    assert any(p["code"] == "menstrual" for p in umo.table([], "f")[0]["params"])


def test_clean_values_rejects_text_in_number_and_unknown():
    assert umo.clean_values({"weight": "64,5", "appetite": " нормальный "}) == {"weight": "64.5", "appetite": "нормальный"}
    with pytest.raises(umo.UmoError):
        umo.clean_values({"weight": "много"})
    with pytest.raises(umo.UmoError):
        umo.clean_values({"bmi": "20"})  # расчётный не вводится
    with pytest.raises(umo.UmoError):
        umo.clean_values({"nope": "1"})


# ── ручки ────────────────────────────────────────────────────────────────────

@pytest.fixture
def squad():
    head = make_user(1, "Главный тренер", Role.KIND_NATIONAL_HEAD_COACH)
    doctor = make_user(2, "Врач", Role.KIND_NATIONAL_DOCTOR)
    member = NationalTeamMember.objects.create(user=athlete(10, "Спортсмен"), added_by=head)
    return {"head": head, "doctor": doctor, "member": member}


def test_doctor_records_exams_others_cannot_read(squad):
    url = f"/api/national/members/{squad['member'].pk}/umo/"
    doc = client_for(squad["doctor"])
    r = doc.post(url, {"date": "2026-08-27", "height_cm": "180", "stage": "УТС", "values": {"weight": "75", "ferritin": "40"}}, format="json")
    assert r.status_code == 201
    data = r.json()
    assert data["next_planned"] == "2026-11-27"
    assert _row(data["blocks"], "weight")["values"] == [75.0]
    exam_id = data["exams"][0]["id"]
    r = doc.post(url, {"date": "2026-11-27", "values": {"weight": "77"}}, format="json")
    assert _row(r.json()["blocks"], "weight")["delta_prev"] == 2.0
    # правка: значение меняется, пустое стирает
    r = doc.patch(f"/api/national/umo/{exam_id}/", {"values": {"weight": "74", "ferritin": ""}}, format="json")
    assert r.status_code == 200
    assert _row(r.json()["blocks"], "weight")["values"] == [74.0, 77.0]
    assert _row(r.json()["blocks"], "ferritin")["values"] == [None, None]
    # число вместо текста — отказ
    assert doc.patch(f"/api/national/umo/{exam_id}/", {"values": {"weight": "x"}}, format="json").status_code == 400
    # штаб читает, но не правит ✳ (решение владельца продукта); тренер группы не видит
    head = client_for(squad["head"])
    seen = head.get(url)
    assert seen.status_code == 200 and seen.json()["can_edit"] is False and len(seen.json()["exams"]) == 2
    assert head.get(f"/api/national/members/{squad['member'].pk}/medical/").json()["umo"] is True
    assert head.post(url, {"date": "2026-08-27"}, format="json").status_code == 403
    assert head.patch(f"/api/national/umo/{exam_id}/", {"values": {"weight": "1"}}, format="json").status_code == 403
    assert doc.get(url).json()["can_edit"] is True
    team = make_user(3, "Тренер юношей", Role.KIND_NATIONAL_TEAM_COACH)
    assert client_for(team).get(url).status_code == 403
    assert doc.delete(f"/api/national/umo/{exam_id}/").status_code == 200
    assert UmoExam.objects.filter(member=squad["member"]).count() == 1


def test_head_staff_uploads_images_doctor_cannot(squad, settings, tmp_path):
    settings.MEDIA_ROOT = tmp_path
    url = f"/api/national/members/{squad['member'].pk}/images/figure/"
    png = (b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
           b"\x00\x00\x00\rIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82")
    f = SimpleUploadedFile("fig.png", png, content_type="image/png")
    r = client_for(squad["head"]).post(url, {"file": f}, format="multipart")
    assert r.status_code == 200 and r.json()["figure"].startswith("/media/national/figures/")
    f2 = SimpleUploadedFile("a.png", png, content_type="image/png")
    assert client_for(squad["doctor"]).post(url, {"file": f2}, format="multipart").status_code == 403
    txt = SimpleUploadedFile("a.txt", b"hello", content_type="text/plain")
    assert client_for(squad["head"]).post(url, {"file": txt}, format="multipart").status_code == 400
    assert client_for(squad["head"]).delete(url).json()["figure"] is None


def test_athlete_sees_own_card_read_only_not_others(squad):
    """Член сборной видит свою карточку, план, медкарту без диагнозов и УМО —
    только смотреть; чужую — нет ✳ (22.11.2026, решение владельца продукта)."""
    me = squad["member"].user
    other = NationalTeamMember.objects.create(user=athlete(11, "Другой спортсмен"), added_by=squad["head"])
    api = client_for(me)
    assert api.get("/api/national/me/").json()["member"] == str(squad["member"].pk)
    card = api.get(f"/api/national/members/{squad['member'].pk}/")
    assert card.status_code == 200
    access = card.json()["access"]
    assert access["roster"] is False and access["plans"] is True and access["medical"] == "summary" and access["umo"] is True
    assert access["sport"] is False and access["plan_author"] is False
    assert api.get(f"/api/national/members/{squad['member'].pk}/plans/").status_code == 200
    medical = api.get(f"/api/national/members/{squad['member'].pk}/medical/").json()
    assert medical["full"] is False and "records" not in medical
    umo_r = api.get(f"/api/national/members/{squad['member'].pk}/umo/")
    assert umo_r.status_code == 200 and umo_r.json()["can_edit"] is False
    assert api.post(f"/api/national/members/{squad['member'].pk}/umo/", {"date": "2026-08-27"}, format="json").status_code == 403
    assert api.patch(f"/api/national/members/{squad['member'].pk}/", {"squad": "extended"}, format="json").status_code == 403
    assert api.get(f"/api/national/members/{squad['member'].pk}/sport/").status_code == 403
    # чужая карточка и состав — закрыты
    assert api.get(f"/api/national/members/{other.pk}/").status_code == 403
    assert api.get(f"/api/national/members/{other.pk}/umo/").status_code == 403
    assert api.get("/api/national/members/").status_code == 403
    # не член сборной — карточки нет
    assert client_for(make_user(12, "Просто спортсмен")).get("/api/national/me/").json()["member"] is None
