"""Удаление спортсмена из рейтинга председателем ГСК ✳ (27.11.2026).

Карточка и история не стираются (п. 21.6): спортсмен пропадает из листа и
карточки для всех, кроме председателя, и возвращается с тем же значением.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from rating.models import RatingEntry, RatingParams, RatingProfile
from rating.tests.test_api import игрок, председатель

pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def params():
    return RatingParams.objects.create(d=15, is_active=True)


def names(api):
    return [row["name"] for row in api.get("/api/rating/?all=1").json()["results"]]


def test_removed_player_leaves_list_and_public_card(api, params):
    gone = игрок("+7710000901", "Удаляемый", 30)
    игрок("+7710000902", "Остаётся", 20)
    chair = председатель(api, "+7710000903")

    r = api.post(f"/api/rating/{gone.id}/remove/", {"reason": "Дубль из импорта"}, format="json")
    assert r.status_code == 201
    assert r.json()["kind"] == "remove" and r.json()["reason"] == "Дубль из импорта"

    assert names(api) == ["Остаётся"]
    # Председатель карточку видит — чтобы вернуть.
    card = api.get(f"/api/rating/{gone.id}/").json()
    assert card["profile"]["removed_at"] is not None
    api.force_authenticate(user=None)
    assert api.get(f"/api/rating/{gone.id}/").status_code == 404
    # История на месте, значение не тронуто.
    profile = RatingProfile.all_objects.get(user=gone)
    assert profile.value == Decimal("30.00")
    assert RatingEntry.objects.filter(profile=profile, kind="remove", created_by=chair).count() == 1


def test_remove_only_by_chairman_and_without_reason(api, params):
    gone = игрок("+7710000911", "Игрок", 30)
    api.force_authenticate(user=gone)
    assert api.post(f"/api/rating/{gone.id}/remove/", {}, format="json").status_code == 403
    assert names(api) == ["Игрок"]
    # Основание не спрашивается — только подтверждение на экране.
    председатель(api, "+7710000912")
    assert api.post(f"/api/rating/{gone.id}/remove/", {}, format="json").status_code == 201
    assert names(api) == []
    # Второй раз — уже удалён.
    assert api.post(f"/api/rating/{gone.id}/remove/", {}, format="json").status_code == 400


def test_restore_returns_player_with_same_value(api, params):
    gone = игрок("+7710000921", "Возвращённый", 30)
    председатель(api, "+7710000922")
    api.post(f"/api/rating/{gone.id}/remove/", {"reason": "ошибка"}, format="json")
    assert api.delete(f"/api/rating/{gone.id}/remove/").status_code == 200
    rows = api.get("/api/rating/?all=1").json()["results"]
    assert [(r["name"], r["value"]) for r in rows] == [("Возвращённый", "30.00")]
    # Второй раз вернуть — нечего.
    assert api.delete(f"/api/rating/{gone.id}/remove/").status_code == 400
