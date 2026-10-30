"""Администратор федерации (роль 1, ROLES.md) — «десктоп, правит всё».

Своих разделов у кабинета роли пока нет, поэтому сейчас роль значит две вещи:
проходит всё, что проходит председатель ГСК, и пускает в Django-админку.
Проверяется то, что сломается при поломке: без роли те же ручки закрыты.
"""
import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from users.models import Role, User

pytestmark = pytest.mark.django_db

LOGIN = "/api/auth/login/email/"
PROTOCOLS = "/api/rating/protocols/"  # ручка председателя ГСК


@pytest.fixture
def api():
    return APIClient()


def завести(email="admin@fnt.kz", password="Админ-Пароль-1"):
    call_command("create_federation_admin", email=email, name="Администратор федерации",
                 password=password)
    return User.objects.get(email=email)


def test_команда_заводит_администратора_с_ролью_и_админкой():
    u = завести()
    assert list(u.roles.values_list("kind", "scope")) == [
        (Role.KIND_FEDERATION_ADMIN, Role.SCOPE_SYSTEM)
    ]
    assert u.is_staff and u.is_superuser


def test_повторный_запуск_не_дублирует_роль():
    завести()
    u = завести()
    assert u.roles.count() == 1


def test_администратор_входит_по_почте(api):
    завести()
    r = api.post(LOGIN, {"email": "admin@fnt.kz", "password": "Админ-Пароль-1"}, format="json")
    assert r.status_code == 200
    assert [x["label"] for x in r.data["roles"]] == ["Администратор федерации"]


def test_администратору_открыты_ручки_председателя(api):
    api.force_authenticate(завести())
    assert api.get(PROTOCOLS).status_code == 200


def test_без_роли_ручки_председателя_закрыты(api):
    u = User.objects.create_user(phone="+77009990600", name="Игрок", password="x")
    api.force_authenticate(u)
    assert api.get(PROTOCOLS).status_code == 403
