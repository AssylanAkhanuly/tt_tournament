"""Состав турнира вручную ✳ (28.10.2026): спортсмены и судьи добавляются из
существующих учёток — поиском в окне на странице турнира. Править состав может
председатель ГСК и администратор федерации; смотреть — тоже только они
✳ (29.10.2026: судье состав не виден).

Проверяется то, что сломается при поломке: кандидаты — только те, кого в
турнире ещё нет, поиск сужает, добавленный попадает именно в свой список,
дубль и завершённый турнир отбиваются, без роли — 403."""
import pytest
from rest_framework.test import APIClient

from tournaments.models import Tournament, TournamentParticipant
from users.models import Role, User

pytestmark = pytest.mark.django_db


def человек(n, name, email=None):
    u = User.objects.create_user(phone="+7700777" + str(n).zfill(4), name=name, password="x")
    if email:
        u.email = email
        u.save(update_fields=["email"])
    return u


@pytest.fixture
def мир():
    председатель = человек(1, "Председатель")
    Role.objects.create(user=председатель, kind=Role.KIND_GSK_CHAIRMAN)
    t = Tournament.objects.create(name="Кубок", created_by=председатель)
    игрок = человек(2, "Ахметов Ерлан")
    уже = человек(3, "Ахметова Айгуль")
    TournamentParticipant.objects.create(tournament=t, user=уже)
    судья = человек(4, "Судьин Сергей", email="sudya@fnt.kz")
    api = APIClient()
    api.force_authenticate(председатель)
    return {"t": t, "api": api, "игрок": игрок, "уже": уже, "судья": судья, "председатель": председатель}


def имена(r):
    return [x["name"] for x in r.data]


def test_кандидаты_в_спортсмены_без_уже_добавленных_и_по_поиску(мир):
    api, t = мир["api"], мир["t"]
    r = api.get(f"/api/tournaments/{t.id}/candidates/", {"role": "player", "q": "Ахмет"})
    assert r.status_code == 200
    assert имена(r) == ["Ахметов Ерлан"]  # «Ахметова Айгуль» уже в турнире


def test_поиск_судьи_по_почте(мир):
    api, t = мир["api"], мир["t"]
    r = api.get(f"/api/tournaments/{t.id}/candidates/", {"role": "referee", "q": "sudya@"})
    assert имена(r) == ["Судьин Сергей"]


def test_добавить_спортсмена(мир):
    api, t = мир["api"], мир["t"]
    r = api.post(f"/api/tournaments/{t.id}/participants/", {"user_id": str(мир["игрок"].id)}, format="json")
    assert r.status_code == 201
    assert t.participants.filter(user=мир["игрок"]).exists()
    # Повторно — нельзя, и в кандидатах его больше нет.
    again = api.post(f"/api/tournaments/{t.id}/participants/", {"user_id": str(мир["игрок"].id)}, format="json")
    assert again.status_code == 400
    assert "Ахметов Ерлан" not in имена(api.get(f"/api/tournaments/{t.id}/candidates/", {"role": "player"}))


def test_в_завершённый_турнир_спортсмена_не_добавить(мир):
    api, t = мир["api"], мир["t"]
    t.status = Tournament.STATUS_FINISHED
    t.save(update_fields=["status"])
    r = api.post(f"/api/tournaments/{t.id}/participants/", {"user_id": str(мир["игрок"].id)}, format="json")
    assert r.status_code == 400
    assert not t.participants.filter(user=мир["игрок"]).exists()


def судья(api, t, user, position):
    return api.post(f"/api/tournaments/{t.id}/referees/", {"user_id": str(user.id), "position": position}, format="json")


def test_добавить_судью_стола_и_он_в_списке_судей(мир):
    api, t = мир["api"], мир["t"]
    r = судья(api, t, мир["судья"], Role.KIND_REFEREE)
    assert r.status_code == 201
    список = api.get(f"/api/tournaments/{t.id}/referees/").data
    assert [(x["name"], x["position"], x["position_label"]) for x in список] == [
        ("Судьин Сергей", Role.KIND_REFEREE, "Судья")
    ]
    # Судьёй он стал только в этом турнире.
    роль = Role.objects.get(user=мир["судья"])
    assert (роль.kind, роль.scope, роль.scope_id) == (Role.KIND_REFEREE, "tournament", t.id)


def test_одна_должность_на_человека_в_турнире(мир):
    api, t = мир["api"], мир["t"]
    assert судья(api, t, мир["судья"], Role.KIND_REFEREE).status_code == 201
    assert судья(api, t, мир["судья"], Role.KIND_CHIEF_SECRETARY).status_code == 400
    # И в кандидаты в судьи он больше не попадает.
    assert "Судьин Сергей" not in имена(api.get(f"/api/tournaments/{t.id}/candidates/", {"role": "referee"}))


def test_главный_судья_зам_и_секретарь_по_одному_на_турнир_судей_стола_сколько_угодно(мир):
    api, t = мир["api"], мир["t"]
    люди = [человек(10 + n, f"Судья {n}") for n in range(6)]
    for position, a, b in [
        (Role.KIND_CHIEF_REFEREE, люди[0], люди[1]),
        (Role.KIND_DEPUTY_CHIEF_REFEREE, люди[2], люди[3]),
        (Role.KIND_CHIEF_SECRETARY, люди[4], люди[5]),
    ]:
        assert судья(api, t, a, position).status_code == 201
        второй = судья(api, t, b, position)
        assert второй.status_code == 400, position
    for n in range(3):
        assert судья(api, t, человек(30 + n, f"Стол {n}"), Role.KIND_REFEREE).status_code == 201
    # Список — по старшинству должности: главный, зам, секретарь, потом судьи стола.
    позиции = [x["position"] for x in api.get(f"/api/tournaments/{t.id}/referees/").data]
    assert позиции == [
        Role.KIND_CHIEF_REFEREE,
        Role.KIND_DEPUTY_CHIEF_REFEREE,
        Role.KIND_CHIEF_SECRETARY,
        Role.KIND_REFEREE,
        Role.KIND_REFEREE,
        Role.KIND_REFEREE,
    ]


def test_чужая_должность_не_принимается(мир):
    api, t = мир["api"], мир["t"]
    assert судья(api, t, мир["судья"], Role.KIND_GSK_CHAIRMAN).status_code == 400


def test_без_роли_состав_не_править(мир):
    t = мир["t"]
    api = APIClient()
    api.force_authenticate(мир["игрок"])
    assert api.get(f"/api/tournaments/{t.id}/candidates/", {"role": "player"}).status_code == 403
    assert api.post(f"/api/tournaments/{t.id}/participants/", {"user_id": str(мир["игрок"].id)}, format="json").status_code == 403
    assert судья(api, t, мир["судья"], Role.KIND_REFEREE).status_code == 403
    # И смотреть состав без роли нельзя ✳ (29.10.2026): судье он не виден.
    assert api.get(f"/api/tournaments/{t.id}/participants/").status_code == 403


def test_карточка_судьи_и_смена_должности(мир):
    api, t = мир["api"], мир["t"]
    другой = Tournament.objects.create(name="Другой кубок", created_by=мир["председатель"])
    assert судья(api, t, мир["судья"], Role.KIND_REFEREE).status_code == 201
    assert судья(api, другой, мир["судья"], Role.KIND_CHIEF_SECRETARY).status_code == 201

    r = api.get(f"/api/tournaments/{t.id}/referees/{мир['судья'].id}/")
    assert r.status_code == 200
    assert (r.data["name"], r.data["email"], r.data["position"]) == ("Судьин Сергей", "sudya@fnt.kz", Role.KIND_REFEREE)
    # Другие турниры, где он судит, — с его должностью там; этот турнир не повторяется.
    assert [(x["name"], x["position"]) for x in r.data["tournaments"]] == [("Другой кубок", Role.KIND_CHIEF_SECRETARY)]

    ok = api.patch(f"/api/tournaments/{t.id}/referees/{мир['судья'].id}/", {"position": Role.KIND_CHIEF_REFEREE}, format="json")
    assert ok.status_code == 200
    assert Role.objects.get(user=мир["судья"], scope_id=t.id).kind == Role.KIND_CHIEF_REFEREE


def test_смена_должности_на_занятую_отбивается(мир):
    api, t = мир["api"], мир["t"]
    главный = человек(40, "Главный")
    assert судья(api, t, главный, Role.KIND_CHIEF_REFEREE).status_code == 201
    assert судья(api, t, мир["судья"], Role.KIND_REFEREE).status_code == 201
    r = api.patch(f"/api/tournaments/{t.id}/referees/{мир['судья'].id}/", {"position": Role.KIND_CHIEF_REFEREE}, format="json")
    assert r.status_code == 400
    assert Role.objects.get(user=мир["судья"], scope_id=t.id).kind == Role.KIND_REFEREE
    # Свою же должность «сменить на неё же» можно — ничего не меняется.
    same = api.patch(f"/api/tournaments/{t.id}/referees/{главный.id}/", {"position": Role.KIND_CHIEF_REFEREE}, format="json")
    assert same.status_code == 200


def test_не_судья_турнира_404_и_без_роли_не_править(мир):
    api, t = мир["api"], мир["t"]
    assert api.get(f"/api/tournaments/{t.id}/referees/{мир['игрок'].id}/").status_code == 404
    assert судья(api, t, мир["судья"], Role.KIND_REFEREE).status_code == 201
    чужой = APIClient()
    чужой.force_authenticate(мир["игрок"])
    assert чужой.get(f"/api/tournaments/{t.id}/referees/{мир['судья'].id}/").status_code == 403
    assert (
        чужой.patch(f"/api/tournaments/{t.id}/referees/{мир['судья'].id}/", {"position": Role.KIND_CHIEF_REFEREE}, format="json").status_code
        == 403
    )


def test_убрать_судью_из_турнира(мир):
    api, t = мир["api"], мир["t"]
    другой = Tournament.objects.create(name="Другой", created_by=мир["председатель"])
    assert судья(api, t, мир["судья"], Role.KIND_CHIEF_REFEREE).status_code == 201
    assert судья(api, другой, мир["судья"], Role.KIND_REFEREE).status_code == 201

    r = api.delete(f"/api/tournaments/{t.id}/referees/{мир['судья'].id}/")
    assert r.status_code == 204
    assert api.get(f"/api/tournaments/{t.id}/referees/").data == []
    # Убрали только из этого турнира: в другом он по-прежнему судит.
    assert Role.objects.filter(user=мир["судья"], scope_id=другой.id).exists()
    # Должность освободилась — её можно отдать другому.
    assert судья(api, t, человек(50, "Новый главный"), Role.KIND_CHIEF_REFEREE).status_code == 201


def test_убрать_судью_без_роли_нельзя(мир):
    api, t = мир["api"], мир["t"]
    assert судья(api, t, мир["судья"], Role.KIND_REFEREE).status_code == 201
    чужой = APIClient()
    чужой.force_authenticate(мир["игрок"])
    assert чужой.delete(f"/api/tournaments/{t.id}/referees/{мир['судья'].id}/").status_code == 403
    assert Role.objects.filter(user=мир["судья"], scope_id=t.id).exists()
