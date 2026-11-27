"""Регион спортсмена — из закреплённого списка ✳ (16.09.2026).

Замечания федерации (docs/refs/zamechaniya-regiony-pol-partii-2026-09-16.md):
«регионы были фиксированные 3 города и 17 областей, чтобы конкретно просто
выбрать регион». Свободного ввода больше нет: экран выбирает из списка, а
сервер проверяет — иначе один и тот же регион напишут тремя способами и
выборка по региону развалится.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

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


def завести(api, region):
    return api.post(
        "/api/rating/athletes/",
        {"name": "Спортсмен " + str(region), "region": region, "origin": "new"},
        format="json",
    )


def test_список_регионов_отдаётся_экрану(api):
    r = api.get("/api/rating/regions/")
    assert r.status_code == 200
    # 3 города и 17 областей, за ними 9 стран СНГ ✳ (27.11.2026).
    assert len(r.data) == 29, r.data
    assert r.data[:3] == ["Астана", "Алматы", "Шымкент"]
    assert r.data[20:] == ["Азербайджан", "Армения", "Беларусь", "Кыргызстан", "Молдова", "Россия", "Таджикистан", "Туркменистан", "Узбекистан"]
    assert "Павлодарская область" in r.data
    assert "Улытауская область" in r.data


def test_регион_только_из_списка(params, api):
    assert завести(api, "Павлодарская область").status_code == 201
    assert RatingProfile.objects.filter(region="Павлодарская область").count() == 1
    # Пустой регион принимается: у перенесённых карточек его может не быть.
    assert завести(api, "").status_code == 201

    for чужой in ("Павлодар", "БҚО", "Московская область"):
        r = завести(api, чужой)
        assert r.status_code == 400, чужой
        assert "регион" in r.data["detail"].lower()


def test_регион_проверяется_и_у_нового_участника_турнира(params, api):
    t = api.post(
        "/api/rating/protocols/",
        {"name": "Кубок", "date": "2026-09-16", "level": "republic"},
        format="json",
    ).data
    r = api.post(
        "/api/rating/protocols/%s/participants/" % t["id"],
        {"new": {"name": "Новичок", "region": "Павлодар", "origin": "new"}},
        format="json",
    )
    assert r.status_code == 400
    assert "регион" in r.data["detail"].lower()


def test_athlete_from_cis_country_is_created(params, api):
    from rating.tests.test_api import председатель

    председатель(api, "+7710000951")
    r = api.post("/api/rating/athletes/", {"name": "Гость Из Ташкента", "region": "Узбекистан", "sex": "m"}, format="json")
    assert r.status_code == 201, r.data
    assert r.data["region"] == "Узбекистан"
    # Страны в справочник мест турнира не попали.
    places = api.get("/api/tournaments/places/").json()
    assert "Узбекистан" not in [p["region"] for p in places]
