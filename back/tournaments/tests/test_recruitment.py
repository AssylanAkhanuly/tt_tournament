"""Приём заявок судей ✳ (29.10.2026, решение владельца продукта).

Приём открывает председатель ГСК (или администратор федерации) переключателем
на турнире; срок «до» — необязательный, по нему приём закрывается сам. Судья
видит страницу турнира и, пока приём открыт, подаёт заявку — отмечает одну или
несколько должностей (Э0.10). Отозвать можно, пока решения нет. Председатель
назначает судью на одну из отмеченных должностей (тогда судья встаёт в
коллегию турнира) или отклоняет. Повторной заявки на тот же турнир нет: после
отказа, пока приём открыт, подаётся та же заявка заново.

Проверяется то, что сломается при поломке: закрытый переключатель и прошедший
срок не пускают заявку, должность — только из отмеченных, назначение кладёт
судью в состав с этой должностью, единственная должность не достаётся второму,
состав турнира судье не виден, без роли судьи не подать, без роли председателя
не решать."""
import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from tournaments import roster
from tournaments.models import RefereeApplication, Tournament
from users.models import Role, User

pytestmark = pytest.mark.django_db


def человек(n, name, *kinds):
    u = User.objects.create_user(phone="+7700888" + str(n).zfill(4), name=name, password="x")
    for k in kinds:
        Role.objects.create(user=u, kind=k)
    return u


def клиент(user):
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.fixture
def мир():
    председатель = человек(1, "Председатель", Role.KIND_GSK_CHAIRMAN)
    судья = человек(2, "Судьин Сергей", Role.KIND_REFEREE)
    второй = человек(3, "Второв Пётр", Role.KIND_REFEREE)
    игрок = человек(4, "Игроков Иван", Role.KIND_PLAYER)
    t = Tournament.objects.create(name="Кубок", created_by=председатель, referee_recruitment_open=True)
    return {"t": t, "председатель": председатель, "судья": судья, "второй": второй, "игрок": игрок}


def url(t, tail=""):
    return f"/api/tournaments/{t.id}/referee-applications/{tail}"


def подать(user, t, positions):
    return клиент(user).post(url(t, "my/"), {"positions": positions}, format="json")


# ── Приём: переключатель и срок ──────────────────────────────────────────


def test_приём_открыт_переключателем_и_закрыт_прошедшим_сроком(мир):
    t = мир["t"]
    today = timezone.localdate()
    assert t.referee_recruitment_active(today)
    t.referee_recruitment_until = today
    assert t.referee_recruitment_active(today)  # день срока — ещё можно
    t.referee_recruitment_until = today - datetime.timedelta(days=1)
    assert not t.referee_recruitment_active(today)
    t.referee_recruitment_until = None
    t.referee_recruitment_open = False
    assert not t.referee_recruitment_active(today)


def test_турнир_отдаёт_состояние_приёма(мир):
    t = мир["t"]
    t.referee_recruitment_until = timezone.localdate() + datetime.timedelta(days=3)
    t.save()
    r = клиент(мир["судья"]).get(f"/api/tournaments/{t.id}/")
    assert r.data["referee_recruitment_open"] is True
    assert r.data["referee_recruitment_until"] == t.referee_recruitment_until.isoformat()
    assert r.data["referee_recruitment_active"] is True


def test_председатель_открывает_и_закрывает_приём_со_сроком(мир):
    t = мир["t"]
    api = клиент(мир["председатель"])
    r = api.patch(
        f"/api/tournaments/{t.id}/referee-recruitment/", {"open": False, "until": "2026-12-01"}, format="json"
    )
    assert r.status_code == 200, r.data
    t.refresh_from_db()
    assert t.referee_recruitment_open is False
    assert t.referee_recruitment_until == datetime.date(2026, 12, 1)
    # Срок снимается пустым значением.
    api.patch(f"/api/tournaments/{t.id}/referee-recruitment/", {"open": True, "until": None}, format="json")
    t.refresh_from_db()
    assert t.referee_recruitment_open is True and t.referee_recruitment_until is None


def test_приём_открыть_может_только_председатель(мир):
    t = мир["t"]
    r = клиент(мир["судья"]).patch(f"/api/tournaments/{t.id}/referee-recruitment/", {"open": False}, format="json")
    assert r.status_code == 403
    t.refresh_from_db()
    assert t.referee_recruitment_open is True


# ── Заявка судьи ─────────────────────────────────────────────────────────


def test_судья_подаёт_заявку_на_несколько_должностей(мир):
    t, судья = мир["t"], мир["судья"]
    r = подать(судья, t, ["referee", "chief_referee"])
    assert r.status_code == 201, r.data
    # Должности хранятся по старшинству, а не в порядке отметки.
    assert r.data["positions"] == ["chief_referee", "referee"]
    assert r.data["status"] == "pending"
    r = клиент(судья).get(url(t, "my/"))
    assert r.data["application"]["positions"] == ["chief_referee", "referee"]


def test_без_заявки_моя_заявка_пустая(мир):
    r = клиент(мир["судья"]).get(url(мир["t"], "my/"))
    assert r.status_code == 200
    assert r.data["application"] is None


def test_закрытый_приём_заявку_не_принимает(мир):
    t = мир["t"]
    t.referee_recruitment_open = False
    t.save()
    r = подать(мир["судья"], t, ["referee"])
    assert r.status_code == 400
    assert not RefereeApplication.objects.exists()


def test_прошедший_срок_заявку_не_принимает(мир):
    t = мир["t"]
    t.referee_recruitment_until = timezone.localdate() - datetime.timedelta(days=1)
    t.save()
    assert подать(мир["судья"], t, ["referee"]).status_code == 400


def test_без_должностей_и_с_чужой_должностью_заявки_нет(мир):
    t, судья = мир["t"], мир["судья"]
    assert подать(судья, t, []).status_code == 400
    assert подать(судья, t, ["gsk_chairman"]).status_code == 400
    assert not RefereeApplication.objects.exists()


def test_повторной_заявки_нет(мир):
    t, судья = мир["t"], мир["судья"]
    подать(судья, t, ["referee"])
    r = подать(судья, t, ["chief_referee"])
    assert r.status_code == 400
    assert RefereeApplication.objects.get().positions == ["referee"]


def test_без_роли_судьи_не_подать(мир):
    assert подать(мир["игрок"], мир["t"], ["referee"]).status_code == 403


def test_уже_в_коллегии_турнира_не_подать(мир):
    t, судья = мир["t"], мир["судья"]
    roster.add_referee(t, судья, Role.KIND_REFEREE)
    assert подать(судья, t, ["chief_referee"]).status_code == 400


def test_отозвать_пока_решения_нет(мир):
    t, судья = мир["t"], мир["судья"]
    подать(судья, t, ["referee"])
    r = клиент(судья).delete(url(t, "my/"))
    assert r.status_code == 204
    assert not RefereeApplication.objects.exists()


# ── Решение председателя ─────────────────────────────────────────────────


def заявка(мир, who="судья", positions=("referee", "chief_referee")):
    подать(мир[who], мир["t"], list(positions))
    return RefereeApplication.objects.get(user=мир[who])


def test_председатель_видит_заявки(мир):
    заявка(мир)
    заявка(мир, "второй", ["referee"])
    r = клиент(мир["председатель"]).get(url(мир["t"]))
    assert r.status_code == 200
    assert [(a["name"], a["positions"], a["status"]) for a in r.data] == [
        ("Судьин Сергей", ["chief_referee", "referee"], "pending"),
        ("Второв Пётр", ["referee"], "pending"),
    ]


def test_заявки_судье_не_видны(мир):
    заявка(мир)
    assert клиент(мир["второй"]).get(url(мир["t"])).status_code == 403


def test_назначить_на_отмеченную_должность(мир):
    t = мир["t"]
    a = заявка(мир)
    r = клиент(мир["председатель"]).post(url(t, f"{a.id}/accept/"), {"position": "chief_referee"}, format="json")
    assert r.status_code == 200, r.data
    assert r.data["status"] == "accepted"
    assert roster.referee_role(t, мир["судья"].id).kind == Role.KIND_CHIEF_REFEREE
    # Судья видит решение в своей заявке.
    mine = клиент(мир["судья"]).get(url(t, "my/")).data["application"]
    assert (mine["status"], mine["position"]) == ("accepted", "chief_referee")


def test_назначить_только_на_отмеченную(мир):
    t = мир["t"]
    a = заявка(мир, positions=["referee"])
    r = клиент(мир["председатель"]).post(url(t, f"{a.id}/accept/"), {"position": "chief_referee"}, format="json")
    assert r.status_code == 400
    assert roster.referee_role(t, мир["судья"].id) is None
    a.refresh_from_db()
    assert a.status == "pending"


def test_занятая_единственная_должность_второму_не_достаётся(мир):
    t = мир["t"]
    api = клиент(мир["председатель"])
    api.post(url(t, f"{заявка(мир).id}/accept/"), {"position": "chief_referee"}, format="json")
    b = заявка(мир, "второй", ["chief_referee"])
    r = api.post(url(t, f"{b.id}/accept/"), {"position": "chief_referee"}, format="json")
    assert r.status_code == 400
    b.refresh_from_db()
    assert b.status == "pending"


def test_отклонить_и_подать_снова_пока_приём_открыт(мир):
    t, судья = мир["t"], мир["судья"]
    a = заявка(мир)
    r = клиент(мир["председатель"]).post(url(t, f"{a.id}/reject/"), format="json")
    assert r.status_code == 200
    assert r.data["status"] == "rejected"
    assert roster.referee_role(t, судья.id) is None
    # После отказа отозвать уже нечего, а подать — та же заявка заново.
    assert клиент(судья).delete(url(t, "my/")).status_code == 400
    r = подать(судья, t, ["referee"])
    assert r.status_code == 201
    assert (r.data["status"], r.data["positions"]) == ("pending", ["referee"])
    assert RefereeApplication.objects.count() == 1


def test_решать_может_только_председатель(мир):
    t = мир["t"]
    a = заявка(мир)
    api = клиент(мир["второй"])
    assert api.post(url(t, f"{a.id}/accept/"), {"position": "referee"}, format="json").status_code == 403
    assert api.post(url(t, f"{a.id}/reject/"), format="json").status_code == 403
    a.refresh_from_db()
    assert a.status == "pending"


def test_решённую_заявку_второй_раз_не_решить(мир):
    t = мир["t"]
    a = заявка(мир)
    api = клиент(мир["председатель"])
    api.post(url(t, f"{a.id}/accept/"), {"position": "referee"}, format="json")
    assert api.post(url(t, f"{a.id}/reject/"), format="json").status_code == 400


# ── Состав турнира судье не виден ────────────────────────────────────────


def test_состав_турнира_судье_не_виден(мир):
    t = мир["t"]
    api = клиент(мир["судья"])
    assert api.get(f"/api/tournaments/{t.id}/participants/").status_code == 403
    assert api.get(f"/api/tournaments/{t.id}/referees/").status_code == 403
    председатель = клиент(мир["председатель"])
    assert председатель.get(f"/api/tournaments/{t.id}/referees/").status_code == 200


# ── Приём заявок игроков ✳ (29.10.2026) ─────────────────────────────────
# Тот же переключатель со сроком, что у судей, но решения нет: игрок
# записывается сам (`participants/join/`, ссылка-приглашение). Открыт по
# умолчанию — так записывались и до него, и розданные ссылки не сломались.


def test_приём_игроков_открыт_по_умолчанию_и_закрывается_председателем(мир):
    t = Tournament.objects.create(name="Новый", created_by=мир["председатель"])
    assert t.player_recruitment_active()
    r = клиент(мир["председатель"]).patch(
        f"/api/tournaments/{t.id}/player-recruitment/", {"open": False, "until": "2026-12-01"}, format="json"
    )
    assert r.status_code == 200, r.data
    assert (r.data["player_recruitment_open"], r.data["player_recruitment_until"]) == (False, "2026-12-01")
    assert r.data["player_recruitment_active"] is False


def test_приём_игроков_правит_только_председатель(мир):
    t = мир["t"]
    r = клиент(мир["игрок"]).patch(f"/api/tournaments/{t.id}/player-recruitment/", {"open": False}, format="json")
    assert r.status_code == 403
    t.refresh_from_db()
    assert t.player_recruitment_open is True


def test_закрытый_приём_игроков_не_пускает_записаться_ни_самому_ни_по_ссылке(мир):
    t = мир["t"]
    t.player_recruitment_open = False
    t.save()
    api = клиент(мир["игрок"])
    assert api.post(f"/api/tournaments/{t.id}/participants/join/").status_code == 400
    assert api.post(f"/api/tournaments/join/{t.join_token}/").status_code == 400
    r = APIClient().post(
        f"/api/tournaments/join/{t.join_token}/register/",
        {"phone": "+77001112233", "name": "Новичок", "password": "Pass-2026-x"},
        format="json",
    )
    assert r.status_code == 400
    assert not t.participants.exists()


def test_прошедший_срок_приёма_игроков_не_пускает(мир):
    t = мир["t"]
    t.player_recruitment_until = timezone.localdate() - datetime.timedelta(days=1)
    t.save()
    assert клиент(мир["игрок"]).post(f"/api/tournaments/{t.id}/participants/join/").status_code == 400


def test_открытый_приём_игроков_пускает(мир):
    t = мир["t"]
    r = клиент(мир["игрок"]).post(f"/api/tournaments/{t.id}/participants/join/")
    assert r.status_code == 201
    assert t.participants.filter(user=мир["игрок"]).exists()


def test_председатель_убирает_спортсмена_из_турнира(мир):
    from tournaments.models import TournamentParticipant

    t = мир["t"]
    p = TournamentParticipant.objects.create(tournament=t, user=мир["игрок"])
    assert клиент(мир["судья"]).delete(f"/api/tournaments/{t.id}/participants/{p.id}/remove/").status_code == 403
    r = клиент(мир["председатель"]).delete(f"/api/tournaments/{t.id}/participants/{p.id}/remove/")
    assert r.status_code == 204
    assert not t.participants.exists()
