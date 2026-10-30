"""Профиль человека ✳ (28.10.2026): страница любой учётки — имя, почта, телефон
и её роли (у ролей турнира — какого). Телефон — персональные данные, поэтому
смотреть могут только председатель ГСК и администратор федерации."""
import pytest
from rest_framework.test import APIClient

from tournaments.models import Tournament
from users.models import Role, User

pytestmark = pytest.mark.django_db


def test_профиль_с_ролями_и_турнирами():
    председатель = User.objects.create_user(phone="+77001110001", name="Председатель", password="x")
    Role.objects.create(user=председатель, kind=Role.KIND_GSK_CHAIRMAN)
    t = Tournament.objects.create(name="Кубок", created_by=председатель)
    судья = User.objects.create_user(phone="+77001110002", name="Судьин Сергей", password="x")
    судья.email = "sudya@fnt.kz"
    судья.save(update_fields=["email"])
    Role.objects.create(user=судья, kind=Role.KIND_REFEREE)
    Role.objects.create(user=судья, kind=Role.KIND_CHIEF_REFEREE, scope="tournament", scope_id=t.id)

    api = APIClient()
    api.force_authenticate(председатель)
    r = api.get(f"/api/auth/people/{судья.id}/")
    assert r.status_code == 200
    assert (r.data["name"], r.data["email"], r.data["phone"]) == ("Судьин Сергей", "sudya@fnt.kz", "+77001110002")
    роли = sorted((x["label"], x["tournament"]["name"] if x["tournament"] else None) for x in r.data["roles"])
    assert роли == [("Главный судья соревнований", "Кубок"), ("Судья", None)]


def test_служебная_метка_вместо_телефона_не_показывается():
    председатель = User.objects.create_user(phone="+77001110005", name="Председатель", password="x")
    Role.objects.create(user=председатель, kind=Role.KIND_GSK_CHAIRMAN)
    почтовый = User.objects.create_user(phone="feder-1a2b3c4d", name="По почте", password="x")
    api = APIClient()
    api.force_authenticate(председатель)
    assert api.get(f"/api/auth/people/{почтовый.id}/").data["phone"] is None


def test_без_роли_профиль_закрыт():
    чужой = User.objects.create_user(phone="+77001110003", name="Игрок", password="x")
    api = APIClient()
    api.force_authenticate(чужой)
    assert api.get(f"/api/auth/people/{чужой.id}/").status_code == 403
