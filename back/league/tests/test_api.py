"""Евразийская лига через API ✳ (19.11.2026, ТЗ §4.10; LEAGUE.md).

Дивизион заводит председатель ГСК; команду заявляет администратор клуба (или
председатель); состав на сезон — до 8, игрок за сезон — в одной команде; тур
сразу получает встречи по круговой; счёт встречи вносит председатель — расстановка
из состава и личные встречи по порядку Свейтлинга; таблица дивизиона считается
движком.

Проверяется то, что сломается при поломке: чужой клуб команду не заявит,
девятый в составе и игрок второй команды отбиваются, тур из 4 команд даёт 6
встреч, игрок не из состава в расстановке — 400, лишняя личная встреча — 400,
таблица ставит победителя выше, неявка — 0 очков."""
import datetime

import pytest
from rest_framework.test import APIClient

from clubs.models import Club, ClubAdmin
from league.models import LeagueRules, TeamMatch
from users.models import Role, User

pytestmark = pytest.mark.django_db


def make_user(n, name, *kinds):
    user = User.objects.create_user(phone="+7700444" + str(n).zfill(4), name=name, password="x")
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
    clubs = [Club.objects.create(name="Клуб %s" % c) for c in "ABCD"]
    ClubAdmin.objects.create(club=clubs[0], user=club_admin)
    players = [make_user(100 + i, "Игрок %02d" % i) for i in range(20)]
    api = client_for(chairman)
    r = api.post("/api/league/divisions/", {"season": 2026, "gender": "m", "name": "Суперлига", "level": 1}, format="json")
    assert r.status_code == 201, r.data
    return {"chairman": chairman, "club_admin": club_admin, "clubs": clubs, "players": players,
            "api": api, "division": r.data["id"]}


def register_team(api, division, club, name):
    r = api.post(f"/api/league/divisions/{division}/teams/", {"club_id": str(club.id), "name": name}, format="json")
    assert r.status_code == 201, r.data
    return r.data["id"]


def add_members(api, team, users):
    for u in users:
        r = api.post(f"/api/league/teams/{team}/members/", {"user_id": str(u.id)}, format="json")
        assert r.status_code == 201, r.data


@pytest.fixture
def four_teams(world):
    api, div, p = world["api"], world["division"], world["players"]
    teams = [register_team(api, div, club, club.name) for club in world["clubs"]]
    for i, team in enumerate(teams):
        add_members(api, team, p[i * 4:(i + 1) * 4])
    r = api.post(f"/api/league/divisions/{div}/tours/", {"number": 1, "city": "Астана", "starts_on": "2026-12-05"}, format="json")
    assert r.status_code == 201, r.data
    world.update(teams=teams, tour=r.data["id"])
    return world


# ── Команды и составы ──────────────────────────────────────────────────────


def test_club_admin_registers_own_club_only(world):
    api = client_for(world["club_admin"])
    div = world["division"]
    assert api.post(f"/api/league/divisions/{div}/teams/", {"club_id": str(world["clubs"][0].id), "name": "A"}, format="json").status_code == 201
    r = api.post(f"/api/league/divisions/{div}/teams/", {"club_id": str(world["clubs"][1].id), "name": "B"}, format="json")
    assert r.status_code == 403


def test_squad_limit_and_one_team_per_season(world):
    api, div, p = world["api"], world["division"], world["players"]
    team_a = register_team(api, div, world["clubs"][0], "A")
    team_b = register_team(api, div, world["clubs"][1], "B")
    add_members(api, team_a, p[:8])
    r = api.post(f"/api/league/teams/{team_a}/members/", {"user_id": str(p[8].id)}, format="json")
    assert r.status_code == 400 and "8" in r.data["detail"]
    r = api.post(f"/api/league/teams/{team_b}/members/", {"user_id": str(p[0].id)}, format="json")
    assert r.status_code == 400
    assert "Клуб A" in r.data["detail"] or "A" in r.data["detail"]


def test_squad_member_can_be_removed(world):
    api, div, p = world["api"], world["division"], world["players"]
    team = register_team(api, div, world["clubs"][0], "A")
    add_members(api, team, p[:2])
    assert api.delete(f"/api/league/teams/{team}/members/{p[0].id}/").status_code == 204
    r = api.get(f"/api/league/teams/{team}/")
    assert [m["name"] for m in r.data["members"]] == ["Игрок 01"]


# ── Туры и встречи ─────────────────────────────────────────────────────────


def test_tour_builds_round_robin(four_teams):
    assert TeamMatch.objects.filter(tour_id=four_teams["tour"]).count() == 6
    r = four_teams["api"].get(f"/api/league/tours/{four_teams['tour']}/")
    assert len(r.data["matches"]) == 6


def first_match(world):
    return TeamMatch.objects.filter(tour_id=world["tour"]).order_by("id").first()


def lineup(world, team_id, n=3):
    from league.models import TeamMember

    return [str(m.user_id) for m in TeamMember.objects.filter(team_id=team_id).order_by("id")[:n]]


def test_record_result_and_table(four_teams):
    w = four_teams
    m = first_match(w)
    body = {
        "lineup_a": lineup(w, m.team_a_id),
        "lineup_b": lineup(w, m.team_b_id),
        "rubbers": [[3, 1], [3, 0], [1, 3], [3, 2]],
    }
    r = w["api"].post(f"/api/league/team-matches/{m.id}/result/", body, format="json")
    assert r.status_code == 200, r.data
    assert (r.data["rubbers_a"], r.data["rubbers_b"], r.data["winner"], r.data["status"]) == (3, 1, "a", "finished")
    table = w["api"].get(f"/api/league/divisions/{w['division']}/").data["table"]
    top = table[0]
    assert (top["team_id"], top["points"], top["won"]) == (str(m.team_a_id), 2, 1)
    loser = next(row for row in table if row["team_id"] == str(m.team_b_id))
    assert loser["points"] == 1


def test_lineup_from_outside_squad_is_refused(four_teams):
    w = four_teams
    m = first_match(w)
    stranger = make_user(999, "Чужой")
    body = {
        "lineup_a": lineup(w, m.team_a_id, 2) + [str(stranger.id)],
        "lineup_b": lineup(w, m.team_b_id),
        "rubbers": [[3, 0], [3, 0], [3, 0]],
    }
    r = w["api"].post(f"/api/league/team-matches/{m.id}/result/", body, format="json")
    assert r.status_code == 400
    m.refresh_from_db()
    assert m.status == "pending"


def test_extra_rubber_after_decision_is_refused(four_teams):
    w = four_teams
    m = first_match(w)
    body = {
        "lineup_a": lineup(w, m.team_a_id),
        "lineup_b": lineup(w, m.team_b_id),
        "rubbers": [[3, 0], [3, 0], [3, 0], [3, 0]],
    }
    r = w["api"].post(f"/api/league/team-matches/{m.id}/result/", body, format="json")
    assert r.status_code == 400
    assert "решена" in r.data["detail"]


def test_no_show_gives_zero_points(four_teams):
    w = four_teams
    m = first_match(w)
    r = w["api"].post(f"/api/league/team-matches/{m.id}/no-show/", {"absent": "b"}, format="json")
    assert r.status_code == 200, r.data
    table = {row["team_id"]: row for row in w["api"].get(f"/api/league/divisions/{w['division']}/").data["table"]}
    assert table[str(m.team_b_id)]["points"] == 0
    assert table[str(m.team_a_id)]["points"] == 2


def test_only_chairman_records_results(four_teams):
    w = four_teams
    m = first_match(w)
    r = client_for(w["club_admin"]).post(f"/api/league/team-matches/{m.id}/no-show/", {"absent": "b"}, format="json")
    assert r.status_code == 403


# ── Правила — настройка ────────────────────────────────────────────────────


def test_rules_are_a_setting(four_teams):
    w = four_teams
    r = w["api"].patch("/api/league/rules/", {"points_loss": 0}, format="json")
    assert r.status_code == 200, r.data
    assert LeagueRules.active().points_loss == 0
    m = first_match(w)
    w["api"].post(f"/api/league/team-matches/{m.id}/no-show/", {"absent": "a"}, format="json")
    table = {row["team_id"]: row for row in w["api"].get(f"/api/league/divisions/{w['division']}/").data["table"]}
    assert table[str(m.team_b_id)]["points"] == 2


def test_rules_readable_by_anyone():
    r = APIClient().get("/api/league/rules/")
    assert r.status_code == 200
    assert (r.data["order"], r.data["wins_needed"], r.data["squad_max"]) == ("A-X,B-Y,C-Z,A-Y,B-X", 3, 8)
