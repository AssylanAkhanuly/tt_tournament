"""Допуск врача соревнований ✳ (22.11.2026, flows/18; главная схема
`flow-tournaments`: «Врач допустил по справке?»).

Проверяется то, что сломается при поломке: врач назначается в турнир как
судейская должность и один; решает только врач этого турнира; недопуск без
причины отбивается; с врачом в расписание идут только допущенные, без врача —
все; судьи заявкой на «врача» не подаются."""
from django.utils import timezone

import pytest
from rest_framework.test import APIClient

from tournaments import medical, recruitment, roster, schedule
from tournaments.models import Tournament, TournamentParticipant
from users.models import Role, User

pytestmark = pytest.mark.django_db


def person(n, name):
    return User.objects.create_user(phone="+7700888" + str(n).zfill(4), name=name, password="x")


def api_for(user):
    api = APIClient()
    api.force_authenticate(user)
    return api


@pytest.fixture
def world():
    chair = person(1, "Председатель")
    Role.objects.create(user=chair, kind=Role.KIND_GSK_CHAIRMAN)
    t = Tournament.objects.create(name="Кубок", created_by=chair, starts_at=timezone.now())
    players = [person(10 + i, "Игрок %d" % i) for i in range(4)]
    for p in players:
        TournamentParticipant.objects.create(tournament=t, user=p)
    doctor = person(2, "Врач соревнований")
    return {"t": t, "chair": chair, "players": players, "doctor": doctor}


def test_doctor_is_a_single_tournament_position(world):
    t = world["t"]
    roster.add_referee(t, world["doctor"], Role.KIND_COMPETITION_DOCTOR)
    assert medical.is_doctor(t, world["doctor"]) and medical.requires_admission(t)
    with pytest.raises(roster.RosterError):
        roster.add_referee(t, person(3, "Второй врач"), Role.KIND_COMPETITION_DOCTOR)
    # на «врача» судья заявкой не подаётся
    with pytest.raises(recruitment.RecruitmentError):
        recruitment._clean_positions([Role.KIND_COMPETITION_DOCTOR])


def test_only_tournament_doctor_decides_and_denial_needs_reason(world):
    t, doctor, p0 = world["t"], world["doctor"], world["players"][0]
    roster.add_referee(t, doctor, Role.KIND_COMPETITION_DOCTOR)
    url = f"/api/tournaments/{t.id}/medical/"
    r = api_for(doctor).get(url)
    assert r.status_code == 200 and r.json()["can_decide"] is True and len(r.json()["participants"]) == 4
    r = api_for(doctor).post(url, {"user_id": str(p0.id), "status": "denied", "note": ""}, format="json")
    assert r.status_code == 400  # без причины
    r = api_for(doctor).post(url, {"user_id": str(p0.id), "status": "denied", "note": "Нет справки"}, format="json")
    assert r.status_code == 200
    row = next(x for x in r.json()["participants"] if x["user_id"] == str(p0.id))
    assert row["status"] == "denied" and row["note"] == "Нет справки" and row["by"] == "Врач соревнований"
    # председатель видит, но не решает; посторонний не видит
    assert api_for(world["chair"]).get(url).json()["can_decide"] is False
    assert api_for(world["chair"]).post(url, {"user_id": str(p0.id), "status": "admitted"}, format="json").status_code == 403
    assert api_for(person(4, "Посторонний")).get(url).status_code == 403


def test_with_doctor_only_admitted_play_without_doctor_everyone(world):
    t, doctor, players = world["t"], world["doctor"], world["players"]
    assert medical.playing(t).count() == 4  # врача нет — все
    roster.add_referee(t, doctor, Role.KIND_COMPETITION_DOCTOR)
    assert medical.playing(t).count() == 0  # врач есть, никто не допущен
    for p in players[:3]:
        medical.decide(t, p.id, TournamentParticipant.MEDICAL_ADMITTED, "", doctor)
    medical.decide(t, players[3].id, TournamentParticipant.MEDICAL_DENIED, "Травма", doctor)
    assert set(medical.playing(t).values_list("user_id", flat=True)) == {p.id for p in players[:3]}
    # расписание строится из допущенных
    t.format = Tournament.FORMAT_GROUP
    t.group_size = 4
    t.save()
    roster.add_referee(t, person(5, "Судья стола"), Role.KIND_REFEREE)
    schedule.build(t, tables=2, match_minutes=30)
    from tournaments.models import GroupParticipant
    in_groups = set(GroupParticipant.objects.filter(group__tournament=t).values_list("user_id", flat=True))
    assert in_groups == {p.id for p in players[:3]}  # недопущенного в группах нет
