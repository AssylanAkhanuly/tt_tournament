"""Возрастные категории турнира и дата рождения ✳ (15.09.2026).

Замечания федерации (docs/refs/zamechaniya-reyting-i-vvod-rezultatov-2026-09-15.md):
у соревнования — «Возрастные ограничения», диапазоны дат рождения, категорий
может быть несколько; при добавлении участников из рейтинга система показывает
только тех, кто родился в диапазоне. На странице ввода результатов — отбор по
полу и возрастной категории.

Без даты рождения спортсмен сверяется по году — наше допущение: год известен у
перенесённых из прежнего рейтинга, дата — не у всех.
"""
from datetime import date
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from rating import engine, services
from rating.models import RatingParams
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


def спортсмен(phone, name, value="20", **extra):
    u = User.objects.create_user(phone=phone, name=name)
    services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=value, **extra)
    return u


КАТЕГОРИИ = [
    {"name": "2009 г.р. и моложе", "born_from": "2009-01-01", "born_to": "2026-09-14"},
    {"name": "Ветераны 40–49", "born_from": "1977-01-01", "born_to": "1986-12-31"},
]


def завести(api, categories=КАТЕГОРИИ):
    r = api.post(
        "/api/rating/protocols/",
        {"name": "Кубок", "date": "2026-09-14", "level": "republic", "age_categories": categories},
        format="json",
    )
    assert r.status_code == 201, r.data
    return r.data


def кандидаты(api, tid, **query):
    r = api.get("/api/rating/protocols/%s/candidates/" % tid, query)
    assert r.status_code == 200, r.data
    return [p["name"] for p in r.data]


# ── Дата рождения ───────────────────────────────────────────────────


def test_спортсмен_заводится_с_датой_рождения_год_выводится_из_неё(params, api):
    r = api.post(
        "/api/rating/athletes/",
        {"name": "Иванов Иван Иванович", "birth_date": "2010-05-01", "sex": "m", "origin": "new"},
        format="json",
    )
    assert r.status_code == 201, r.data
    assert (r.data["birth_date"], r.data["birth_year"]) == ("2010-05-01", 2010)
    лист = api.get("/api/rating/", {"all": "1"}).data["results"]
    assert [(x["name"], x["birth_date"]) for x in лист] == [("Иванов Иван Иванович", "2010-05-01")]


def test_дата_рождения_настоящая_и_не_в_будущем(params, api):
    for плохая in ("2099-01-01", "2010-13-40", "вчера"):
        r = api.post(
            "/api/rating/athletes/",
            {"name": "Кто-то", "birth_date": плохая, "origin": "new"},
            format="json",
        )
        assert r.status_code == 400, плохая


# ── Категории соревнования ──────────────────────────────────────────


def test_турнир_заводится_с_несколькими_возрастными_категориями(params, api):
    t = завести(api)
    assert [(c["name"], c["born_from"], c["born_to"]) for c in t["age_categories"]] == [
        ("2009 г.р. и моложе", "2009-01-01", "2026-09-14"),
        ("Ветераны 40–49", "1977-01-01", "1986-12-31"),
    ]
    assert all(c["id"] for c in t["age_categories"])

    # Без названия подпись собирается из дат.
    t2 = завести(api, [{"name": " ", "born_from": "1977-01-01", "born_to": "1986-12-31"}])
    assert t2["age_categories"][0]["name"] == "01.01.1977 — 31.12.1986"

    # Без категорий — без возрастных ограничений.
    assert завести(api, [])["age_categories"] == []


def test_диапазон_категории_проверяется(params, api):
    for плохие in (
        [{"born_from": "2010-01-01", "born_to": "2009-01-01"}],
        [{"born_from": "", "born_to": "2009-01-01"}],
        [{"born_from": "2009-01-01"}],
        "не список",
    ):
        r = api.post(
            "/api/rating/protocols/",
            {"name": "Кубок", "date": "2026-09-14", "level": "republic", "age_categories": плохие},
            format="json",
        )
        assert r.status_code == 400, плохие


# ── Кандидаты из рейтинга ───────────────────────────────────────────


def test_из_рейтинга_показываются_только_подходящие_по_возрасту_и_полу(params, api):
    спортсмен("+7701", "Юниор", "30", sex="m", birth_date=date(2010, 5, 1), birth_year=2010)
    спортсмен("+7702", "Ветеранша", "25", sex="f", birth_date=date(1980, 3, 3), birth_year=1980)
    спортсмен("+7703", "Без даты", "20", sex="m", birth_year=2009)
    спортсмен("+7704", "Взрослый", "40", sex="m", birth_date=date(1995, 1, 1), birth_year=1995)
    спортсмен("+7705", "Неизвестный", "10")
    t = завести(api)
    u17, вет = [c["id"] for c in t["age_categories"]]

    # «Любые возраста» турнира — любая из его категорий; по убыванию рейтинга.
    assert кандидаты(api, t["id"]) == ["Юниор", "Ветеранша", "Без даты"]
    assert кандидаты(api, t["id"], category=u17) == ["Юниор", "Без даты"]
    assert кандидаты(api, t["id"], category=вет) == ["Ветеранша"]
    # Выбран пол — другого пола нет вовсе.
    assert кандидаты(api, t["id"], sex="m") == ["Юниор", "Без даты"]
    assert кандидаты(api, t["id"], sex="f", category=u17) == []
    assert кандидаты(api, t["id"], q="Юни") == ["Юниор"]

    r = api.get("/api/rating/protocols/%s/candidates/" % t["id"], {"category": 999999})
    assert r.status_code == 400


def test_границы_диапазона_включительно(params, api):
    спортсмен("+7701", "В последний день", "30", sex="m", birth_date=date(1986, 12, 31), birth_year=1986)
    спортсмен("+7702", "На день позже", "20", sex="m", birth_date=date(1987, 1, 1), birth_year=1987)
    спортсмен("+7703", "В первый день", "10", sex="m", birth_date=date(1977, 1, 1), birth_year=1977)
    t = завести(api, [{"name": "Вет", "born_from": "1977-01-01", "born_to": "1986-12-31"}])
    assert кандидаты(api, t["id"]) == ["В последний день", "В первый день"]


def test_без_категорий_видны_все_кроме_уже_добавленных(params, api):
    а = спортсмен("+7701", "А", "30", sex="m", birth_year=1990)
    спортсмен("+7702", "Б", "20")
    t = завести(api, [])
    assert кандидаты(api, t["id"]) == ["А", "Б"]
    r = api.post("/api/rating/protocols/%s/participants/" % t["id"], {"user_id": str(а.pk)}, format="json")
    assert r.status_code == 200
    assert кандидаты(api, t["id"]) == ["Б"]


def test_участники_помечены_полом_годом_и_категориями(params, api):
    ю = спортсмен("+7701", "Юниор", sex="m", birth_date=date(2010, 5, 1), birth_year=2010, region="Павлодар")
    в = спортсмен("+7702", "Ветеранша", sex="f", birth_date=date(1980, 3, 3), birth_year=1980)
    t = завести(api)
    u17, вет = [c["id"] for c in t["age_categories"]]
    for u in (ю, в):
        api.post("/api/rating/protocols/%s/participants/" % t["id"], {"user_id": str(u.pk)}, format="json")

    d = api.get("/api/rating/protocols/%s/" % t["id"]).data
    по_имени = {p["name"]: p for p in d["participants"]}
    юниор = по_имени["Юниор"]
    assert (юниор["sex"], юниор["birth_year"], юниор["birth_date"], юниор["region"], юниор["categories"]) == (
        "m", 2010, "2010-05-01", "Павлодар", [u17],
    )
    assert по_имени["Ветеранша"]["categories"] == [вет]


def test_кандидатов_видит_только_председатель(params, api):
    t = завести(api)
    r = APIClient().get("/api/rating/protocols/%s/candidates/" % t["id"])
    assert r.status_code in (401, 403)


def test_категории_турнира_различимы_по_названию(params, api):
    """В отборе страницы категория выбирается по подписи: две одинаковые не
    различить. Одинаковые подписи — и у безымянных с одним диапазоном."""
    for дубли in (
        [
            {"name": "Ветераны", "born_from": "1977-01-01", "born_to": "1986-12-31"},
            {"name": " Ветераны ", "born_from": "1967-01-01", "born_to": "1976-12-31"},
        ],
        [
            {"name": "", "born_from": "1977-01-01", "born_to": "1986-12-31"},
            {"name": "", "born_from": "1977-01-01", "born_to": "1986-12-31"},
        ],
    ):
        r = api.post(
            "/api/rating/protocols/",
            {"name": "Кубок", "date": "2026-09-14", "level": "republic", "age_categories": дубли},
            format="json",
        )
        assert r.status_code == 400, дубли
        assert "назван" in r.data["detail"]
