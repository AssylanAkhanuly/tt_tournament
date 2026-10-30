"""Сведения о турнире ✳ (29.10.2026, решение владельца продукта): раздел
«Сведения» на странице турнира — даты (начало и окончание), где (город и место
проведения), возраст участников (от–до, лет), формат и общие настройки. Правит
председатель ГСК и администратор федерации (и, как раньше, `is_staff` и админ
клуба турнира); `PATCH /api/tournaments/<id>/update/`.

Проверяется то, что сломается при поломке: поля сохраняются и отдаются,
окончание раньше начала и возраст «от» больше «до» отбиваются, матч — от 2 до 5
побед, формат после старта не меняется, судье и игроку править нельзя."""
import datetime

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from tournaments.models import Match, Tournament
from users.models import Role, User

pytestmark = pytest.mark.django_db


def человек(n, name, *kinds):
    u = User.objects.create_user(phone="+7700999" + str(n).zfill(4), name=name, password="x")
    for k in kinds:
        Role.objects.create(user=u, kind=k)
    return u


@pytest.fixture
def мир():
    председатель = человек(1, "Председатель", Role.KIND_GSK_CHAIRMAN)
    start = timezone.make_aware(datetime.datetime(2026, 11, 20, 10, 0))
    t = Tournament.objects.create(name="Кубок", created_by=председатель, starts_at=start)
    api = APIClient()
    api.force_authenticate(председатель)
    return {"t": t, "api": api, "председатель": председатель}


def править(мир, data, who=None):
    api = мир["api"]
    if who is not None:
        api = APIClient()
        api.force_authenticate(who)
    return api.patch(f"/api/tournaments/{мир['t'].id}/update/", data, format="json")


def test_председатель_правит_сведения_и_они_отдаются(мир):
    r = править(мир, {
        "ends_at": "2026-11-23",
        "city": "Астана",
        "venue": "Дворец спорта «Казахстан»",
        "age_min": 12,
        "age_max": 18,
        "format": "group_playoff",
        "group_size": 5,
        "games_to_win": 4,
        "level": "top",
        "is_rating": False,
        "description": "Отбор на чемпионат Азии",
    })
    assert r.status_code == 200, r.data
    d = мир["api"].get(f"/api/tournaments/{мир['t'].id}/").data
    assert (d["ends_at"], d["city"], d["venue"]) == ("2026-11-23", "Астана", "Дворец спорта «Казахстан»")
    assert (d["age_min"], d["age_max"]) == (12, 18)
    assert (d["format"], d["group_size"], d["games_to_win"], d["level"], d["is_rating"]) == (
        "group_playoff", 5, 4, "top", False,
    )
    assert d["description"] == "Отбор на чемпионат Азии"


def test_возраст_без_границ_и_с_одной_границей(мир):
    assert править(мир, {"age_min": None, "age_max": None}).status_code == 200
    assert править(мир, {"age_min": 40, "age_max": None}).status_code == 200  # «40 и старше»
    мир["t"].refresh_from_db()
    assert (мир["t"].age_min, мир["t"].age_max) == (40, None)


def test_окончание_раньше_начала_отбивается(мир):
    r = править(мир, {"ends_at": "2026-11-19"})
    assert r.status_code == 400
    мир["t"].refresh_from_db()
    assert мир["t"].ends_at is None
    # Однодневный турнир — окончание в день начала.
    assert править(мир, {"ends_at": "2026-11-20"}).status_code == 200


def test_окончание_сверяется_с_новым_началом_из_того_же_запроса(мир):
    r = править(мир, {"starts_at": "2026-11-25T10:00:00+05:00", "ends_at": "2026-11-23"})
    assert r.status_code == 400


def test_возраст_от_больше_до_отбивается(мир):
    r = править(мир, {"age_min": 18, "age_max": 12})
    assert r.status_code == 400
    мир["t"].refresh_from_db()
    assert (мир["t"].age_min, мир["t"].age_max) == (None, None)


def test_возраст_вне_разумных_границ_отбивается(мир):
    assert править(мир, {"age_min": 0}).status_code == 400
    assert править(мир, {"age_max": 120}).status_code == 400


def test_матч_до_двух_пяти_побед(мир):
    assert править(мир, {"games_to_win": 1}).status_code == 400
    assert править(мир, {"games_to_win": 6}).status_code == 400
    assert править(мир, {"games_to_win": 5}).status_code == 200


def test_формат_после_старта_не_меняется(мир):
    t = мир["t"]
    t.status = Tournament.STATUS_IN_PROGRESS
    t.save()
    Match.objects.create(tournament=t, round_number=1, match_number=1)
    r = править(мир, {"format": "group_playoff"})
    assert r.status_code == 400
    t.refresh_from_db()
    assert t.format == Tournament.FORMAT_SINGLE
    # Остальное по-прежнему правится.
    assert править(мир, {"city": "Алматы"}).status_code == 200


def test_судье_и_игроку_править_нельзя(мир):
    for kind in (Role.KIND_REFEREE, Role.KIND_PLAYER):
        who = человек(10 + len(kind), "Без прав " + kind, kind)
        assert править(мир, {"city": "Алматы"}, who=who).status_code == 403
    мир["t"].refresh_from_db()
    assert мир["t"].city == ""
