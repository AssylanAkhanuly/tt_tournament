"""Роли «Спортсмен» и «Судья» ✳ (28.10.2026) — пока пустые: кабинеты без
разделов. Проверяется, что команда заводит роль, по ней пускает вход по почте,
а правки рейтинга (ручки председателя ГСК) этим ролям закрыты."""
import pytest
from django.core.management import call_command
from rest_framework.test import APIClient

from users.models import Role, User

pytestmark = pytest.mark.django_db

CASES = [
    ("create_player", Role.KIND_PLAYER, "Спортсмен"),
    ("create_referee", Role.KIND_REFEREE, "Судья"),
]


@pytest.mark.parametrize("command,kind,label", CASES)
def test_команда_заводит_роль_и_по_ней_пускает(command, kind, label):
    call_command(command, email="x@fnt.kz", name="Проверка", password="Пароль-1")
    u = User.objects.get(email="x@fnt.kz")
    assert list(u.roles.values_list("kind", flat=True)) == [kind]
    assert not u.is_staff

    api = APIClient()
    r = api.post("/api/auth/login/email/", {"email": "x@fnt.kz", "password": "Пароль-1"}, format="json")
    assert r.status_code == 200
    assert [x["label"] for x in r.data["roles"]] == [label]
    # Правки рейтинга — не их: ручка председателя закрыта.
    assert api.get("/api/rating/protocols/").status_code == 403
