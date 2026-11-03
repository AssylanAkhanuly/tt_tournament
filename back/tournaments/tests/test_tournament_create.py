"""«Новый турнир» ✳ (03.11.2026, решение владельца продукта): даты — диапазон,
как в «Сведениях»: начало и окончание сразу при заведении. Описания в окне
нет — оно правится в «Сведениях». Окончание — не раньше дня начала."""
import datetime

import pytest
from rest_framework.test import APIClient

from tournaments.models import Tournament
from users.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    staff = User.objects.create_user(phone="+77008880001", name="Админ", password="x")
    staff.is_staff = True
    staff.save()
    c = APIClient()
    c.force_authenticate(staff)
    return c


START = "2026-11-20T07:00:00Z"  # полдень по Астане


def test_турнир_заводится_с_окончанием(api):
    r = api.post("/api/tournaments/", {"name": "Кубок", "starts_at": START, "ends_at": "2026-11-22", "format": "single_elimination"}, format="json")
    assert r.status_code == 201, r.data
    t = Tournament.objects.get(name="Кубок")
    assert t.ends_at == datetime.date(2026, 11, 22)
    assert r.data["ends_at"] == "2026-11-22"


def test_без_окончания_тоже_можно(api):
    r = api.post("/api/tournaments/", {"name": "Однодневный", "starts_at": START, "format": "single_elimination"}, format="json")
    assert r.status_code == 201, r.data
    assert Tournament.objects.get(name="Однодневный").ends_at is None


def test_окончание_раньше_начала_отбивается(api):
    r = api.post("/api/tournaments/", {"name": "Назад", "starts_at": START, "ends_at": "2026-11-19", "format": "single_elimination"}, format="json")
    assert r.status_code == 400
    assert "ends_at" in r.data
    assert not Tournament.objects.filter(name="Назад").exists()


def test_председатель_гск_заводит_турнир():
    """✳ 03.11.2026, решение владельца продукта: «Новый турнир» — и у председателя ГСК."""
    from users.models import Role

    u = User.objects.create_user(phone="+77008880002", name="Председатель", password="x")
    Role.objects.create(user=u, kind=Role.KIND_GSK_CHAIRMAN)
    c = APIClient()
    c.force_authenticate(u)
    r = c.post("/api/tournaments/", {"name": "Кубок ГСК", "starts_at": START, "format": "single_elimination"}, format="json")
    assert r.status_code == 201, r.data
    assert Tournament.objects.get(name="Кубок ГСК").created_by == u


def test_спортсмен_турнир_не_заводит():
    from users.models import Role

    u = User.objects.create_user(phone="+77008880003", name="Спортсмен", password="x")
    Role.objects.create(user=u, kind=Role.KIND_PLAYER)
    c = APIClient()
    c.force_authenticate(u)
    assert c.post("/api/tournaments/", {"name": "Нельзя", "starts_at": START, "format": "single_elimination"}, format="json").status_code == 403
