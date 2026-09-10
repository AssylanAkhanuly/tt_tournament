"""Апелляции (п. 21.1–21.4).

Апелляция подаётся в письменной форме в адрес Федерации (п. 21.2), поэтому в
системе её регистрирует председатель ГСК — с тем, что требует п. 21.2: кто
подал, что обжалуется, обстоятельства, требование, документы. Срок подачи —
5 рабочих дней с опубликования выпуска, рассмотрения — 10 рабочих дней с
получения (п. 21.3). Подача не приостанавливает опубликованный рейтинг: выпуск
не меняется, удовлетворённая апелляция исправляет значение строкой журнала и
уходит в следующий выпуск (п. 21.4).
"""
from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from rating import engine, services
from rating.models import RatingAppeal, RatingEntry, RatingParams, RatingProfile
from users.models import Role, User

pytestmark = pytest.mark.django_db


@pytest.fixture
def params():
    return RatingParams.objects.create(d=15, k_standard=Decimal("0.6"), is_active=True)


def игрок(phone, name, legacy):
    u = User.objects.create_user(phone=phone, name=name)
    services.get_or_create_profile(u, origin=engine.ORIGIN_LEGACY, legacy=legacy)
    return u


def председатель(phone="+7700999"):
    u = User.objects.create_user(phone=phone, name="Председатель")
    Role.objects.create(user=u, kind=Role.KIND_GSK_CHAIRMAN)
    return u


def подать(edition, user, actor=None, **over):
    data = dict(
        received_at=timezone.localdate(),
        applicant="Спортсмен",
        subject="Начисление за матч с соперником",
        circumstances="Счёт в протоколе перепутан",
        demand="Пересчитать начисление",
        documents="Копия протокола",
    )
    data.update(over)
    return services.register_appeal(edition, user, actor=actor, **data)


def карточка(u):
    return RatingProfile.objects.get(user=u)


# ── Подача ──────────────────────────────────────────────────────────


def test_апелляция_в_срок_получает_срок_рассмотрения(params):
    u = игрок("+7702000001", "Спортсмен", 40)
    ed = services.publish_edition(actor=None)
    сегодня = timezone.localdate()

    ap = подать(ed, u, actor=председатель())
    assert ap.status == RatingAppeal.STATUS_PENDING
    assert ap.edition == ed
    assert ap.review_until == engine.add_working_days(сегодня, 10)


def test_после_срока_подачи_не_принимается(params):
    u = игрок("+7702000002", "Спортсмен", 40)
    ed = services.publish_edition(actor=None)

    with pytest.raises(services.AppealError, match="Срок подачи"):
        подать(ed, u, received_at=ed.appeal_until + timedelta(days=1))


def test_до_публикации_выпуска_не_принимается(params):
    u = игрок("+7702000003", "Спортсмен", 40)
    ed = services.publish_edition(actor=None)

    with pytest.raises(services.AppealError, match="раньше публикации"):
        подать(ed, u, received_at=timezone.localdate() - timedelta(days=1))


def test_без_предмета_и_требования_не_принимается(params):
    u = игрок("+7702000004", "Спортсмен", 40)
    ed = services.publish_edition(actor=None)

    with pytest.raises(services.AppealError):
        подать(ed, u, subject="")
    with pytest.raises(services.AppealError):
        подать(ed, u, demand="  ")


# ── Решение ─────────────────────────────────────────────────────────


def test_удовлетворённая_исправляет_значение_через_журнал(params):
    u = игрок("+7702000005", "Спортсмен", 40)
    ed = services.publish_edition(actor=None)
    chair = председатель()
    ap = подать(ed, u, actor=chair)

    services.decide_appeal(ap, upheld=True, decision="Ошибка в протоколе подтверждена", value=41.5, actor=chair)

    ap.refresh_from_db()
    assert ap.status == RatingAppeal.STATUS_UPHELD
    assert ap.decided_by == chair
    assert карточка(u).value == Decimal("41.50")
    # Исправление — отдельной строкой журнала со ссылкой на апелляцию (п. 21.6).
    assert ap.correction.kind == RatingEntry.KIND_CORRECTION
    assert "Апелляция №%s" % ap.pk in ap.correction.reason
    # Опубликованный выпуск не меняется: изменение уйдёт в следующий (п. 21.4).
    assert ed.rows.get(user=u).value == Decimal("40.00")


def test_отклонённая_ничего_не_меняет(params):
    u = игрок("+7702000006", "Спортсмен", 40)
    ed = services.publish_edition(actor=None)
    ap = подать(ed, u)

    services.decide_appeal(ap, upheld=False, decision="Протокол подписан без замечаний", actor=None)

    ap.refresh_from_db()
    assert ap.status == RatingAppeal.STATUS_REJECTED
    assert ap.correction is None
    assert карточка(u).value == Decimal("40.00")


def test_решение_без_обоснования_не_принимается(params):
    u = игрок("+7702000007", "Спортсмен", 40)
    ap = подать(services.publish_edition(actor=None), u)

    with pytest.raises(services.AppealError, match="Обоснование"):
        services.decide_appeal(ap, upheld=False, decision=" ", actor=None)


def test_удовлетворить_без_значения_нельзя(params):
    u = игрок("+7702000008", "Спортсмен", 40)
    ap = подать(services.publish_edition(actor=None), u)

    with pytest.raises(services.AppealError, match="значение"):
        services.decide_appeal(ap, upheld=True, decision="Верно", value=None, actor=None)


def test_решение_окончательное(params):
    u = игрок("+7702000009", "Спортсмен", 40)
    ap = подать(services.publish_edition(actor=None), u)
    services.decide_appeal(ap, upheld=False, decision="Нет оснований", actor=None)

    with pytest.raises(services.AppealError, match="уже"):
        services.decide_appeal(ap, upheld=True, decision="Передумали", value=45, actor=None)


# ── API ─────────────────────────────────────────────────────────────


def test_апелляции_только_председателю(params):
    api = APIClient()
    assert api.get("/api/rating/appeals/").status_code in (401, 403)

    staff = User.objects.create_user(phone="+7700888", name="Админ")
    staff.is_staff = True
    staff.save()
    api.force_authenticate(staff)
    assert api.get("/api/rating/appeals/").status_code == 403

    api.force_authenticate(председатель())
    assert api.get("/api/rating/appeals/").status_code == 200


def test_регистрация_и_решение_через_api(params):
    u = игрок("+7702000010", "Спортсмен", 40)
    ed = services.publish_edition(actor=None)
    api = APIClient()
    api.force_authenticate(председатель())

    r = api.post(
        "/api/rating/appeals/",
        {
            "user_id": str(u.pk),
            "edition_id": ed.pk,
            "applicant": "Тренер",
            "subject": "Неявка на кубок",
            "circumstances": "Уведомление о снятии направлено вовремя",
            "demand": "Снять неявку",
            "documents": "Письмо организатору",
        },
        format="json",
    )
    assert r.status_code == 201, r.data
    assert r.data["status"] == "pending"
    assert r.data["name"] == "Спортсмен"
    assert r.data["edition_number"] == ed.number

    d = api.post(
        "/api/rating/appeals/%s/decision/" % r.data["id"],
        {"upheld": True, "value": "40.20", "decision": "Уведомление подтверждено"},
        format="json",
    )
    assert d.status_code == 200, d.data
    assert d.data["status"] == "upheld"
    assert карточка(u).value == Decimal("40.20")


def test_просроченная_через_api_отвечает_400_с_причиной(params):
    u = игрок("+7702000011", "Спортсмен", 40)
    ed = services.publish_edition(actor=None)
    api = APIClient()
    api.force_authenticate(председатель())

    r = api.post(
        "/api/rating/appeals/",
        {
            "user_id": str(u.pk),
            "edition_id": ed.pk,
            "received_at": str(ed.appeal_until + timedelta(days=3)),
            "subject": "Что-то",
            "demand": "Что-то",
        },
        format="json",
    )
    assert r.status_code == 400
    assert "Срок подачи" in r.data["detail"]


def test_фильтр_ждут_решения(params):
    a = игрок("+7702000012", "Первый", 40)
    b = игрок("+7702000013", "Второй", 30)
    ed = services.publish_edition(actor=None)
    подать(ed, a)
    решённая = подать(ed, b)
    services.decide_appeal(решённая, upheld=False, decision="Нет оснований", actor=None)

    api = APIClient()
    api.force_authenticate(председатель())
    r = api.get("/api/rating/appeals/", {"status": "pending"})
    assert [x["name"] for x in r.data] == ["Первый"]
