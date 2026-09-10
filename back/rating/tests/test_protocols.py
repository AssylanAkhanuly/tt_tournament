"""Утверждение протокола для рейтинга: уровень соревнования и итоговые места.

Без них коэффициенты C (п. 13) и P (п. 10) в настоящих турнирах всегда были
бы 1,00. Председатель ГСК задаёт уровень и призовую тройку и пересчитывает:
прежние строки турнира отменяются (история сохраняется, п. 20), расчёт идёт
заново с новыми C и P.

Пересчёт честен только для последнего турнира участников: расчёт берёт их
текущие значения. Если после этого турнира у кого-то были другие, сервер
отказывает — иначе поздние начисления остались бы посчитанными от старых
чисел (каскадного исправления п. 21.6 нет).
"""
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from rating import engine, services
from rating.models import RatingEntry, RatingParams, RatingProfile
from tournaments.models import Match, Tournament, TournamentParticipant
from users.models import Role, User

pytestmark = pytest.mark.django_db


@pytest.fixture
def params():
    return RatingParams.objects.create(
        d=15, k_standard=Decimal("0.6"), k_transition=3, max_delta=1, is_active=True,
    )


def игрок(phone, name, legacy=20):
    u = User.objects.create_user(phone=phone, name=name)
    services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=legacy)
    return u


def председатель(phone="+7700999"):
    u = User.objects.create_user(phone=phone, name="Председатель")
    Role.objects.create(user=u, kind=Role.KIND_GSK_CHAIRMAN)
    return u


def турнир_с_матчем(a, b, level="republic", name="Кубок"):
    """Завершённый рейтинговый турнир: один матч, a обыграл b 3:1."""
    t = Tournament.objects.create(
        name=name, created_by=a, status=Tournament.STATUS_FINISHED,
        level=level, starts_at=timezone.now(),
    )
    for u in (a, b):
        TournamentParticipant.objects.create(tournament=t, user=u)
    Match.objects.create(
        tournament=t, round_number=1, match_number=1, player1=a, player2=b,
        score1=3, score2=1, winner=a, status=Match.FINISHED,
    )
    services.apply_tournament(t)
    return t


def значение(u):
    return RatingProfile.objects.get(user=u).value


# ── Пересчёт с новым уровнем и местами ──────────────────────────────


def test_уровень_меняет_c_и_пересчитывает(params):
    a = игрок("+7705000001", "Победитель")
    b = игрок("+7705000002", "Соперник")
    t = турнир_с_матчем(a, b, level="republic")
    # Равные 20 и 20: 0,60 × 1,00 × 0,50 = +0,30.
    assert значение(a) == Decimal("20.30")

    services.set_protocol(t, level="top", places={}, no_third_place_match=False, actor=председатель())

    # C = 1,20: 0,60 × 1,20 × 0,50 = +0,36 — от значения до турнира, не от 20,30.
    assert значение(a) == Decimal("20.36")
    assert значение(b) == Decimal("19.64")
    t.refresh_from_db()
    assert t.level == "top"


def test_место_даёт_p(params):
    a = игрок("+7705000003", "Победитель")
    b = игрок("+7705000004", "Соперник")
    t = турнир_с_матчем(a, b, level="republic")

    services.set_protocol(t, level="republic", places={str(a.pk): 1}, no_third_place_match=False, actor=None)

    # P = 1,20 у первого места: 0,60 × 1,00 × 1,20 × 0,50 = +0,36.
    assert значение(a) == Decimal("20.36")
    assert TournamentParticipant.objects.get(tournament=t, user=a).place == 1


def test_прежние_строки_остаются_отменёнными(params):
    a = игрок("+7705000005", "Победитель")
    b = игрок("+7705000006", "Соперник")
    t = турнир_с_матчем(a, b)

    services.set_protocol(t, level="top", places={}, no_third_place_match=False, actor=None)

    строки = RatingEntry.objects.filter(tournament=t)
    assert строки.filter(is_reverted=True).count() == 2  # старый расчёт — в истории
    assert строки.filter(is_reverted=False).count() == 2  # новый расчёт


def test_после_турнира_были_другие_пересчёт_запрещён(params):
    a = игрок("+7705000007", "Победитель")
    b = игрок("+7705000008", "Соперник")
    c = игрок("+7705000009", "Третий")
    первый = турнир_с_матчем(a, b, name="Первый")
    турнир_с_матчем(a, c, name="Второй")

    with pytest.raises(services.ProtocolError, match="другие"):
        services.set_protocol(первый, level="top", places={}, no_third_place_match=False, actor=None)
    # Ничего не изменилось.
    assert Tournament.objects.get(pk=первый.pk).level == "republic"


def test_неизвестный_уровень_и_чужой_участник_отклоняются(params):
    a = игрок("+7705000010", "Победитель")
    b = игрок("+7705000011", "Соперник")
    чужой = игрок("+7705000012", "Чужой")
    t = турнир_с_матчем(a, b)

    with pytest.raises(services.ProtocolError, match="Уровень"):
        services.set_protocol(t, level="galaxy", places={}, no_third_place_match=False, actor=None)
    with pytest.raises(services.ProtocolError, match="участник"):
        services.set_protocol(t, level="top", places={str(чужой.pk): 1}, no_third_place_match=False, actor=None)


# ── API ─────────────────────────────────────────────────────────────


def test_протоколы_только_председателю(params):
    assert APIClient().get("/api/rating/protocols/").status_code in (401, 403)

    staff = User.objects.create_user(phone="+7700888", name="Админ")
    staff.is_staff = True
    staff.save()
    api = APIClient()
    api.force_authenticate(staff)
    assert api.get("/api/rating/protocols/").status_code == 403


def test_список_и_утверждение_через_api(params):
    a = игрок("+7705000013", "Победитель")
    b = игрок("+7705000014", "Соперник")
    t = турнир_с_матчем(a, b, name="Кубок области")
    api = APIClient()
    api.force_authenticate(председатель())

    r = api.get("/api/rating/protocols/")
    assert r.status_code == 200
    row = next(x for x in r.data if x["id"] == t.pk)
    assert (row["name"], row["level"], row["applied"]) == ("Кубок области", "republic", True)
    assert {p["name"] for p in row["participants"]} == {"Победитель", "Соперник"}

    d = api.post(
        "/api/rating/protocols/%s/" % t.pk,
        {"level": "top", "places": {str(a.pk): 1}, "no_third_place_match": False},
        format="json",
    )
    assert d.status_code == 200, d.data
    assert d.data["level"] == "top"
    # C = 1,20 и P = 1,20: 0,60 × 1,20 × 1,20 × 0,50 = 0,432 → +0,43.
    assert значение(a) == Decimal("20.43")
