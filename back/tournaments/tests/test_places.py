"""Справочник мест турнира: регион и город ✳ (01.11.2026)."""
import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from rating.regions import CITIES, OBLASTS, REGIONS
from tournaments import places
from tournaments.models import Tournament
from users.models import User


def test_справочник_покрывает_все_регионы_по_порядку():
    d = places.directory()
    assert [x["region"] for x in d] == REGIONS
    # Город республиканского значения сам регион — своих городов нет.
    assert all(x["cities"] == [] for x in d if x["region"] in CITIES)
    assert all(x["cities"] for x in d if x["region"] in OBLASTS)


def test_город_встречается_один_раз():
    # По названию города определяется регион: дубль сделал бы это неоднозначным.
    все = [c for cities in places.OBLAST_CITIES.values() for c in cities] + CITIES
    assert len(все) == len(set(все))


@pytest.mark.parametrize(
    "region, city, итог",
    [
        ("Карагандинская область", "Караганда", ("Карагандинская область", "Караганда")),
        ("", "Караганда", ("Карагандинская область", "Караганда")),  # регион выводится из города
        ("Карагандинская область", "", ("Карагандинская область", "")),  # только область
        ("Астана", "", ("Астана", "Астана")),
        ("", "Астана", ("Астана", "Астана")),
        ("Астана", "Астана", ("Астана", "Астана")),
        ("", "", ("", "")),
        (None, None, ("", "")),
        ("  Павлодарская область ", " Аксу ", ("Павлодарская область", "Аксу")),
    ],
)
def test_верная_пара(region, city, итог):
    assert places.clean(region, city) == итог


@pytest.mark.parametrize(
    "region, city",
    [
        ("Павлодарская область", "Караганда"),  # город чужой области
        ("Астана", "Алматы"),
        ("", "Нью-Йорк"),
        ("Марс", ""),
        ("Павлодарская обл.", ""),
    ],
)
def test_неверная_пара(region, city):
    assert places.clean(region, city) is None


@pytest.fixture
def мир(db):
    админ = User.objects.create(phone="+77000000001", name="Админ", is_staff=True)
    t = Tournament.objects.create(name="Кубок", created_by=админ, starts_at=timezone.now())
    api = APIClient()
    api.force_authenticate(админ)
    return api, t


def test_справочник_отдаётся_без_входа(db):
    r = APIClient().get("/api/tournaments/places/")
    assert r.status_code == 200
    assert r.data[0] == {"region": "Астана", "cities": []}
    assert {"region": "Павлодарская область", "cities": ["Павлодар", "Аксу", "Экибастуз"]} in r.data


def test_правка_сохраняет_регион_и_город(мир):
    api, t = мир
    r = api.patch(
        f"/api/tournaments/{t.id}/update/",
        {"region": "Карагандинская область", "city": "Темиртау"},
        format="json",
    )
    assert r.status_code == 200
    assert (r.data["region"], r.data["city"]) == ("Карагандинская область", "Темиртау")
    assert api.get(f"/api/tournaments/{t.id}/").data["region"] == "Карагандинская область"


def test_правка_только_города_выводит_регион(мир):
    api, t = мир
    r = api.patch(f"/api/tournaments/{t.id}/update/", {"city": "Шымкент"}, format="json")
    assert (r.status_code, r.data["region"]) == (200, "Шымкент")


def test_город_чужой_области_не_сохраняется(мир):
    api, t = мир
    r = api.patch(
        f"/api/tournaments/{t.id}/update/",
        {"region": "Павлодарская область", "city": "Караганда"},
        format="json",
    )
    assert r.status_code == 400
    t.refresh_from_db()
    assert (t.region, t.city) == ("", "")


def test_снять_место_можно(мир):
    api, t = мир
    Tournament.objects.filter(pk=t.pk).update(region="Астана", city="Астана")
    r = api.patch(f"/api/tournaments/{t.id}/update/", {"region": "", "city": ""}, format="json")
    assert (r.status_code, r.data["region"], r.data["city"]) == (200, "", "")


def test_старая_строка_не_мешает_править_другое(мир):
    # Город, записанный до справочника, остаётся как есть, пока его не сменят.
    api, t = мир
    Tournament.objects.filter(pk=t.pk).update(city="Талгарский район")
    r = api.patch(f"/api/tournaments/{t.id}/update/", {"region": "", "city": "Талгарский район", "name": "Новое"}, format="json")
    assert (r.status_code, r.data["name"], r.data["city"]) == (200, "Новое", "Талгарский район")
    assert api.patch(f"/api/tournaments/{t.id}/update/", {"city": "Другое село"}, format="json").status_code == 400
