"""Переключение между аккаунтами устройства ✳ (19.11.2026, решение владельца
продукта: «сессия на 30 дней», переход между сохранёнными аккаунтами без пароля).

Каждый вход кладёт refresh-токен аккаунта в его собственную httpOnly-куку
`acct_<id>` на 30 дней — скрипты страницы её не читают. `POST
/api/auth/switch/ {user_id}` делает этот аккаунт текущим, если у устройства есть
его живая кука; иначе 401 — экран просит пароль. «Выйти» убирает куку текущего
аккаунта, остальные аккаунты устройства остаются.

Проверяется то, что сломается при поломке: без куки не переключиться, кука
одного аккаунта не открывает другой, после «Выйти» вернуться без пароля нельзя,
а переключение делает текущим именно выбранного."""
import pytest
from rest_framework.test import APIClient

from users.models import Role, User

pytestmark = pytest.mark.django_db


def make_account(n, email):
    user = User.objects.create_user(phone="+7700555" + str(n).zfill(4), name="Аккаунт %d" % n, password="pass-%d" % n)
    user.email = email
    user.save(update_fields=["email"])
    Role.objects.create(user=user, kind=Role.KIND_GSK_CHAIRMAN)
    return user


def login(client, user, n):
    response = client.post("/api/auth/login/email/", {"email": user.email, "password": "pass-%d" % n}, format="json")
    assert response.status_code == 200, response.data
    return response


def me(client):
    response = client.get("/api/auth/me/")
    return response.data["email"] if response.status_code == 200 else None


@pytest.fixture
def two():
    return make_account(1, "one@fnt.kz"), make_account(2, "two@fnt.kz")


def test_login_sets_device_cookie_for_30_days(two):
    client = APIClient()
    response = login(client, two[0], 1)
    cookie = response.cookies["acct_%s" % two[0].id]
    assert cookie["httponly"] is True
    assert int(cookie["max-age"]) == 30 * 24 * 3600


def test_switch_back_without_password(two):
    one, other = two
    client = APIClient()
    login(client, one, 1)
    login(client, other, 2)
    assert me(client) == "two@fnt.kz"
    response = client.post("/api/auth/switch/", {"user_id": str(one.id)}, format="json")
    assert response.status_code == 200, response.data
    assert response.data["email"] == "one@fnt.kz"
    assert me(client) == "one@fnt.kz"


def test_switch_without_device_cookie_401(two):
    client = APIClient()
    login(client, two[1], 2)
    response = client.post("/api/auth/switch/", {"user_id": str(two[0].id)}, format="json")
    assert response.status_code == 401
    assert me(client) == "two@fnt.kz"


def test_cookie_of_one_account_does_not_open_another(two):
    one, other = two
    client = APIClient()
    login(client, one, 1)
    # Подмена: кука «второго» с токеном первого.
    client.cookies["acct_%s" % other.id] = client.cookies["acct_%s" % one.id].value
    response = client.post("/api/auth/switch/", {"user_id": str(other.id)}, format="json")
    assert response.status_code == 401
    assert me(client) == "one@fnt.kz"


def test_logout_forgets_only_current_account(two):
    one, other = two
    client = APIClient()
    login(client, one, 1)
    login(client, other, 2)
    response = client.post("/api/auth/logout/")
    assert response.status_code == 200
    assert response.cookies["acct_%s" % other.id].value == ""
    assert me(client) is None
    assert client.post("/api/auth/switch/", {"user_id": str(other.id)}, format="json").status_code == 401
    assert client.post("/api/auth/switch/", {"user_id": str(one.id)}, format="json").status_code == 200
    assert me(client) == "one@fnt.kz"
