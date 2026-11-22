"""Счёт матча судьёй стола ✳ (22.11.2026, flows/09 Э9.2–Э9.5; главная схема
`flow-tournaments`: «Судья вносит счёт, результат сразу публичный»).

Проверяется то, что сломается при поломке: правила партии (до 11, при 10 : 10
— до разрыва в два); «Мой стол» — только свои матчи отправленного расписания;
счёт вносит только судья этого матча; партия сразу видна, счёт матча — из
партий; подтвердить можно только решённый матч; после подтверждения судья не
правит, правит главный судья; таблица группы пересчитывается."""
import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from tournaments import roster, schedule, scoring
from tournaments.models import GroupMatch, GroupParticipant, Tournament, TournamentParticipant
from users.models import Role, User

pytestmark = pytest.mark.django_db


def person(n, name, *kinds):
    u = User.objects.create_user(phone="+7700777" + str(n).zfill(4), name=name, password="x")
    for k in kinds:
        Role.objects.create(user=u, kind=k)
    return u


def api_for(user):
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.fixture
def world():
    admin = person(1, "Админ", Role.KIND_FEDERATION_ADMIN)
    t = Tournament.objects.create(
        name="Кубок", created_by=admin, format=Tournament.FORMAT_GROUP, group_size=4, games_to_win=3,
        starts_at=timezone.make_aware(datetime.datetime(2026, 11, 14, 12, 0)),
    )
    chief = person(2, "Главный", Role.KIND_REFEREE)
    roster.add_referee(t, chief, Role.KIND_CHIEF_REFEREE)
    referees = [person(10 + i, "Судья %d" % i, Role.KIND_REFEREE) for i in range(2)]
    for r in referees:
        roster.add_referee(t, r, Role.KIND_REFEREE)
    for i in range(4):
        TournamentParticipant.objects.create(tournament=t, user=person(20 + i, "Игрок %d" % i))
    schedule.build(t, tables=2, match_minutes=30, days=[{"date": "2026-11-14", "start": "10:00", "end": "18:00"}])
    schedule.finalize(t)
    t.refresh_from_db()
    m = GroupMatch.objects.filter(group__tournament=t).order_by("scheduled_at", "id").first()
    return {"t": t, "admin": admin, "chief": chief, "referees": referees, "m": m}


def url(m, tail="scoring/"):
    return f"/api/tournaments/{m.group.tournament_id}/group-matches/{m.id}/{tail}"


def act(user, m, **data):
    return api_for(user).post(url(m), data, format="json")


@pytest.mark.parametrize("a,b,ok", [
    (11, 9, True), (11, 0, True), (12, 10, True), (15, 13, True), (9, 11, True),
    (11, 10, False), (10, 8, False), (12, 9, False), (13, 10, False), (11, 11, False), (-1, 11, False),
])
def test_game_rules(a, b, ok):
    assert scoring.valid_game(a, b) is ok


def test_my_table_lists_only_my_matches_of_sent_schedules(world):
    m, ref = world["m"], world["m"].referee
    r = api_for(ref).get("/api/tournaments/my-table/")
    assert r.status_code == 200
    ids = {x["id"] for x in r.json()["matches"]}
    assert m.id in ids
    assert ids == set(GroupMatch.objects.filter(referee=ref).values_list("id", flat=True))
    # турнир с черновиком расписания судье стола не показывается
    world["t"].schedule_status = schedule.DRAFT
    world["t"].save(update_fields=["schedule_status"])
    assert api_for(ref).get("/api/tournaments/my-table/").json()["matches"] == []


def test_only_assigned_referee_scores(world):
    m = world["m"]
    other = next(r for r in world["referees"] if r.id != m.referee_id)
    assert act(other, m, action="start").status_code == 403
    assert act(world["chief"], m, action="game", a=11, b=5).status_code == 403
    r = act(m.referee, m, action="start")
    assert r.status_code == 200 and r.json()["status"] == "in_progress" and r.json()["can_score"] is True


def test_games_are_public_at_once_and_match_score_follows_games(world):
    m, ref = world["m"], world["m"].referee
    assert act(ref, m, action="game", a=11, b=10).status_code == 400  # не по правилам
    act(ref, m, action="game", a=11, b=7)
    act(ref, m, action="game", a=9, b=11)
    # любой вошедший видит идущий матч со счётом по партиям
    seen = api_for(world["admin"]).get(url(m)).json()
    assert seen["status"] == "in_progress" and seen["games"] == [[11, 7], [9, 11]]
    assert (seen["score1"], seen["score2"]) == (1, 1)
    # не решён — подтвердить нельзя
    r = act(ref, m, action="submit")
    assert r.status_code == 400 and "1 : 1" in r.json()["detail"]
    act(ref, m, action="game", a=12, b=10)
    act(ref, m, action="undo")  # снял последнюю
    assert api_for(ref).get(url(m)).json()["games"] == [[11, 7], [9, 11]]
    act(ref, m, action="game", a=12, b=10)
    act(ref, m, action="game", a=11, b=3)
    assert act(ref, m, action="game", a=11, b=3).status_code == 400  # матч решён — лишняя партия
    r = act(ref, m, action="submit")
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "finished" and (d["score1"], d["score2"]) == (3, 1)
    assert d["winner_id"] == str(m.player1_id) and d["result_by"] == ref.name and d["can_score"] is False
    # таблица группы пересчитана
    gp = GroupParticipant.objects.get(group=m.group, user=m.player1)
    assert (gp.wins, gp.points, gp.diff) == (1, 2, 2)


def test_result_only_short_path(world):
    m, ref = world["m"], world["m"].referee
    assert act(ref, m, action="submit", score1=3, score2=3).status_code == 400
    assert act(ref, m, action="submit", score1=2, score2=1).status_code == 400  # до 3 побед
    d = act(ref, m, action="submit", score1=1, score2=3).json()
    assert d["status"] == "finished" and d["games"] == [] and d["winner_id"] == str(m.player2_id)


def test_after_submit_only_chief_corrects(world):
    m, ref, chief = world["m"], world["m"].referee, world["chief"]
    act(ref, m, action="submit", score1=3, score2=0)
    r = act(ref, m, action="game", a=11, b=9)
    assert r.status_code == 400 and "главный судья" in r.json()["detail"]
    assert act(ref, m, action="correct", score1=3, score2=1).status_code == 403
    assert api_for(chief).get(url(m)).json()["can_correct"] is True
    bad = act(chief, m, action="correct", games=[[11, 9], [11, 9]])
    assert bad.status_code == 400  # не доигран
    d = act(chief, m, action="correct", games=[[5, 11], [11, 9], [9, 11], [7, 11]]).json()
    assert (d["score1"], d["score2"]) == (1, 3) and d["winner_id"] == str(m.player2_id) and d["result_by"] == chief.name
    gp = GroupParticipant.objects.get(group=m.group, user=m.player2)
    assert (gp.wins, gp.points) == (1, 2)


def test_finished_tournament_is_closed(world):
    m, ref = world["m"], world["m"].referee
    world["t"].status = Tournament.STATUS_FINISHED
    world["t"].save(update_fields=["status"])
    assert act(ref, m, action="start").status_code == 400
    assert api_for(ref).get("/api/tournaments/my-table/").json()["matches"] == []


def test_board_players_carry_figure_and_sex(world):
    """Табло рисует по краям фигуры игроков ✳ (22.11.2026): снимок по пояс из
    профиля сборной, без снимка — заглушка своего пола."""
    from decimal import Decimal

    from national.models import NationalTeamMember
    from rating.models import RatingProfile

    m = world["m"]
    RatingProfile.objects.create(user=m.player1, value=Decimal("500"), sex="f", region="Алматы", birth_year=2006)
    NationalTeamMember.objects.create(user=m.player1, figure="national/figures/p1.png")
    data = api_for(m.referee).get(url(m)).json()
    assert data["player1"]["figure"] == "/media/national/figures/p1.png"
    assert data["player1"]["sex"] == "f"
    assert data["player1"]["region"] == "Алматы"
    assert data["player2"]["figure"] is None and data["player2"]["sex"] == ""
    mine = next(x for x in api_for(m.referee).get("/api/tournaments/my-table/").json()["matches"] if x["id"] == m.id)
    assert mine["player1"]["figure"] == "/media/national/figures/p1.png"
