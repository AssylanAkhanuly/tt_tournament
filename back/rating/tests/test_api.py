"""API рейтинга: список, карточка, коэффициенты, предпросчёт, неявка.

Утверждения конкретные: не «ответ 200», а порядок строк, значение поля и то,
что чужой не может править коэффициенты. Проверка, которая не краснеет от
поломки, бесполезна.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from rating import engine, services
from rating.models import RatingEntry, RatingParams, RatingProfile
from users.models import User

pytestmark = pytest.mark.django_db


@pytest.fixture
def api():
    return APIClient()


@pytest.fixture
def params():
    return RatingParams.objects.create(d=15, k_standard=Decimal("0.6"), is_active=True)


def игрок(phone, name, legacy, **over):
    u = User.objects.create_user(phone=phone, name=name)
    profile = services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=legacy)
    for k, v in over.items():
        setattr(profile, k, v)
    if over:
        profile.save()
    return u


# ── Рейтинг-лист (Э0.4) ─────────────────────────────────────────────


def test_лист_отсортирован_по_убыванию_рейтинга(api, params):
    игрок("+7710000001", "Слабый", 12)
    игрок("+7710000002", "Сильный", 55)
    игрок("+7710000003", "Средний", 33)

    r = api.get("/api/rating/")
    assert r.status_code == 200
    assert [x["name"] for x in r.data["results"]] == ["Сильный", "Средний", "Слабый"]
    assert r.data["results"][0]["value"] == "55.00"
    assert r.data["count"] == 3


def test_лист_открыт_без_входа(api, params):
    игрок("+7710000010", "Кто угодно", 20)
    assert api.get("/api/rating/").status_code == 200


def test_фильтр_по_полу(api, params):
    игрок("+7710000020", "Он", 20, sex="m")
    игрок("+7710000021", "Она", 30, sex="f")

    r = api.get("/api/rating/", {"sex": "f"})
    assert [x["name"] for x in r.data["results"]] == ["Она"]


def test_фильтр_по_возрастной_ступени_это_выборка_из_общего(api, params):
    from datetime import date

    год = date.today().year
    игрок("+7710000030", "Юниор", 25, birth_year=год - 14)   # U15
    игрок("+7710000031", "Взрослый", 40, birth_year=год - 30)

    r = api.get("/api/rating/", {"age": "U15"})
    assert [x["name"] for x in r.data["results"]] == ["Юниор"]
    # Значение то же самое — возрастной рейтинг не отдельный (п. 7.2–7.3).
    assert r.data["results"][0]["value"] == "25.00"


def test_неактивные_в_текущий_лист_не_попадают(api, params):
    игрок("+7710000040", "Активный", 20, status=engine.STATUS_ACTIVE)
    игрок("+7710000041", "Пауза", 44, status=engine.STATUS_INACTIVE)

    r = api.get("/api/rating/")
    assert [x["name"] for x in r.data["results"]] == ["Активный"]
    # Но их можно посмотреть отдельно — рейтинг сохраняется (п. 18.2).
    r2 = api.get("/api/rating/", {"status": engine.STATUS_INACTIVE})
    assert [x["name"] for x in r2.data["results"]] == ["Пауза"]
    assert r2.data["results"][0]["value"] == "44.00"


def test_постраничная_выдача(api, params):
    for i in range(5):
        игрок("+771000005%d" % i, "И%d" % i, 10 + i)

    r = api.get("/api/rating/", {"page_size": 2, "page": 2})
    assert r.data["count"] == 5
    assert len(r.data["results"]) == 2
    assert [x["name"] for x in r.data["results"]] == ["И2", "И1"]


def test_размер_страницы_ограничен_пятьюстами(api, params):
    игрок("+7710000060", "Один", 20)
    r = api.get("/api/rating/", {"page_size": 100000})
    assert r.data["page_size"] == 500


# ── Карточка спортсмена (п. 19–20) ──────────────────────────────────


def test_карточка_отдаёт_историю_со_слагаемыми(api, params):
    u = игрок("+7710000070", "Игрок", 20)
    соперник = игрок("+7710000071", "Соперник", 20)
    services.register_no_show(u, reason="не явился")

    r = api.get("/api/rating/%s/" % u.id)
    assert r.status_code == 200
    assert r.data["profile"]["name"] == "Игрок"
    виды = {row["kind"] for row in r.data["history"]}
    assert RatingEntry.KIND_START in виды
    assert RatingEntry.KIND_NO_SHOW in виды
    неявка = next(x for x in r.data["history"] if x["kind"] == RatingEntry.KIND_NO_SHOW)
    assert неявка["delta"] == "-0.20"
    assert неявка["reason"] == "не явился"


def test_карточка_показывает_место_в_листе(api, params):
    игрок("+7710000080", "Первый", 60)
    второй = игрок("+7710000081", "Второй", 30)

    r = api.get("/api/rating/%s/" % второй.id)
    assert r.data["place"] == 2
    assert r.data["of"] == 2


def test_карточки_нет_у_того_у_кого_нет_рейтинга(api, params):
    u = User.objects.create_user(phone="+7710000090", name="Без карточки")
    assert api.get("/api/rating/%s/" % u.id).status_code == 404


# ── Коэффициенты ────────────────────────────────────────────────────


def test_коэффициенты_читаются_всеми_и_несут_происхождение(api, params):
    r = api.get("/api/rating/params/")
    assert r.status_code == 200
    assert r.data["d"] == "15.00"
    # Шесть значений Положением не заданы — и это видно из ответа.
    assert r.data["sources"]["d"] == {"fixed": False, "clause": "п. 9.4"}
    assert r.data["sources"]["transition_matches"]["fixed"] is True
    assert r.data["sources"]["c_top"] == {"fixed": True, "clause": "п. 13"}


def test_коэффициенты_правит_только_федерация(api, params):
    обычный = User.objects.create_user(phone="+7710000100", name="Обычный")
    api.force_authenticate(user=обычный)
    assert api.patch("/api/rating/params/", {"d": 20}, format="json").status_code == 403

    RatingParams.objects.filter(pk=params.pk).first().refresh_from_db()
    assert RatingParams.active().d == Decimal("15.00")


def test_федерация_меняет_коэффициент_и_он_применяется(api, params):
    админ = User.objects.create_user(phone="+7710000110", name="Федерация")
    админ.is_staff = True
    админ.save()
    api.force_authenticate(user=админ)

    r = api.patch("/api/rating/params/", {"k_standard": "1.200"}, format="json")
    assert r.status_code == 200
    assert RatingParams.active().k_standard == Decimal("1.200")

    # И следующий расчёт идёт уже по новому значению.
    предпросчёт = api.post(
        "/api/rating/preview/",
        {
            "players": [
                {"id": "a", "name": "А", "origin": "legacy", "start": 20},
                {"id": "b", "name": "Б", "origin": "legacy", "start": 20},
            ],
            "tournaments": [{"id": "t", "name": "Т", "level": "republic"}],
            "matches": [{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
        },
        format="json",
    )
    а = next(x for x in предпросчёт.data["table"] if x["id"] == "a")
    assert а["rating"] == 20.6  # 1,20 × 1,00 × 0,50


# ── Предпросчёт ─────────────────────────────────────────────────────


def test_предпросчёт_считает_и_ничего_не_сохраняет(api, params):
    r = api.post(
        "/api/rating/preview/",
        {
            "players": [
                {"id": "a", "name": "А", "origin": "legacy", "start": 20},
                {"id": "b", "name": "Б", "origin": "legacy", "start": 20},
            ],
            "tournaments": [{"id": "t", "name": "Чемпионат", "level": "top"}],
            "matches": [{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
        },
        format="json",
    )
    assert r.status_code == 200
    а = next(x for x in r.data["table"] if x["id"] == "a")
    assert а["rating"] == 20.36
    # История приходит со слагаемыми — иначе число нечем объяснить.
    строка = r.data["history"][0]
    assert строка["c"] == 1.2
    assert строка["score"] == "3:1"
    assert RatingProfile.objects.count() == 0


def test_предпросчёт_принимает_свои_коэффициенты(api, params):
    r = api.post(
        "/api/rating/preview/",
        {
            "players": [
                {"id": "a", "name": "А", "origin": "legacy", "start": 20},
                {"id": "b", "name": "Б", "origin": "legacy", "start": 35},
            ],
            "tournaments": [{"id": "t", "name": "Т", "level": "republic"}],
            "matches": [{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
            "params": {"d": 40},
        },
        format="json",
    )
    узкая = api.post(
        "/api/rating/preview/",
        {
            "players": [
                {"id": "a", "name": "А", "origin": "legacy", "start": 20},
                {"id": "b", "name": "Б", "origin": "legacy", "start": 35},
            ],
            "tournaments": [{"id": "t", "name": "Т", "level": "republic"}],
            "matches": [{"id": "m", "tournament": "t", "a": "a", "b": "b", "games": [3, 1]}],
            "params": {"d": 10},
        },
        format="json",
    )
    широкий = next(x for x in r.data["table"] if x["id"] == "a")["rating"]
    узкий = next(x for x in узкая.data["table"] if x["id"] == "a")["rating"]
    # Чем шире шкала, тем дешевле победа над более сильным.
    assert узкий > широкий


def test_предпросчёт_отвергает_кривой_вход(api, params):
    r = api.post("/api/rating/preview/", {"players": [], "tournaments": []}, format="json")
    assert r.status_code == 400


# ── Неявка ──────────────────────────────────────────────────────────


def test_неявку_фиксирует_только_федерация(api, params):
    u = игрок("+7710000120", "Игрок", 20)
    api.force_authenticate(user=u)
    r = api.post("/api/rating/no-show/", {"user_id": str(u.id), "reason": "х"}, format="json")
    assert r.status_code == 403


def test_неявка_без_основания_не_проходит(api, params):
    u = игрок("+7710000130", "Игрок", 20)
    админ = User.objects.create_user(phone="+7710000131", name="Ф")
    админ.is_staff = True
    админ.save()
    api.force_authenticate(user=админ)

    r = api.post("/api/rating/no-show/", {"user_id": str(u.id)}, format="json")
    assert r.status_code == 400
    assert RatingProfile.objects.get(user=u).value == Decimal("20.00")


def test_неявка_снимает_баллы_и_пишется_в_историю(api, params):
    u = игрок("+7710000140", "Игрок", 20)
    админ = User.objects.create_user(phone="+7710000141", name="Ф")
    админ.is_staff = True
    админ.save()
    api.force_authenticate(user=админ)

    r = api.post(
        "/api/rating/no-show/",
        {"user_id": str(u.id), "reason": "снялся после закрытия приёма"},
        format="json",
    )
    assert r.status_code == 201
    assert r.data["delta"] == "-0.20"
    assert RatingProfile.objects.get(user=u).value == Decimal("19.80")
