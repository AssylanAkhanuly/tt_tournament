"""Турнир протоколом вручную: завести, добавить спортсменов, внести матчи, утвердить.

Пилоту нужны настоящие результаты, а турниры федерации пока идут вне системы.
Председатель ГСК заводит турнир, вносит участников и кто с кем сыграл, и
утверждает протокол — рейтинг считается тем же движком, что у турнира из
сетки. Утверждённый протокол закрыт для правок: сначала «вернуть на
доработку» (с той же защитой, что у пересчёта).
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from rating import engine, services
from rating.models import RatingParams, RatingProfile
from tournaments.models import Match, Tournament, TournamentParticipant
from users.models import Role, User

pytestmark = pytest.mark.django_db


@pytest.fixture
def params():
    return RatingParams.objects.create(
        d=15, k_standard=Decimal("0.6"), k_transition=3, max_delta=1, is_active=True,
    )


def игрок(phone, name, legacy=20):
    u = User.objects.create_user(phone=phone, name=name)
    services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=legacy)
    return u


@pytest.fixture
def api():
    client = APIClient()
    chair = User.objects.create_user(phone="+7700999", name="Председатель")
    Role.objects.create(user=chair, kind=Role.KIND_GSK_CHAIRMAN)
    client.force_authenticate(chair)
    return client


def завести(api, name="Кубок проверки", level="republic"):
    r = api.post("/api/rating/protocols/", {"name": name, "date": "2026-09-10", "level": level}, format="json")
    assert r.status_code == 201, r.data
    return r.data


def добавить(api, tid, user):
    r = api.post("/api/rating/protocols/%s/participants/" % tid, {"user_id": str(user.pk)}, format="json")
    assert r.status_code == 200, r.data
    return r.data


def матч(api, tid, a, b, sa=3, sb=1):
    return api.post(
        "/api/rating/protocols/%s/matches/" % tid,
        {"a": str(a.pk), "b": str(b.pk), "score_a": sa, "score_b": sb},
        format="json",
    )


def значение(u):
    return RatingProfile.objects.get(user=u).value


# ── Завести ─────────────────────────────────────────────────────────


def test_завести_турнир_протоколом(params, api):
    t = завести(api, name="Кубок Павлодара", level="region")
    assert (t["name"], t["level"], t["applied"], t["editable"]) == ("Кубок Павлодара", "region", False, True)

    tour = Tournament.objects.get(pk=t["id"])
    assert (tour.format, tour.status, tour.is_rating) == (Tournament.FORMAT_MANUAL, Tournament.STATUS_OPEN, True)
    # Черновик виден в списке протоколов.
    assert any(x["id"] == tour.pk for x in api.get("/api/rating/protocols/").data)


def test_без_названия_не_завести(params, api):
    r = api.post("/api/rating/protocols/", {"name": " ", "date": "2026-09-10", "level": "top"}, format="json")
    assert r.status_code == 400


# ── Участники и матчи → утверждение ─────────────────────────────────


def test_спортсмены_матч_и_утверждение_дают_рейтинг(params, api):
    a = игрок("+7706000001", "Победитель")
    b = игрок("+7706000002", "Соперник")
    t = завести(api)
    добавить(api, t["id"], a)
    добавить(api, t["id"], b)
    r = матч(api, t["id"], a, b, 3, 1)
    assert r.status_code == 200, r.data
    [m] = r.data["matches"]
    assert (m["a_name"], m["score"], m["b_name"], m["counted"]) == ("Победитель", "3:1", "Соперник", False)

    d = api.post("/api/rating/protocols/%s/" % t["id"], {"level": "republic", "places": {}}, format="json")
    assert d.status_code == 200, d.data
    assert (d.data["applied"], d.data["editable"]) == (True, False)
    # Равные 20 и 20, C = 1,00: +0,30.
    assert значение(a) == Decimal("20.30")
    assert Tournament.objects.get(pk=t["id"]).status == Tournament.STATUS_FINISHED


def test_новый_спортсмен_с_прежним_рейтингом_и_без(params, api):
    t = завести(api)
    r = api.post(
        "/api/rating/protocols/%s/participants/" % t["id"],
        {"new": {"name": "Новиков Пётр", "region": "Павлодар", "sex": "m", "birth_year": 2005, "legacy": "30"}},
        format="json",
    )
    assert r.status_code == 200, r.data
    r = api.post(
        "/api/rating/protocols/%s/participants/" % t["id"],
        {"new": {"name": "Первая Анна", "sex": "f"}},
        format="json",
    )
    assert r.status_code == 200, r.data

    новиков = RatingProfile.objects.get(user__name="Новиков Пётр")
    assert (новиков.value, новиков.origin, новиков.region) == (Decimal("30.00"), engine.ORIGIN_LEGACY, "Павлодар")
    первая = RatingProfile.objects.get(user__name="Первая Анна")
    assert (первая.value, первая.origin) == (Decimal("1.00"), engine.ORIGIN_NEW)  # п. 6.1
    assert {p["name"] for p in r.data["participants"]} == {"Новиков Пётр", "Первая Анна"}


def test_матч_только_между_участниками_и_без_ничьей(params, api):
    a = игрок("+7706000003", "А")
    b = игрок("+7706000004", "Б")
    чужой = игрок("+7706000005", "Чужой")
    t = завести(api)
    добавить(api, t["id"], a)
    добавить(api, t["id"], b)

    assert матч(api, t["id"], a, чужой).status_code == 400
    assert матч(api, t["id"], a, a).status_code == 400
    ничья = матч(api, t["id"], a, b, 2, 2)
    assert ничья.status_code == 400
    assert "ничь" in ничья.data["detail"]


def test_участника_с_матчами_не_удалить(params, api):
    a = игрок("+7706000006", "А")
    b = игрок("+7706000007", "Б")
    t = завести(api)
    добавить(api, t["id"], a)
    добавить(api, t["id"], b)
    m = матч(api, t["id"], a, b).data["matches"][0]

    r = api.delete("/api/rating/protocols/%s/participants/%s/" % (t["id"], a.pk))
    assert r.status_code == 400
    assert api.delete("/api/rating/protocols/%s/matches/%s/" % (t["id"], m["id"])).status_code == 200
    r = api.delete("/api/rating/protocols/%s/participants/%s/" % (t["id"], a.pk))
    assert r.status_code == 200
    assert [p["name"] for p in r.data["participants"]] == ["Б"]


def test_утверждённый_закрыт_для_правок_до_возврата_на_доработку(params, api):
    a = игрок("+7706000008", "А")
    b = игрок("+7706000009", "Б")
    t = завести(api)
    добавить(api, t["id"], a)
    добавить(api, t["id"], b)
    матч(api, t["id"], a, b)
    api.post("/api/rating/protocols/%s/" % t["id"], {"level": "republic", "places": {}}, format="json")

    закрыт = матч(api, t["id"], b, a)
    assert закрыт.status_code == 400
    assert "доработку" in закрыт.data["detail"]

    r = api.post("/api/rating/protocols/%s/rework/" % t["id"])
    assert r.status_code == 200, r.data
    assert (r.data["applied"], r.data["editable"]) == (False, True)
    assert значение(a) == Decimal("20.00")  # учёт турнира снят
    assert матч(api, t["id"], b, a).status_code == 200


def test_пустой_протокол_не_утвердить(params, api):
    a = игрок("+7706000010", "А")
    t = завести(api)
    добавить(api, t["id"], a)
    r = api.post("/api/rating/protocols/%s/" % t["id"], {"level": "republic", "places": {}}, format="json")
    assert r.status_code == 400
    assert "матч" in r.data["detail"]


def test_турнир_из_сетки_вручную_не_править(params, api):
    a = игрок("+7706000011", "А")
    сетка = Tournament.objects.create(
        name="Из сетки", created_by=a, status=Tournament.STATUS_FINISHED, format=Tournament.FORMAT_SINGLE,
    )
    r = api.post("/api/rating/protocols/%s/participants/" % сетка.pk, {"user_id": str(a.pk)}, format="json")
    assert r.status_code == 400
    assert TournamentParticipant.objects.filter(tournament=сетка).count() == 0


def test_заводить_турниры_может_только_председатель(params):
    body = {"name": "Кубок", "date": "2026-09-10", "level": "top"}
    assert APIClient().post("/api/rating/protocols/", body, format="json").status_code in (401, 403)

    staff = User.objects.create_user(phone="+7700888", name="Админ")
    staff.is_staff = True
    staff.save()
    api = APIClient()
    api.force_authenticate(staff)
    assert api.post("/api/rating/protocols/", body, format="json").status_code == 403
    assert Match.objects.count() == 0


# ── Предпросмотр черновика ──────────────────────────────────────────


def test_предпросмотр_черновика_показывает_изменения_и_ничего_не_учитывает(params, api):
    а, б = игрок("+7701", "А"), игрок("+7702", "Б")
    t = завести(api)
    добавить(api, t["id"], а)
    добавить(api, t["id"], б)
    assert матч(api, t["id"], а, б).status_code == 200

    r = api.post("/api/rating/protocols/%s/preview/" % t["id"], {"level": "republic", "places": {}}, format="json")
    assert r.status_code == 200, r.data
    assert r.data["blocked"] is None
    строка = {p["name"]: p for p in r.data["participants"]}
    assert (строка["А"]["change"], строка["А"]["after"]) == ("0.30", "20.30")

    # Откатилось целиком: черновик остался черновиком, значения прежние.
    d = api.get("/api/rating/protocols/%s/" % t["id"]).data
    assert (d["applied"], d["editable"], d["status"]) == (False, True, Tournament.STATUS_OPEN)
    assert значение(а) == Decimal("20.00")


def test_предпросмотр_пустого_черновика_называет_причину(params, api):
    t = завести(api)
    r = api.post("/api/rating/protocols/%s/preview/" % t["id"], {"level": "republic", "places": {}}, format="json")
    assert r.status_code == 200
    assert "матч" in r.data["blocked"]


# ── Возврат на доработку: только вручную и без поздних изменений ────


def test_турнир_из_сетки_на_доработку_не_возвращается(params, api):
    автор = User.objects.create_user(phone="+7709", name="Организатор")
    t = Tournament.objects.create(
        name="Турнир из сетки", created_by=автор, is_rating=True,
        format=Tournament.FORMAT_SINGLE, status=Tournament.STATUS_FINISHED,
    )
    r = api.post("/api/rating/protocols/%s/rework/" % t.pk)
    assert r.status_code == 400
    assert "вручную" in r.data["detail"]


def test_возврат_отказан_если_после_турнира_у_участника_были_изменения(params, api):
    а, б = игрок("+7701", "А"), игрок("+7702", "Б")
    t = завести(api)
    добавить(api, t["id"], а)
    добавить(api, t["id"], б)
    матч(api, t["id"], а, б)
    assert api.post("/api/rating/protocols/%s/" % t["id"], {"level": "republic", "places": {}}, format="json").status_code == 200
    services.register_correction(а, Decimal("25.00"), "Техническая ошибка")

    r = api.post("/api/rating/protocols/%s/rework/" % t["id"])
    assert r.status_code == 400
    assert r.data["detail"]
    d = api.get("/api/rating/protocols/%s/" % t["id"]).data
    assert (d["applied"], d["editable"]) == (True, False)
    assert значение(а) == Decimal("25.00")
