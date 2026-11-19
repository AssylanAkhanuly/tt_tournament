"""Сезон Лиги ✳ (19.11.2026, LEAGUE.md «Сезон»).

Проверяется то, что сломается при поломке: новый сезон — с закрытой
регистрацией, пока не задан срок; администратор клуба без открытой регистрации
команду не заявит, а с открытой — заявит; срок прошёл — регистрация не идёт;
председатель вносит команду и при закрытой; завершённый сезон отбивает лигу,
команду, состав, тур и счёт; лига сезона с тем же розыгрышем и уровнем — 400;
сезон в списке несёт даты туров и ход; заводить и править сезон — только ведущие
лигу."""
import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from clubs.models import Club, ClubAdmin
from league.models import LeagueSeason, TeamMatch
from users.models import Role, User

pytestmark = pytest.mark.django_db


def make_user(n, name, *kinds):
    user = User.objects.create_user(phone="+7700555" + str(n).zfill(4), name=name, password="x")
    for k in kinds:
        Role.objects.create(user=user, kind=k)
    return user


def client_for(user):
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.fixture
def world():
    chairman = make_user(1, "Председатель", Role.KIND_GSK_CHAIRMAN)
    club_admin = make_user(2, "Админ клуба")
    club = Club.objects.create(name="Клуб Сезона")
    ClubAdmin.objects.create(club=club, user=club_admin)
    api = client_for(chairman)
    r = api.post("/api/league/seasons/", {"year": 2026, "name": "Сезон 2026"}, format="json")
    assert r.status_code == 201, r.data
    season = r.json()
    r = api.post("/api/league/divisions/", {"season_id": season["id"], "gender": "m", "name": "Суперлига", "level": 1}, format="json")
    assert r.status_code == 201, r.data
    return {"api": api, "club_api": client_for(club_admin), "club": club, "season": season["id"], "division": r.json()["id"]}


def register(api, w, name="Команда"):
    return api.post(f"/api/league/divisions/{w['division']}/teams/", {"club_id": str(w["club"].id), "name": name}, format="json")


def patch(w, **data):
    r = w["api"].patch(f"/api/league/seasons/{w['season']}/", data, format="json")
    assert r.status_code == 200, r.data
    return r.json()


def test_new_season_has_closed_registration_until_a_date_is_set(world):
    s = world["api"].get(f"/api/league/seasons/{world['season']}/").json()
    assert s["registration"] == {"open": False, "until": None, "active": False}
    until = (timezone.localdate() + datetime.timedelta(days=10)).isoformat()
    r = world["api"].post("/api/league/seasons/", {"year": 2027, "name": "Сезон 2027", "registration_until": until}, format="json")
    assert r.json()["registration"] == {"open": True, "until": until, "active": True}


def test_club_admin_registers_only_while_registration_runs(world):
    r = register(world["club_api"], world)
    assert r.status_code == 400 and "Регистрация" in r.data["detail"]

    patch(world, registration_open=True)
    assert register(world["club_api"], world).status_code == 201

    yesterday = (timezone.localdate() - datetime.timedelta(days=1)).isoformat()
    s = patch(world, registration_until=yesterday)
    assert s["registration"]["active"] is False
    assert register(world["club_api"], world, "Вторая").status_code == 400


def test_chairman_enters_team_with_registration_closed(world):
    assert register(world["api"], world).status_code == 201


def test_closed_season_refuses_every_change(world):
    w = world
    teams = [register(w["api"], w, n).json()["id"] for n in ("А", "Б")]
    player = make_user(50, "Игрок")
    r = w["api"].post(f"/api/league/teams/{teams[0]}/members/", {"user_id": str(player.id)}, format="json")
    assert r.status_code == 201, r.data
    r = w["api"].post(f"/api/league/divisions/{w['division']}/tours/", {"number": 1, "city": "Астана"}, format="json")
    assert r.status_code == 201, r.data
    match = TeamMatch.objects.get(tour_id=r.json()["id"])

    s = patch(w, closed=True)
    assert s["closed"] is True and s["registration"]["active"] is False

    refused = [
        w["api"].post("/api/league/divisions/", {"season_id": w["season"], "gender": "f", "name": "Суперлига", "level": 1}, format="json"),
        register(w["api"], w, "В"),
        w["api"].post(f"/api/league/teams/{teams[1]}/members/", {"user_id": str(make_user(51, "Ещё").id)}, format="json"),
        w["api"].delete(f"/api/league/teams/{teams[0]}/members/{player.id}/"),
        w["api"].post(f"/api/league/divisions/{w['division']}/tours/", {"number": 2, "city": "Алматы"}, format="json"),
        w["api"].post(f"/api/league/team-matches/{match.id}/no-show/", {"absent": "a"}, format="json"),
    ]
    assert [r.status_code for r in refused] == [400] * 6
    assert all("Сезон завершён" in r.data["detail"] for r in refused)

    # Завершение снимается тем же переключателем.
    patch(w, closed=False)
    assert register(w["api"], w, "В").status_code == 201


def test_league_level_and_gender_do_not_repeat_in_season(world):
    r = world["api"].post("/api/league/divisions/", {"season_id": world["season"], "gender": "m", "name": "Другая", "level": 1}, format="json")
    assert r.status_code == 400
    r = world["api"].post("/api/league/divisions/", {"season_id": world["season"], "gender": "f", "name": "Суперлига", "level": 1}, format="json")
    assert r.status_code == 201


def test_season_list_carries_calendar_dates_and_progress(world):
    w = world
    for n in ("А", "Б", "В"):
        register(w["api"], w, n)
    r = w["api"].post(f"/api/league/divisions/{w['division']}/tours/", {"number": 1, "city": "Астана", "starts_on": "2026-12-05"}, format="json")
    tour = r.json()["id"]
    w["api"].post(f"/api/league/divisions/{w['division']}/tours/", {"number": 2, "city": "Алматы", "starts_on": "2027-02-14"}, format="json")
    TeamMatch.objects.filter(pk=TeamMatch.objects.filter(tour_id=tour).first().pk).update(status="finished")

    row = next(s for s in w["api"].get("/api/league/seasons/").json() if s["id"] == w["season"])
    assert row["starts_on"] == "2026-12-05" and row["ends_on"] == "2027-02-14"
    assert row["cities"] == ["Астана", "Алматы"]
    assert (row["leagues"], row["teams"], row["tours"], row["matches"], row["finished"]) == (1, 3, 2, 6, 1)

    detail = w["api"].get(f"/api/league/seasons/{w['season']}/").json()
    assert [d["name"] for d in detail["divisions"]] == ["Суперлига"]
    assert detail["divisions"][0]["teams"] == 3


def test_only_league_staff_create_and_edit_seasons(world):
    r = world["club_api"].post("/api/league/seasons/", {"year": 2030, "name": "Чужой"}, format="json")
    assert r.status_code == 403
    r = world["club_api"].patch(f"/api/league/seasons/{world['season']}/", {"closed": True}, format="json")
    assert r.status_code == 403
    assert LeagueSeason.objects.get(pk=world["season"]).closed is False


def test_season_needs_a_sane_year(world):
    r = world["api"].post("/api/league/seasons/", {"year": "abc", "name": "x"}, format="json")
    assert r.status_code == 400
    r = world["api"].post("/api/league/seasons/", {"year": 1990, "name": "x"}, format="json")
    assert r.status_code == 400
