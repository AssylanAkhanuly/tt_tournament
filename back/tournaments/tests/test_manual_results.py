"""Результаты без расписания ✳ (03.11.2026, решение владельца продукта).

В «Расписании» два способа: автоматически (расписание главного судьи —
`test_schedule.py`) и вручную — матчи вносятся сразу со счётом, без групп,
времени и столов. Внесённое вручную закрывает путь к расписанию: собрать его
у такого турнира нельзя. Пока ни одного матча нет, от ручного способа можно
отказаться. Вносят главный судья турнира, председатель ГСК и администратор
федерации.

Проверяется то, что сломается при поломке: после первого матча сборка
расписания — 400; счёт не по «до N побед» — 400; чужой игрок и игра с самим
собой — 400; судья стола и спортсмен не вносят; матч попадает в выдачу
расписания со счётом и победителем."""
import pytest
from rest_framework.test import APIClient

from tournaments import roster
from tournaments.models import Match, Tournament, TournamentParticipant
from users.models import Role, User

pytestmark = pytest.mark.django_db


def человек(n, name, *kinds):
    u = User.objects.create_user(phone="+7700777" + str(n).zfill(4), name=name, password="x")
    for k in kinds:
        Role.objects.create(user=u, kind=k)
    return u


def клиент(user):
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.fixture
def мир():
    админ = человек(1, "Админ", Role.KIND_FEDERATION_ADMIN)
    председатель = человек(2, "Председатель", Role.KIND_GSK_CHAIRMAN)
    t = Tournament.objects.create(name="Кубок", created_by=админ, format=Tournament.FORMAT_GROUP, games_to_win=3)
    главный = человек(3, "Главный", Role.KIND_REFEREE)
    roster.add_referee(t, главный, Role.KIND_CHIEF_REFEREE)
    судья = человек(4, "Судья стола", Role.KIND_REFEREE)
    roster.add_referee(t, судья, Role.KIND_REFEREE)
    игроки = [человек(20 + i, f"Игрок {i}", Role.KIND_PLAYER) for i in range(4)]
    for p in игроки:
        TournamentParticipant.objects.create(tournament=t, user=p)
    чужой = человек(30, "Чужой", Role.KIND_PLAYER)
    return {"t": t, "админ": админ, "председатель": председатель, "главный": главный, "судья": судья,
            "игроки": игроки, "чужой": чужой}


def url(t, tail=""):
    return f"/api/tournaments/{t.id}/schedule/{tail}"


def вручную(api, t):
    return api.post(url(t, "manual/"), {"on": True}, format="json")


def матч(api, t, a, b, sa, sb):
    return api.post(url(t, "manual/matches/"), {"a": str(a.id), "b": str(b.id), "score_a": sa, "score_b": sb}, format="json")


def test_способ_ещё_не_выбран_и_оба_доступны(мир):
    r = клиент(мир["главный"]).get(url(мир["t"]))
    assert r.data["mode"] == ""
    assert r.data["can_manual"] is True
    assert r.data["can_build"] is True
    # Председателю — вручную можно, расписание собирает только главный судья.
    r = клиент(мир["председатель"]).get(url(мир["t"]))
    assert (r.data["can_manual"], r.data["can_build"]) == (True, False)
    # Участники отданы, чтобы было из кого выбрать.
    assert sorted(p["name"] for p in r.data["players"]) == ["Игрок 0", "Игрок 1", "Игрок 2", "Игрок 3"]


def test_председатель_вносит_матч_вручную(мир):
    t, a, b = мир["t"], *мир["игроки"][:2]
    api = клиент(мир["председатель"])
    assert вручную(api, t).data["mode"] == "manual"
    r = матч(api, t, a, b, 3, 1)
    assert r.status_code == 200, r.data
    [m] = r.data["manual_matches"]
    assert (m["player1"]["name"], m["player2"]["name"], m["score1"], m["score2"]) == ("Игрок 0", "Игрок 1", 3, 1)
    assert m["winner"] == str(a.id)
    stored = Match.objects.get(tournament=t)
    assert (stored.status, stored.winner_id) == (Match.FINISHED, a.id)


def test_после_ручного_ввода_расписание_не_собирается(мир):
    t, a, b = мир["t"], *мир["игроки"][:2]
    вручную(клиент(мир["главный"]), t)
    матч(клиент(мир["главный"]), t, a, b, 1, 3)
    r = клиент(мир["главный"]).post(url(t, "build/"), {"tables": 2, "match_minutes": 30}, format="json")
    assert r.status_code == 400
    assert "вручную" in r.data["detail"]
    assert клиент(мир["главный"]).get(url(t)).data["can_build"] is False
    t.refresh_from_db()
    assert t.schedule_status == "none"


def test_от_ручного_способа_можно_отказаться_только_без_матчей(мир):
    t, a, b = мир["t"], *мир["игроки"][:2]
    api = клиент(мир["главный"])
    вручную(api, t)
    assert api.post(url(t, "manual/"), {"on": False}, format="json").data["mode"] == ""
    вручную(api, t)
    матч(api, t, a, b, 3, 0)
    r = api.post(url(t, "manual/"), {"on": False}, format="json")
    assert r.status_code == 400
    t.refresh_from_db()
    assert t.results_mode == "manual"


def test_когда_расписание_есть_вручную_нельзя(мир):
    t = мир["t"]
    клиент(мир["главный"]).post(url(t, "build/"), {"tables": 2, "match_minutes": 30}, format="json")
    r = вручную(клиент(мир["главный"]), t)
    assert r.status_code == 400


def test_счёт_только_до_n_побед_и_без_ничьих(мир):
    t, a, b = мир["t"], *мир["игроки"][:2]
    api = клиент(мир["главный"])
    вручную(api, t)
    for sa, sb in [(2, 2), (3, 3), (4, 1), (2, 1), (-1, 3)]:
        assert матч(api, t, a, b, sa, sb).status_code == 400, (sa, sb)
    assert Match.objects.filter(tournament=t).count() == 0


def test_только_участники_и_не_сам_с_собой(мир):
    t, a = мир["t"], мир["игроки"][0]
    api = клиент(мир["главный"])
    вручную(api, t)
    assert матч(api, t, a, мир["чужой"], 3, 0).status_code == 400
    assert матч(api, t, a, a, 3, 0).status_code == 400


def test_без_выбора_ручного_способа_матч_не_вносится(мир):
    t, a, b = мир["t"], *мир["игроки"][:2]
    assert матч(клиент(мир["главный"]), t, a, b, 3, 0).status_code == 400


def test_судья_стола_и_спортсмен_не_вносят(мир):
    t, a, b = мир["t"], *мир["игроки"][:2]
    вручную(клиент(мир["главный"]), t)
    assert матч(клиент(мир["судья"]), t, a, b, 3, 0).status_code == 403
    assert матч(клиент(a), t, a, b, 3, 0).status_code == 403
    assert вручную(клиент(мир["судья"]), t).status_code == 403


def test_матч_удаляется(мир):
    t, a, b = мир["t"], *мир["игроки"][:2]
    api = клиент(мир["админ"])
    вручную(api, t)
    mid = матч(api, t, a, b, 3, 2).data["manual_matches"][0]["id"]
    r = api.delete(url(t, f"manual/matches/{mid}/"))
    assert r.status_code == 200
    assert r.data["manual_matches"] == []


# ── Завершение турнира и пересчёт рейтинга ✳ (03.11.2026) ───────────


def завершить(api, t):
    return api.post(url(t, "manual/finish/"), format="json")


def test_завершение_пересчитывает_рейтинг_участников(мир):
    from rating.models import RatingEntry, RatingProfile

    t, a, b = мир["t"], *мир["игроки"][:2]
    api = клиент(мир["председатель"])
    вручную(api, t)
    матч(api, t, a, b, 3, 1)
    assert api.get(url(t)).data["can_finish"] is True

    r = завершить(api, t)
    assert r.status_code == 200, r.data
    t.refresh_from_db()
    assert t.status == Tournament.STATUS_FINISHED
    # По строке на игрока матча: победитель вверх, проигравший вниз.
    rows = {e.profile.user_id: e for e in RatingEntry.objects.filter(tournament=t, kind=RatingEntry.KIND_MATCH)}
    assert set(rows) == {a.id, b.id}
    assert rows[a.id].delta > 0 > rows[b.id].delta
    assert RatingProfile.objects.get(user=a).value == rows[a.id].after
    # В ответе — изменения рейтинга по участникам, сыгравшим матчи.
    changes = {c["player"]["name"]: c for c in r.data["rating_changes"]}
    assert set(changes) == {"Игрок 0", "Игрок 1"}
    assert float(changes["Игрок 0"]["delta"]) > 0
    assert r.data["tournament_status"] == Tournament.STATUS_FINISHED
    assert (r.data["can_finish"], r.data["can_manual"]) == (False, False)


def test_после_завершения_матчи_не_меняются(мир):
    t, a, b, c = мир["t"], *мир["игроки"][:3]
    api = клиент(мир["главный"])
    вручную(api, t)
    mid = матч(api, t, a, b, 3, 0).data["manual_matches"][0]["id"]
    завершить(api, t)
    assert матч(api, t, a, c, 3, 0).status_code == 400
    assert api.delete(url(t, f"manual/matches/{mid}/")).status_code == 400
    assert завершить(api, t).status_code == 400  # уже завершён


def test_без_матчей_не_завершить(мир):
    t = мир["t"]
    api = клиент(мир["главный"])
    вручную(api, t)
    assert api.get(url(t)).data["can_finish"] is False
    assert завершить(api, t).status_code == 400
    t.refresh_from_db()
    assert t.status != Tournament.STATUS_FINISHED


def test_нерейтинговый_завершается_без_пересчёта(мир):
    from rating.models import RatingEntry

    t, a, b = мир["t"], *мир["игроки"][:2]
    t.is_rating = False
    t.save(update_fields=["is_rating"])
    api = клиент(мир["главный"])
    вручную(api, t)
    матч(api, t, a, b, 3, 0)
    r = завершить(api, t)
    assert r.status_code == 200
    assert RatingEntry.objects.filter(tournament=t).count() == 0
    assert r.data["rating_changes"] == []


def test_завершить_может_только_тот_кто_вносит(мир):
    t, a, b = мир["t"], *мир["игроки"][:2]
    вручную(клиент(мир["главный"]), t)
    матч(клиент(мир["главный"]), t, a, b, 3, 0)
    assert завершить(клиент(мир["судья"]), t).status_code == 403
    assert завершить(клиент(a), t).status_code == 403


# ── Вернуть из завершённых — только последний ✳ (12.11.2026) ─────────


def вернуть(api, t):
    return api.post(url(t, "manual/unfinish/"), format="json")


def сыграть_и_завершить(api, t, a, b):
    вручную(api, t)
    матч(api, t, a, b, 3, 1)
    return завершить(api, t)


def test_последний_завершённый_возвращается_и_рейтинг_откатывается(мир):
    from rating.models import RatingEntry, RatingProfile

    t, a, b = мир["t"], *мир["игроки"][:2]
    api = клиент(мир["председатель"])
    сыграть_и_завершить(api, t, a, b)
    before_a = RatingProfile.objects.get(user=a).value
    assert api.get(url(t)).data["can_unfinish"] is True

    r = вернуть(api, t)
    assert r.status_code == 200, r.data
    t.refresh_from_db()
    assert t.status == Tournament.STATUS_IN_PROGRESS
    assert t.finished_at is None
    # Строки журнала остались, но отменены; карточка — без начислений турнира.
    assert RatingEntry.objects.filter(tournament=t, is_reverted=False).count() == 0
    assert RatingEntry.objects.filter(tournament=t, is_reverted=True).count() == 2
    assert RatingProfile.objects.get(user=a).value < before_a
    assert (r.data["tournament_status"], r.data["can_unfinish"], r.data["can_manual"]) == (
        Tournament.STATUS_IN_PROGRESS, False, True,
    )
    # Матчи снова правятся, и турнир завершается заново с тем же итогом.
    assert матч(api, t, a, b, 3, 0).status_code == 200
    assert завершить(api, t).status_code == 200
    assert RatingEntry.objects.filter(tournament=t, is_reverted=False).count() == 4


def test_вернуть_можно_только_последний_завершённый(мир):
    t, a, b, c, d = мир["t"], *мир["игроки"]
    api = клиент(мир["председатель"])
    сыграть_и_завершить(api, t, a, b)
    второй = Tournament.objects.create(name="Второй", created_by=мир["админ"], games_to_win=3)
    for p in (c, d):
        TournamentParticipant.objects.create(tournament=второй, user=p)
    сыграть_и_завершить(api, второй, c, d)

    assert api.get(url(t)).data["can_unfinish"] is False
    r = вернуть(api, t)
    assert r.status_code == 400
    assert "последний" in r.data["detail"]
    t.refresh_from_db()
    assert t.status == Tournament.STATUS_FINISHED
    # Последний — возвращается, и тогда последним становится первый.
    assert вернуть(api, второй).status_code == 200
    assert вернуть(api, t).status_code == 200


def test_не_вернуть_если_после_турнира_рейтинг_правили(мир):
    from rating import services

    t, a, b = мир["t"], *мир["игроки"][:2]
    api = клиент(мир["председатель"])
    сыграть_и_завершить(api, t, a, b)
    services.register_correction(a, "1.50", "ошибка в листе", actor=мир["председатель"])
    assert вернуть(api, t).status_code == 400
    t.refresh_from_db()
    assert t.status == Tournament.STATUS_FINISHED


def test_незавершённый_не_возвращается_и_чужим_нельзя(мир):
    t, a, b = мир["t"], *мир["игроки"][:2]
    api = клиент(мир["главный"])
    вручную(api, t)
    матч(api, t, a, b, 3, 1)
    assert вернуть(api, t).status_code == 400
    завершить(api, t)
    assert вернуть(клиент(мир["судья"]), t).status_code == 403
    assert вернуть(клиент(a), t).status_code == 403
    assert вернуть(api, t).status_code == 200
