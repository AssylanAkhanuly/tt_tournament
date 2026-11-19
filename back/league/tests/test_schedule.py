"""Расписание тура Лиги ✳ (19.11.2026, LEAGUE.md «Расписание тура») — как у
турнира: столов, минут на командную встречу и игровые дни → черновик (время и
стол каждой встрече, команда в одном слоте играет не больше раза) → правка
времени и стола → «Отправить», после чего расписание не меняется.

Проверяется то, что сломается при поломке: 4 команды на 2 столах — 6 встреч в
3 слотах, команда в слоте одна; время идёт шагом встречи от начала дня; не
влезло — 400 с числами; по умолчанию день — дата тура; правка на занятый стол
или с командой, которая в это время играет, — 400; отправленное не правится и
не пересобирается; без даты и дней — 400; строит только ведущий лигу."""
import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from clubs.models import Club
from league.models import TeamMatch
from users.models import Role, User

pytestmark = pytest.mark.django_db


def make_user(n, name, *kinds):
    user = User.objects.create_user(phone="+7700777" + str(n).zfill(4), name=name, password="x")
    for k in kinds:
        Role.objects.create(user=user, kind=k)
    return user


@pytest.fixture
def tour():
    chairman = make_user(1, "Председатель", Role.KIND_GSK_CHAIRMAN)
    api = APIClient()
    api.force_authenticate(chairman)
    season = api.post("/api/league/seasons/", {"year": 2026, "name": "Сезон 2026"}, format="json").json()
    div = api.post("/api/league/divisions/", {"season_id": season["id"], "gender": "m", "name": "Суперлига", "level": 1}, format="json").json()
    for n in "ABCD":
        club = Club.objects.create(name="Клуб " + n)
        r = api.post(f"/api/league/divisions/{div['id']}/teams/", {"club_id": str(club.id), "name": n}, format="json")
        assert r.status_code == 201, r.data
    r = api.post(f"/api/league/divisions/{div['id']}/tours/", {"number": 1, "city": "Астана", "starts_on": "2026-12-05"}, format="json")
    assert r.status_code == 201, r.data
    return {"api": api, "tour": r.json()["id"], "division": div["id"]}


def build(w, **data):
    return w["api"].post(f"/api/league/tours/{w['tour']}/schedule/build/", data, format="json")


def matches(w):
    return w["api"].get(f"/api/league/tours/{w['tour']}/").json()["matches"]


def local(iso):
    return timezone.localtime(datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")))


def test_four_teams_on_two_tables_take_three_slots_one_match_per_team(tour):
    r = build(tour, tables=2, match_minutes=120)
    assert r.status_code == 200, r.data
    ms = matches(tour)
    assert len(ms) == 6
    slots = {}
    for m in ms:
        assert m["table"] in (1, 2)
        slots.setdefault(m["scheduled_at"], []).append(m)
    assert len(slots) == 3
    for group in slots.values():
        teams = [t for m in group for t in (m["team_a"]["id"], m["team_b"]["id"])]
        assert len(teams) == len(set(teams))  # команда в слоте — одна встреча
    # По умолчанию — день тура с 10:00, шаг — длительность встречи.
    starts = sorted(local(k) for k in slots)
    assert [s.strftime("%Y-%m-%d %H:%M") for s in starts] == ["2026-12-05 10:00", "2026-12-05 12:00", "2026-12-05 14:00"]
    s = tour["api"].get(f"/api/league/tours/{tour['tour']}/").json()["schedule"]
    assert (s["status"], s["tables"], s["match_minutes"]) == ("draft", 2, 120)


def test_not_fitting_into_days_says_how_many_slots(tour):
    r = build(tour, tables=1, match_minutes=180, days=[{"date": "2026-12-05", "start": "10:00", "end": "16:00"}])
    assert r.status_code == 400
    assert "нужно 6, есть 2" in r.data["detail"]


def test_edit_refuses_busy_table_and_busy_team(tour):
    # Три стола: в слоте две встречи (четыре команды заняты), третий стол свободен.
    build(tour, tables=3, match_minutes=120)
    ms = sorted(matches(tour), key=lambda m: (m["scheduled_at"], m["table"]))
    first, other = ms[0], ms[-1]
    assert other["scheduled_at"] != first["scheduled_at"]
    url = f"/api/league/team-matches/{other['id']}/schedule/"
    r = tour["api"].patch(url, {"table": first["table"], "scheduled_at": first["scheduled_at"]}, format="json")
    assert r.status_code == 400 and "стол" in r.data["detail"].lower()
    r = tour["api"].patch(url, {"table": 3, "scheduled_at": first["scheduled_at"]}, format="json")
    assert r.status_code == 400 and "команд" in r.data["detail"].lower()
    later = (local(first["scheduled_at"]) + datetime.timedelta(hours=8)).isoformat()
    r = tour["api"].patch(url, {"table": 1, "scheduled_at": later}, format="json")
    assert r.status_code == 200, r.data
    assert local(r.json()["scheduled_at"]) == local(later)


def test_finalized_schedule_is_locked(tour):
    build(tour, tables=2, match_minutes=120)
    r = tour["api"].post(f"/api/league/tours/{tour['tour']}/schedule/finalize/")
    assert r.status_code == 200 and r.json()["status"] == "final"
    m = matches(tour)[0]
    assert tour["api"].patch(f"/api/league/team-matches/{m['id']}/schedule/", {"table": 2}, format="json").status_code == 400
    assert build(tour, tables=3, match_minutes=60).status_code == 400
    assert TeamMatch.objects.filter(tour_id=tour["tour"], scheduled_at__isnull=True).count() == 0


def test_tour_without_date_needs_days(tour):
    from league.models import LeagueTour

    LeagueTour.objects.filter(pk=tour["tour"]).update(starts_on=None)
    r = build(tour, tables=2, match_minutes=120)
    assert r.status_code == 400 and "дн" in r.data["detail"]
    r = build(tour, tables=2, match_minutes=120, days=[{"date": "2026-12-06", "start": "09:00", "end": "18:00"}])
    assert r.status_code == 200, r.data


def test_only_league_staff_build(tour):
    outsider = APIClient()
    outsider.force_authenticate(make_user(9, "Посторонний"))
    r = outsider.post(f"/api/league/tours/{tour['tour']}/schedule/build/", {"tables": 2, "match_minutes": 120}, format="json")
    assert r.status_code == 403
