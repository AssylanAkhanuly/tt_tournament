"""Полномочия главного судьи и работа секретаря ✳ (24.11.2026, flows/07, flows/08;
решения совещания 04.11.2026 `[1:31:43–1:34:21]`, `[1:58:22]`).

Проверяется то, что сломается при поломке:
- передаёт полномочия только главный судья и только секретарю или заместителю
  своего турнира; вернуть может держатель или главный судья; всё — в журнал;
- править счёт может один: пока полномочия переданы, главный судья не правит,
  держатель правит; без передачи заместитель и секретарь не правят;
- держатель, снятый с должности, полномочий не держит;
- секретарь собирает и правит черновик расписания и передаёт его судье, но не
  отправляет; любая правка отзывает переданное; заместитель расписание не правит.
"""
import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from tournaments import authority, roster, schedule
from tournaments.models import AuthorityLog, GroupMatch, Tournament, TournamentParticipant
from users.models import Role, User

pytestmark = pytest.mark.django_db

DAY = [{"date": "2026-11-14", "start": "10:00", "end": "18:00"}]


def person(n, name, *kinds):
    u = User.objects.create_user(phone="+7700888" + str(n).zfill(4), name=name, password="x")
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
    secretary = person(3, "Секретарь", Role.KIND_REFEREE)
    deputy = person(4, "Заместитель", Role.KIND_REFEREE)
    stranger = person(5, "Чужой", Role.KIND_REFEREE)
    roster.add_referee(t, chief, Role.KIND_CHIEF_REFEREE)
    roster.add_referee(t, secretary, Role.KIND_CHIEF_SECRETARY)
    roster.add_referee(t, deputy, Role.KIND_DEPUTY_CHIEF_REFEREE)
    for i in range(2):
        roster.add_referee(t, person(10 + i, "Судья %d" % i, Role.KIND_REFEREE), Role.KIND_REFEREE)
    for i in range(4):
        TournamentParticipant.objects.create(tournament=t, user=person(20 + i, "Игрок %d" % i))
    return {"t": t, "admin": admin, "chief": chief, "secretary": secretary, "deputy": deputy, "stranger": stranger}


def finished_match(w):
    """Отправленное расписание и один подтверждённый матч."""
    t = w["t"]
    schedule.build(t, tables=2, match_minutes=30, days=DAY)
    schedule.finalize(t)
    m = GroupMatch.objects.filter(group__tournament=t).order_by("scheduled_at", "id").first()
    ref = api_for(m.referee)
    url = f"/api/tournaments/{t.id}/group-matches/{m.id}/scoring/"
    assert ref.post(url, {"action": "submit", "score1": 3, "score2": 1}, format="json").status_code == 200
    return m, url


def auth_url(t):
    return f"/api/tournaments/{t.id}/authority/"


# ── передача и возврат ───────────────────────────────────────────────────────

def test_by_default_powers_are_with_the_chief(world):
    t = world["t"]
    r = api_for(world["chief"]).get(auth_url(t))
    assert r.status_code == 200
    body = r.json()
    assert body["holder"]["name"] == "Главный" and body["transferred"] is False
    assert body["can_transfer"] is True
    assert {c["name"] for c in body["candidates"]} == {"Секретарь", "Заместитель"}
    assert authority.can_run(t, world["chief"]) and not authority.can_run(t, world["deputy"])


def test_only_the_chief_transfers_and_only_to_secretary_or_deputy(world):
    t, api = world["t"], api_for(world["chief"])
    # Заместитель сам себе полномочия не берёт.
    r = api_for(world["deputy"]).post(auth_url(t), {"action": "transfer", "user_id": str(world["deputy"].id)}, format="json")
    assert r.status_code == 403
    # Чужому судье (не в бригаде турнира) — нельзя.
    r = api.post(auth_url(t), {"action": "transfer", "user_id": str(world["stranger"].id)}, format="json")
    assert r.status_code == 400
    r = api.post(auth_url(t), {"action": "transfer", "user_id": str(world["deputy"].id)}, format="json")
    assert r.status_code == 200
    body = r.json()
    assert body["transferred"] is True and body["holder"]["name"] == "Заместитель"
    assert body["holder"]["position"] == Role.KIND_DEPUTY_CHIEF_REFEREE and body["since"]
    t.refresh_from_db()
    assert t.authority_holder_id == world["deputy"].id
    # Пока переданы — второй раз не передать (сначала вернуть).
    r = api.post(auth_url(t), {"action": "transfer", "user_id": str(world["secretary"].id)}, format="json")
    assert r.status_code == 400


def test_holder_or_chief_takes_back_and_everything_is_logged(world):
    t = world["t"]
    authority.transfer(t, world["chief"], world["secretary"].id)
    # Посторонний вернуть не может.
    r = api_for(world["deputy"]).post(auth_url(t), {"action": "return"}, format="json")
    assert r.status_code == 403
    r = api_for(world["secretary"]).post(auth_url(t), {"action": "return"}, format="json")
    assert r.status_code == 200 and r.json()["transferred"] is False
    t.refresh_from_db()
    authority.transfer(t, world["chief"], world["deputy"].id)
    authority.take_back(t, world["chief"])
    log = list(AuthorityLog.objects.filter(tournament=t).order_by("at", "id").values_list("action", "holder__name", "by__name"))
    assert log == [
        ("transfer", "Секретарь", "Главный"),
        ("return", "Секретарь", "Секретарь"),
        ("transfer", "Заместитель", "Главный"),
        ("return", "Заместитель", "Главный"),
    ]
    assert [e["action"] for e in api_for(world["chief"]).get(auth_url(t)).json()["log"]][:1] == ["return"]


def test_holder_removed_from_the_brigade_loses_powers(world):
    t = world["t"]
    authority.transfer(t, world["chief"], world["deputy"].id)
    # Сняли с должности в коллегии турнира.
    Role.objects.filter(user=world["deputy"], scope="tournament", scope_id=t.id).delete()
    t.refresh_from_db()
    assert not authority.can_run(t, world["deputy"])
    assert authority.can_run(t, world["chief"])


def test_outsiders_do_not_see_the_powers(world):
    r = api_for(world["stranger"]).get(auth_url(world["t"]))
    assert r.status_code == 403
    # Бригада и председатель ГСК / администратор — видят.
    for who in ("secretary", "deputy", "admin"):
        assert api_for(world[who]).get(auth_url(world["t"])).status_code == 200


# ── счёт правит один ─────────────────────────────────────────────────────────

def test_score_correction_follows_the_powers(world):
    m, url = finished_match(world)
    t = world["t"]
    fix = {"action": "correct", "score1": 3, "score2": 2}
    # Без передачи — только главный судья.
    assert api_for(world["deputy"]).post(url, fix, format="json").status_code == 403
    assert api_for(world["secretary"]).post(url, fix, format="json").status_code == 403
    assert api_for(world["chief"]).get(url).json()["can_correct"] is True
    authority.transfer(t, world["chief"], world["deputy"].id)
    # Переданы заместителю — главный судья только смотрит, заместитель правит.
    assert api_for(world["chief"]).get(url).json()["can_correct"] is False
    assert api_for(world["chief"]).post(url, fix, format="json").status_code == 403
    r = api_for(world["deputy"]).post(url, fix, format="json")
    assert r.status_code == 200 and (r.json()["score1"], r.json()["score2"]) == (3, 2)
    m.refresh_from_db()
    assert m.result_by_id == world["deputy"].id
    # Вернули — снова только главный.
    authority.take_back(t, world["deputy"])
    assert api_for(world["deputy"]).post(url, fix, format="json").status_code == 403
    assert api_for(world["chief"]).post(url, {"action": "correct", "score1": 3, "score2": 0}, format="json").status_code == 200


def test_schedule_snapshot_says_who_runs_the_tournament(world):
    finished_match(world)
    t = world["t"]
    authority.transfer(t, world["chief"], world["secretary"].id)
    snap = api_for(world["secretary"]).get(f"/api/tournaments/{t.id}/schedule/").json()
    assert snap["can_run"] is True
    assert api_for(world["chief"]).get(f"/api/tournaments/{t.id}/schedule/").json()["can_run"] is False


# ── расписание: секретарь собирает, судья отправляет ─────────────────────────

def test_secretary_builds_and_hands_over_but_does_not_send(world):
    t, sec = world["t"], api_for(world["secretary"])
    base = f"/api/tournaments/{t.id}/schedule/"
    snap = sec.get(base).json()
    assert snap["can_build"] is True and snap["can_finalize"] is False
    r = sec.post(base + "build/", {"tables": 2, "match_minutes": 30, "days": DAY}, format="json")
    assert r.status_code == 200 and r.json()["status"] == "draft"
    assert r.json()["can_submit"] is True and r.json()["submitted_at"] is None
    # Отправить (запереть и начать турнир) секретарь не может.
    assert sec.post(base + "finalize/").status_code == 403
    r = sec.post(base + "submit/")
    assert r.status_code == 200 and r.json()["submitted_at"] and r.json()["can_submit"] is False
    # Главный судья видит переданное и отправляет.
    chief_snap = api_for(world["chief"]).get(base).json()
    assert chief_snap["submitted_at"] and chief_snap["can_finalize"] is True


def test_any_edit_recalls_the_handed_over_schedule(world):
    t, sec = world["t"], api_for(world["secretary"])
    base = f"/api/tournaments/{t.id}/schedule/"
    sec.post(base + "build/", {"tables": 2, "match_minutes": 30, "days": DAY}, format="json")
    sec.post(base + "submit/")
    m = GroupMatch.objects.filter(group__tournament=t).order_by("id").first()
    r = sec.patch(base + f"matches/{m.id}/", {"table": 2 if m.table_number == 1 else 1}, format="json")
    # Конфликт допустим — важно, что правка (удачная или нет) прошла через правило.
    if r.status_code == 200:
        assert r.json()["submitted_at"] is None
    sec.post(base + "submit/")
    r = sec.post(base + "build/", {"tables": 2, "match_minutes": 30, "days": DAY}, format="json")
    assert r.status_code == 200 and r.json()["submitted_at"] is None


def test_deputy_does_not_edit_the_schedule(world):
    t, dep = world["t"], api_for(world["deputy"])
    base = f"/api/tournaments/{t.id}/schedule/"
    assert dep.get(base).status_code == 200
    assert dep.post(base + "build/", {"tables": 2, "match_minutes": 30, "days": DAY}, format="json").status_code == 403
    assert dep.post(base + "submit/").status_code == 403


def test_brigade_reads_but_does_not_edit_the_roster(world):
    t = world["t"]
    for who in ("secretary", "deputy"):
        api = api_for(world[who])
        players = api.get(f"/api/tournaments/{t.id}/participants/")
        assert players.status_code == 200 and len(players.json()) == 4
        refs = api.get(f"/api/tournaments/{t.id}/referees/")
        assert refs.status_code == 200 and {"Секретарь", "Заместитель"} <= {r["name"] for r in refs.json()}
        assert api.post(f"/api/tournaments/{t.id}/participants/", {"user_id": str(world["stranger"].id)}, format="json").status_code == 403
        assert api.post(f"/api/tournaments/{t.id}/referees/", {"user_id": str(world["stranger"].id), "position": "referee"}, format="json").status_code == 403
    # Посторонний судья состава не видит.
    assert api_for(world["stranger"]).get(f"/api/tournaments/{t.id}/participants/").status_code == 403


def test_referee_profile_lists_positions_and_refereed_matches(world):
    m, _url = finished_match(world)
    ref = m.referee
    r = api_for(world["admin"]).get(f"/api/tournaments/referees/{ref.id}/profile/")
    assert r.status_code == 200
    body = r.json()
    assert body["tournaments"] == 1 and body["matches"] == 1 and body["as_chief"] == 0
    assert body["history"][0]["position"] == "referee" and body["history"][0]["matches"] == 1
    chief = api_for(world["admin"]).get(f"/api/tournaments/referees/{world['chief'].id}/profile/").json()
    assert chief["as_chief"] == 1 and chief["history"][0]["position_label"] == "Главный судья соревнований"
    # Сам судья видит свой профиль, посторонний — нет.
    assert api_for(ref).get(f"/api/tournaments/referees/{ref.id}/profile/").status_code == 200
    assert api_for(world["stranger"]).get(f"/api/tournaments/referees/{ref.id}/profile/").status_code == 403
