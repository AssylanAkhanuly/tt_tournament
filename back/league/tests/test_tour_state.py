"""Состояние тура для обзора сезона ✳ (21.11.2026, LEAGUE.md «Обзор сезона»).

Сервер решает, что показать в полоске туров лиги: сыграно, идёт, расписание
отправлено, черновик, без расписания — или проблема с текстом. Проверяется то,
что сломается при поломке: все встречи сыграны — «сыграно»; дата прошла, а счёт
не весь — проблема «Не внесён счёт»; черновик без судьи у встречи — «Нет судей
стола»; до тура две недели или меньше, а расписания нет — «Нет расписания»;
дальше — просто «без расписания»; в ответе сезона у лиги — туры с состоянием."""
import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from clubs.models import Club
from league.models import LeagueTour, TeamMatch
from league.services import tour_state
from users.models import Role, User

pytestmark = pytest.mark.django_db
TODAY = datetime.date(2026, 12, 1)


@pytest.fixture
def league():
    chairman = User.objects.create_user(phone="+77008880001", name="Председатель", password="x")
    Role.objects.create(user=chairman, kind=Role.KIND_GSK_CHAIRMAN)
    api = APIClient()
    api.force_authenticate(chairman)
    season = api.post("/api/league/seasons/", {"year": 2026, "name": "Сезон 2026"}, format="json").json()
    div = api.post("/api/league/divisions/", {"season_id": season["id"], "gender": "m", "name": "Суперлига", "level": 1}, format="json").json()
    for n in "AB":
        club = Club.objects.create(name="Клуб " + n)
        api.post(f"/api/league/divisions/{div['id']}/teams/", {"club_id": str(club.id), "name": n}, format="json")
    return {"api": api, "season": season["id"], "division": div["id"]}


def tour(w, number, starts_on):
    r = w["api"].post(f"/api/league/divisions/{w['division']}/tours/",
                      {"number": number, "city": "Астана", "starts_on": starts_on and starts_on.isoformat()}, format="json")
    assert r.status_code == 201, r.data
    return LeagueTour.objects.get(pk=r.json()["id"])


def test_all_played_is_done(league):
    t = tour(league, 1, TODAY - datetime.timedelta(days=5))
    t.matches.update(status="finished")
    assert tour_state(t, TODAY) == ("done", "")


def test_past_date_with_unscored_match_is_a_problem(league):
    t = tour(league, 1, TODAY - datetime.timedelta(days=1))
    assert tour_state(t, TODAY) == ("issue", "Не внесён счёт")


def test_draft_without_referee_is_a_problem(league):
    t = tour(league, 1, TODAY + datetime.timedelta(days=30))
    t.schedule_status = "draft"
    t.save()
    assert tour_state(t, TODAY) == ("issue", "Нет судей стола")
    ref = User.objects.create_user(phone="+77008880002", name="Судья", password="x")
    t.matches.update(referee=ref)
    assert tour_state(t, TODAY) == ("draft", "")


def test_no_schedule_close_to_date_is_a_problem_far_is_planned(league):
    near = tour(league, 1, TODAY + datetime.timedelta(days=10))
    far = tour(league, 2, TODAY + datetime.timedelta(days=60))
    assert tour_state(near, TODAY) == ("issue", "Нет расписания")
    assert tour_state(far, TODAY) == ("planned", "")


def test_sent_schedule_waits_for_the_day(league):
    t = tour(league, 1, TODAY + datetime.timedelta(days=3))
    t.schedule_status = "final"
    t.save()
    assert tour_state(t, TODAY) == ("ready", "")


def test_season_detail_lists_tours_with_state(league):
    t = tour(league, 1, timezone.localdate() - datetime.timedelta(days=3))
    TeamMatch.objects.filter(tour=t).update(status="finished")
    tour(league, 2, timezone.localdate() + datetime.timedelta(days=90))
    d = league["api"].get(f"/api/league/seasons/{league['season']}/").json()["divisions"][0]
    assert [(x["number"], x["state"]) for x in d["tour_list"]] == [(1, "done"), (2, "planned")]
