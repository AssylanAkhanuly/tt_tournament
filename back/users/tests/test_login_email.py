"""Вход по почте и паролю — временный путь для председателя ГСК.

Проверяется не «ответ 200», а то, что обязано сломаться при поломке: куки
выставлены, роль видна, чужой пароль и пользователь без роли не проходят.
"""
import pytest
from django.conf import settings
from rest_framework.test import APIClient

from users.models import Role, User

pytestmark = pytest.mark.django_db

URL = "/api/auth/login/email/"


@pytest.fixture
def api():
    return APIClient()


def председатель(email="gsk@fnt.kz", password="ГскПароль-2026"):
    u = User.objects.create_user(phone="+7700999" + str(User.objects.count()).zfill(4),
                                 name="Председатель ГСК", password=password)
    u.email = email
    u.save(update_fields=["email"])
    Role.objects.create(user=u, kind=Role.KIND_GSK_CHAIRMAN)
    return u


def test_председатель_входит_по_почте_и_получает_куки(api):
    председатель()
    r = api.post(URL, {"email": "gsk@fnt.kz", "password": "ГскПароль-2026"}, format="json")
    assert r.status_code == 200
    assert r.data["email"] == "gsk@fnt.kz"
    assert [x["kind"] for x in r.data["roles"]] == [Role.KIND_GSK_CHAIRMAN]
    # Куки те же, что у обычного входа: дальше клиент ходит как авторизованный.
    assert settings.SIMPLE_JWT["AUTH_COOKIE"] in r.cookies
    assert settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"] in r.cookies


def test_почта_без_учёта_регистра(api):
    председатель()
    r = api.post(URL, {"email": "  GSK@Fnt.KZ ", "password": "ГскПароль-2026"}, format="json")
    assert r.status_code == 200


def test_неверный_пароль_не_проходит(api):
    председатель()
    r = api.post(URL, {"email": "gsk@fnt.kz", "password": "не-тот"}, format="json")
    assert r.status_code == 401
    assert settings.SIMPLE_JWT["AUTH_COOKIE"] not in r.cookies


def test_неизвестная_почта_не_проходит(api):
    r = api.post(URL, {"email": "nobody@fnt.kz", "password": "что-угодно"}, format="json")
    assert r.status_code == 401


def test_без_роли_по_паролю_не_войти_даже_с_верным_паролем(api):
    """Вход по паролю — исключение из ТЗ §2 только для ролей: остальные ждут
    Smart Bridge, и пароль у них работать не должен."""
    u = User.objects.create_user(phone="+77009990500", name="Игрок", password="ИгрокПароль-1")
    u.email = "player@fnt.kz"
    u.save(update_fields=["email"])
    r = api.post(URL, {"email": "player@fnt.kz", "password": "ИгрокПароль-1"}, format="json")
    assert r.status_code == 401


def test_после_входа_me_показывает_роль(api):
    председатель()
    api.post(URL, {"email": "gsk@fnt.kz", "password": "ГскПароль-2026"}, format="json")
    r = api.get("/api/auth/me/")
    assert r.status_code == 200
    assert r.data["roles"][0]["label"] == "Председатель Главной судейской коллегии"


def test_команда_заводит_председателя_и_он_входит(api):
    from django.core.management import call_command

    call_command("create_gsk_chairman", email="New@Fnt.kz", name="Новый председатель",
                 password="Пароль-Новый-1")
    u = User.objects.get(email="new@fnt.kz")
    assert u.roles.filter(kind=Role.KIND_GSK_CHAIRMAN).exists()
    r = api.post(URL, {"email": "new@fnt.kz", "password": "Пароль-Новый-1"}, format="json")
    assert r.status_code == 200
