"""Судьи турнира ✳ (28.10.2026): роль «Судья» с областью «турнир»
(`Role.scope = tournament`, `scope_id` — турнир), как задумано моделью
«пользователь → роль → область». Ручка только читает: назначение судей —
отдельная задача. Проверяется, что в список попадают судьи именно этого
турнира и именно с этой ролью."""
import pytest
from rest_framework.test import APIClient

from tournaments.models import Tournament
from users.models import Role, User

pytestmark = pytest.mark.django_db


def человек(n, name):
    return User.objects.create_user(phone="+7700555" + str(n).zfill(4), name=name, password="x")


def test_судьи_турнира_только_этого_турнира():
    автор = человек(1, "Автор")
    t = Tournament.objects.create(name="Кубок", created_by=автор)
    другой = Tournament.objects.create(name="Другой", created_by=автор)
    судья = человек(2, "Судья Турнира")
    чужой = человек(3, "Судья Чужого")
    без_области = человек(4, "Судья Вообще")
    игрок = человек(5, "Игрок Турнира")
    Role.objects.create(user=судья, kind=Role.KIND_REFEREE, scope="tournament", scope_id=t.id)
    Role.objects.create(user=чужой, kind=Role.KIND_REFEREE, scope="tournament", scope_id=другой.id)
    Role.objects.create(user=без_области, kind=Role.KIND_REFEREE)
    Role.objects.create(user=игрок, kind=Role.KIND_PLAYER, scope="tournament", scope_id=t.id)

    Role.objects.create(user=автор, kind=Role.KIND_GSK_CHAIRMAN)  # состав видит только председатель
    api = APIClient()
    api.force_authenticate(автор)
    r = api.get(f"/api/tournaments/{t.id}/referees/")
    assert r.status_code == 200
    assert [x["name"] for x in r.data] == ["Судья Турнира"]


def test_без_входа_закрыто():
    t = Tournament.objects.create(name="Кубок", created_by=человек(1, "Автор"))
    assert APIClient().get(f"/api/tournaments/{t.id}/referees/").status_code in (401, 403)


def test_удалили_турнир_роли_в_его_области_ушли_тоже():
    """Роль с областью «турнир» ссылается на турнир по `scope_id`, без внешнего
    ключа, — удаление турнира само её не уносит. Без этого у человека копились
    роли несуществующих турниров."""
    автор = человек(1, "Автор")
    t = Tournament.objects.create(name="Кубок", created_by=автор)
    остаётся = Tournament.objects.create(name="Другой", created_by=автор)
    судья = человек(2, "Судья")
    Role.objects.create(user=судья, kind=Role.KIND_CHIEF_REFEREE, scope="tournament", scope_id=t.id)
    Role.objects.create(user=судья, kind=Role.KIND_REFEREE, scope="tournament", scope_id=остаётся.id)
    Role.objects.create(user=судья, kind=Role.KIND_REFEREE)  # роль без области не трогаем

    Tournament.objects.filter(pk=t.pk).delete()  # как сносит засев — запросом, а не по одному

    assert sorted((r.kind, r.scope_id == остаётся.id) for r in судья.roles.all()) == sorted(
        [(Role.KIND_REFEREE, True), (Role.KIND_REFEREE, False)]
    )
