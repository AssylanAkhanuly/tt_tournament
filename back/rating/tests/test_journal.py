"""Журнал изменений рейтинга (п. 20, 21.6, 22.2) — для председателя ГСК.

Все строки рейтинговой истории всех спортсменов, новые первыми: кто, когда,
на сколько и на каком основании. Отменённые строки в журнале остаются с
пометкой — история хранится без удаления (п. 20). Только чтение.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from rating import engine, services
from rating.models import RatingEntry, RatingParams
from users.models import Role, User

pytestmark = pytest.mark.django_db


@pytest.fixture
def params():
    return RatingParams.objects.create(d=15, k_standard=Decimal("0.6"), is_active=True)


def игрок(phone, name, legacy):
    u = User.objects.create_user(phone=phone, name=name)
    services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=legacy)
    return u


def председатель(phone="+7700999"):
    u = User.objects.create_user(phone=phone, name="Председатель")
    Role.objects.create(user=u, kind=Role.KIND_GSK_CHAIRMAN)
    return u


def клиент(user=None):
    api = APIClient()
    if user:
        api.force_authenticate(user)
    return api


def test_журнал_только_председателю(params):
    assert клиент().get("/api/rating/journal/").status_code in (401, 403)

    staff = User.objects.create_user(phone="+7700888", name="Админ")
    staff.is_staff = True
    staff.save()
    assert клиент(staff).get("/api/rating/journal/").status_code == 403
    assert клиент(председатель()).get("/api/rating/journal/").status_code == 200


def test_все_спортсмены_новые_первыми_с_автором(params):
    первый = игрок("+7703000001", "Первый", 40)
    второй = игрок("+7703000002", "Второй", 30)
    chair = председатель()
    services.register_correction(первый, 41, reason="Опечатка", actor=chair)
    services.register_no_show(второй, reason="Не явился", actor=chair)

    r = клиент(chair).get("/api/rating/journal/")
    assert r.data["count"] == 4  # два старта и две правки
    top = r.data["results"][0]
    assert (top["kind"], top["athlete_name"], top["created_by_name"]) == ("no_show", "Второй", "Председатель")
    assert top["delta"] == "-0.20"
    assert r.data["results"][1]["kind"] == "correction"


def test_фильтр_по_виду_записи(params):
    первый = игрок("+7703000003", "Первый", 40)
    игрок("+7703000004", "Второй", 30)
    services.register_correction(первый, 41, reason="Опечатка", actor=None)

    r = клиент(председатель()).get("/api/rating/journal/", {"kind": "correction"})
    assert [x["athlete_name"] for x in r.data["results"]] == ["Первый"]


def test_поиск_по_спортсмену(params):
    игрок("+7703000005", "Ахметов Ерлан", 40)
    игрок("+7703000006", "Ким Виктор", 30)

    r = клиент(председатель()).get("/api/rating/journal/", {"q": "Ким"})
    assert {x["athlete_name"] for x in r.data["results"]} == {"Ким Виктор"}


def test_отменённые_строки_остаются_с_пометкой(params):
    u = игрок("+7703000007", "Спортсмен", 40)
    entry = services.register_correction(u, 45, reason="Опечатка", actor=None)
    RatingEntry.objects.filter(pk=entry.pk).update(is_reverted=True)

    r = клиент(председатель()).get("/api/rating/journal/", {"kind": "correction"})
    assert r.data["count"] == 1
    assert r.data["results"][0]["is_reverted"] is True
