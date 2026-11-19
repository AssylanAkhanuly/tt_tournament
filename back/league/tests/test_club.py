"""Заявка команды клубом ✳ (19.11.2026, LEAGUE.md «Заявка клуба»).

Администратор клуба сам заявляет команду в лигу сезона, пока идёт регистрация,
и сам набирает состав; федерация принимает или отклоняет заявку (отказ — с
комментарием). Проверяется то, что сломается при поломке: заявка клуба —
«ждёт решения», а внесённая федерацией — сразу «принята»; чужой клуб не
заявить; состав клуб правит, только пока идёт регистрация и заявка не принята;
отказ без комментария — 400; отклонённую клуб подаёт снова; в тур и таблицу
идут только принятые; «мои команды» и открытые сезоны клуба — с ручки `my/`."""
import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from clubs.models import Club, ClubAdmin
from league.models import Team
from users.models import Role, User

pytestmark = pytest.mark.django_db


def make_user(n, name, *kinds):
    user = User.objects.create_user(phone="+7700666" + str(n).zfill(4), name=name, password="x")
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
    club_admin = make_user(2, "Админ клуба", Role.KIND_CLUB_ADMIN)
    club = Club.objects.create(name="Клуб Шымкент")
    other = Club.objects.create(name="Чужой клуб")
    ClubAdmin.objects.create(club=club, user=club_admin)
    api = client_for(chairman)
    until = (timezone.localdate() + datetime.timedelta(days=10)).isoformat()
    season = api.post("/api/league/seasons/", {"year": 2026, "name": "Сезон 2026", "registration_until": until}, format="json").json()
    div = api.post("/api/league/divisions/", {"season_id": season["id"], "gender": "m", "name": "Суперлига", "level": 1}, format="json").json()
    players = [make_user(100 + i, "Игрок %02d" % i) for i in range(6)]
    from rating.models import RatingProfile

    for p in players:
        RatingProfile.objects.create(user=p, sex="m")
    return {"api": api, "club_api": client_for(club_admin), "club": club, "other": other,
            "season": season["id"], "division": div["id"], "players": players}


def apply(w, club=None, name=""):
    return w["club_api"].post(f"/api/league/divisions/{w['division']}/teams/",
                              {"club_id": str((club or w["club"]).id), "name": name}, format="json")


def add(api, team, user):
    return api.post(f"/api/league/teams/{team}/members/", {"user_id": str(user.id)}, format="json")


def close_registration(w):
    r = w["api"].patch(f"/api/league/seasons/{w['season']}/", {"registration_open": False}, format="json")
    assert r.status_code == 200, r.data


def test_club_application_waits_and_federation_entry_is_accepted(world):
    r = apply(world)
    assert r.status_code == 201, r.data
    assert r.json()["status"] == "submitted"
    r = world["api"].post(f"/api/league/divisions/{world['division']}/teams/",
                          {"club_id": str(world["other"].id), "name": ""}, format="json")
    assert r.json()["status"] == "accepted"


def test_club_cannot_apply_for_someone_elses_club(world):
    assert apply(world, club=world["other"]).status_code == 403


def test_club_edits_squad_only_while_registration_runs_and_not_accepted(world):
    w = world
    team = apply(w).json()["id"]
    assert add(w["club_api"], team, w["players"][0]).status_code == 201
    assert w["club_api"].get(f"/api/league/teams/{team}/").json()["can_edit"] is True

    r = w["api"].post(f"/api/league/teams/{team}/decide/", {"decision": "accept"}, format="json")
    assert r.status_code == 200 and r.json()["status"] == "accepted"
    r = add(w["club_api"], team, w["players"][1])
    assert r.status_code == 400 and "принята" in r.data["detail"]
    assert w["club_api"].get(f"/api/league/teams/{team}/").json()["can_edit"] is False
    # Федерация состав принятой команды правит.
    assert add(w["api"], team, w["players"][1]).status_code == 201


def test_squad_locked_for_club_when_registration_closes(world):
    w = world
    team = apply(w).json()["id"]
    close_registration(w)
    r = add(w["club_api"], team, w["players"][0])
    assert r.status_code == 400 and "Регистрация" in r.data["detail"]
    r = w["club_api"].delete(f"/api/league/teams/{team}/members/{w['players'][0].id}/")
    assert r.status_code == 400


def test_reject_needs_comment_and_club_resubmits(world):
    w = world
    team = apply(w).json()["id"]
    r = w["api"].post(f"/api/league/teams/{team}/decide/", {"decision": "reject", "comment": ""}, format="json")
    assert r.status_code == 400
    r = w["api"].post(f"/api/league/teams/{team}/decide/", {"decision": "reject", "comment": "Нет чека"}, format="json")
    assert r.json()["status"] == "rejected" and r.json()["decision_comment"] == "Нет чека"
    # Клуб видит причину, дорабатывает и подаёт снова.
    my = w["club_api"].get("/api/league/my/").json()
    row = next(t for t in my["teams"] if t["id"] == team)
    assert (row["status"], row["decision_comment"], row["can_resubmit"]) == ("rejected", "Нет чека", True)
    assert add(w["club_api"], team, w["players"][0]).status_code == 201
    r = w["club_api"].post(f"/api/league/teams/{team}/resubmit/")
    assert r.status_code == 200 and r.json()["status"] == "submitted"


def test_only_staff_decide(world):
    team = apply(world).json()["id"]
    r = world["club_api"].post(f"/api/league/teams/{team}/decide/", {"decision": "accept"}, format="json")
    assert r.status_code == 403
    assert Team.objects.get(pk=team).status == "submitted"


def test_tours_and_table_take_only_accepted_teams(world):
    w = world
    a = apply(w, name="А").json()["id"]
    b = apply(w, name="Б").json()["id"]
    apply(w, name="В")  # ждёт решения — в тур не идёт
    for t in (a, b):
        w["api"].post(f"/api/league/teams/{t}/decide/", {"decision": "accept"}, format="json")
    r = w["api"].post(f"/api/league/divisions/{w['division']}/tours/", {"number": 1, "city": "Астана"}, format="json")
    assert r.status_code == 201 and r.json()["matches"] == 1
    table = w["api"].get(f"/api/league/divisions/{w['division']}/").json()["table"]
    assert sorted(r["team"] for r in table) == ["А", "Б"]


def test_my_lists_club_teams_and_open_seasons(world):
    w = world
    apply(w, name="Шымкент-1")
    my = w["club_api"].get("/api/league/my/").json()
    assert [c["name"] for c in my["clubs"]] == ["Клуб Шымкент"]
    assert [t["name"] for t in my["teams"]] == ["Шымкент-1"]
    assert my["teams"][0]["season_name"] == "Сезон 2026" and my["teams"][0]["division_name"] == "Суперлига"
    assert [s["name"] for s in my["seasons"]] == ["Сезон 2026"]
    assert [d["name"] for d in my["seasons"][0]["divisions"]] == ["Суперлига"]
    close_registration(w)
    assert w["club_api"].get("/api/league/my/").json()["seasons"] == []
