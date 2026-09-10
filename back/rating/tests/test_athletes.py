"""Новый спортсмен в рейтинге — заводит председатель ГСК ✳ (11.09.2026).

Старт по Положению: новый — 1,00 (п. 6.1), перенос прежнего — один к одному
(п. 6.3), легионер — из позиции ITTF (п. 17.4). Значение считает сервер, не
экран: иначе формула перевода оказалась бы в двух местах.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from rating import engine
from rating.models import RatingParams, RatingProfile
from users.models import Role, User

pytestmark = pytest.mark.django_db


@pytest.fixture
def params():
    return RatingParams.objects.create(d=15, k_standard=Decimal("0.6"), is_active=True)


@pytest.fixture
def api():
    client = APIClient()
    chair = User.objects.create_user(phone="+7700999", name="Председатель")
    Role.objects.create(user=chair, kind=Role.KIND_GSK_CHAIRMAN)
    client.force_authenticate(chair)
    return client


def завести(api, **body):
    return api.post("/api/rating/athletes/", body, format="json")


def test_перенос_прежнего_рейтинга(params, api):
    r = завести(api, name="Серикбаев Нурлан", region="Караганда", sex="m", birth_year=2004,
                origin="legacy", legacy="42.5")
    assert r.status_code == 201, r.data
    assert (r.data["name"], r.data["value"], r.data["origin"], r.data["region"]) == (
        "Серикбаев Нурлан", "42.50", engine.ORIGIN_LEGACY, "Караганда",
    )
    # Сразу виден в листе.
    лист = api.get("/api/rating/", {"q": "Серикбаев"}).data["results"]
    assert [x["name"] for x in лист] == ["Серикбаев Нурлан"]


def test_новый_спортсмен_стартует_с_единицы(params, api):
    r = завести(api, name="Жанова Айгерим", sex="f", origin="new")
    assert r.status_code == 201, r.data
    assert (r.data["value"], r.data["origin"]) == ("1.00", engine.ORIGIN_NEW)


def test_легионер_из_позиции_ittf(params, api):
    r = завести(api, name="Легионер", origin="ittf", ittf_position=100)
    assert r.status_code == 201, r.data
    # 90 − 10 × ln(100) = 43,95 (пример п. 17.12).
    assert r.data["value"] == "43.95"
    assert RatingProfile.objects.get(user__name="Легионер").ittf_position == 100


def test_без_имени_и_без_значения_не_заводится(params, api):
    assert завести(api, name="  ", origin="new").status_code == 400
    r = завести(api, name="Кто-то", origin="legacy")
    assert r.status_code == 400
    assert "прежн" in r.data["detail"]
    assert завести(api, name="Кто-то", origin="ittf").status_code == 400


def test_заводить_спортсменов_может_только_председатель(params):
    body = {"name": "Кто-то", "origin": "new"}
    assert APIClient().post("/api/rating/athletes/", body, format="json").status_code in (401, 403)

    staff = User.objects.create_user(phone="+7700888", name="Админ")
    staff.is_staff = True
    staff.save()
    api = APIClient()
    api.force_authenticate(staff)
    assert api.post("/api/rating/athletes/", body, format="json").status_code == 403
    assert not RatingProfile.objects.filter(user__name="Кто-то").exists()
