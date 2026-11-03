"""Калибровка ✳ (восстановлена 03.11.2026): коэффициенты и предпросчёт.

Коэффициенты читаются всеми и несут происхождение каждого числа; правит
только председатель ГСК. Предпросчёт считает присланный набор тем же движком,
что и боевой рейтинг, и ничего не сохраняет.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from rating import services
from rating.models import RatingEntry, RatingParams, RatingProfile
from users.models import Role, User

pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def params():
    return RatingParams.objects.create(d=15, k_standard=Decimal("0.6"), is_active=True)


def test_коэффициенты_читаются_всеми_и_несут_происхождение(api, params):
    r = api.get("/api/rating/params/")
    assert r.status_code == 200
    assert r.data["d"] == "15.00"
    # Шесть значений Положением не заданы — и это видно из ответа.
    assert r.data["sources"]["d"] == {"fixed": False, "clause": "п. 9.4"}
    assert r.data["sources"]["transition_matches"]["fixed"] is True
    assert r.data["sources"]["c_top"] == {"fixed": True, "clause": "п. 13"}


def test_коэффициенты_правит_только_председатель_гск(api, params):
    обычный = User.objects.create_user(phone="+7710000100", name="Обычный")
    api.force_authenticate(user=обычный)
    assert api.patch("/api/rating/params/", {"d": 20}, format="json").status_code == 403

    RatingParams.objects.filter(pk=params.pk).first().refresh_from_db()
    assert RatingParams.active().d == Decimal("15.00")


def test_председатель_гск_меняет_коэффициент_и_он_применяется(api, params):
    админ = User.objects.create_user(phone="+7710000110", name="Федерация")
    Role.objects.create(user=админ, kind=Role.KIND_GSK_CHAIRMAN)
    api.force_authenticate(user=админ)

    r = api.patch("/api/rating/params/", {"k_standard": "1.200"}, format="json")
    assert r.status_code == 200
    assert RatingParams.active().k_standard == Decimal("1.200")

    # И следующий расчёт идёт уже по новому значению.
    предпросчёт = api.post(
        "/api/rating/preview/",
        {
            "players": [
                {"id": "a", "name": "А", "origin": "legacy", "start": 20},
                {"id": "b", "name": "Б", "origin": "legacy", "start": 20},
            ],
            "tournaments": [{"id": "t", "name": "Т", "level": "republic"}],
            "matches": [{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
        },
        format="json",
    )
    а = next(x for x in предпросчёт.data["table"] if x["id"] == "a")
    assert а["rating"] == 20.6  # 1,20 × 1,00 × 0,50


# ── Предпросчёт ─────────────────────────────────────────────────────


def test_предпросчёт_считает_и_ничего_не_сохраняет(api, params):
    r = api.post(
        "/api/rating/preview/",
        {
            "players": [
                {"id": "a", "name": "А", "origin": "legacy", "start": 20},
                {"id": "b", "name": "Б", "origin": "legacy", "start": 20},
            ],
            "tournaments": [{"id": "t", "name": "Чемпионат", "level": "top"}],
            "matches": [{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
        },
        format="json",
    )
    assert r.status_code == 200
    а = next(x for x in r.data["table"] if x["id"] == "a")
    assert а["rating"] == 20.36
    # История приходит со слагаемыми — иначе число нечем объяснить.
    строка = r.data["history"][0]
    assert строка["c"] == 1.2
    assert строка["score"] == "3:1"
    assert RatingProfile.objects.count() == 0


def test_предпросчёт_принимает_свои_коэффициенты(api, params):
    r = api.post(
        "/api/rating/preview/",
        {
            "players": [
                {"id": "a", "name": "А", "origin": "legacy", "start": 20},
                {"id": "b", "name": "Б", "origin": "legacy", "start": 35},
            ],
            "tournaments": [{"id": "t", "name": "Т", "level": "republic"}],
            "matches": [{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
            "params": {"d": 40},
        },
        format="json",
    )
    узкая = api.post(
        "/api/rating/preview/",
        {
            "players": [
                {"id": "a", "name": "А", "origin": "legacy", "start": 20},
                {"id": "b", "name": "Б", "origin": "legacy", "start": 35},
            ],
            "tournaments": [{"id": "t", "name": "Т", "level": "republic"}],
            "matches": [{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
            "params": {"d": 10},
        },
        format="json",
    )
    широкий = next(x for x in r.data["table"] if x["id"] == "a")["rating"]
    узкий = next(x for x in узкая.data["table"] if x["id"] == "a")["rating"]
    # Чем шире шкала, тем дешевле победа над более сильным.
    assert узкий > широкий


def test_предпросчёт_отвергает_кривой_вход(api, params):
    r = api.post("/api/rating/preview/", {"players": [], "tournaments": []}, format="json")
    assert r.status_code == 400


def test_предпросчёт_сам_выводит_стартовое_значение(api, params):
    """Формула перевода из ITTF (п. 17.4) считается на сервере, а не на клиенте:
    иначе она оказалась бы в двух местах сразу и разъехалась бы."""
    r = api.post(
        "/api/rating/preview/",
        {
            "players": [
                {"id": "n", "name": "Новичок", "origin": "new"},
                {"id": "l", "name": "Легионер", "origin": "ittf", "ittf_position": 100},
                {"id": "p", "name": "Перенос", "origin": "legacy", "start": 50},
            ],
            "tournaments": [{"id": "t", "name": "Т", "level": "republic"}],
            "matches": [],
        },
        format="json",
    )
    старты = {x["id"]: x["start"] for x in r.data["table"]}
    assert старты["n"] == 1.0     # п. 6.1
    assert старты["l"] == 43.95   # пример п. 17.12
    assert старты["p"] == 50.0    # п. 6.3


def test_предпросчёт_возвращает_наблюдения_по_шкале(api, params):
    """Что значат выбранные коэффициенты — считает сервер: это та же формула
    п. 9.3, и копия на фронте разошлась бы с боевой."""
    тело = {
        "players": [
            {"id": "a", "name": "А", "origin": "legacy", "start": 20},
            {"id": "b", "name": "Б", "origin": "legacy", "start": 20},
        ],
        "tournaments": [{"id": "t", "name": "Т", "level": "republic"}],
        "matches": [{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
    }
    узкая = api.post("/api/rating/preview/", {**тело, "params": {"d": 10}}, format="json")
    широкая = api.post("/api/rating/preview/", {**тело, "params": {"d": 30}}, format="json")

    # При узкой шкале мастер обыгрывает кандидата почти всегда, при широкой — нет.
    assert узкая.data["insights"]["win_share_ms_over_kms"] > 0.9
    assert широкая.data["insights"]["win_share_ms_over_kms"] < 0.7
    # И путь новичка до КМС считается там же.
    assert узкая.data["insights"]["matches_new_to_kms"] is not None


def test_предпросчёт_ничего_не_пишет_в_базу(params):
    result, _ = services.preview(
        players=[
            {"id": "a", "name": "А", "origin": "legacy", "start": 20},
            {"id": "b", "name": "Б", "origin": "legacy", "start": 20},
        ],
        tournaments=[{"id": "t", "name": "Тест", "level": "top"}],
        matches=[{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
        params={"k_standard": 1.2},
    )
    assert next(x for x in result.table if x.id == "a").rating == 20.72
    assert RatingProfile.objects.count() == 0
    assert RatingEntry.objects.count() == 0


def test_доля_побед_считается_и_без_спортсменов(api, params):
    """Экран калибровки шлёт черновик без набора ✳ (03.11.2026, «Прогона» нет):
    доля побед — функция одних коэффициентов."""
    r = api.post("/api/rating/preview/", {"players": [], "tournaments": [], "matches": [], "params": {"d": 10}}, format="json")
    assert r.status_code == 200
    assert r.data["table"] == []
    assert r.data["insights"]["win_share_ms_over_kms"] == 0.9091
