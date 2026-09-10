"""Объединение дублирующих рейтинговых карточек (п. 5.3).

«Один спортсмен не может иметь несколько параллельных национальных рейтинговых
карточек. При выявлении дублирующих карточек они объединяются уполномоченным
лицом Федерации… При объединении сохраняется полная рейтинговая история, а
сведения об объединении отражаются в журнале изменений.»

Проверяется арифметика, которую легко сломать: у каждой карточки своя
стартовая строка, и если просто сложить истории, стартовое значение удвоится.
Поэтому старт дубля остаётся в истории отменённым, а считаются только его
изменения после старта.
"""
from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from rating import engine, services
from rating.models import RatingEntry, RatingParams, RatingProfile
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


def карточка(u):
    return RatingProfile.objects.get(user=u)


def test_история_дубля_переходит_без_удвоения_старта(params):
    основная = игрок("+7704000001", "Ким Виктор", 40)
    дубль = игрок("+7704000002", "Ким Виктор (дубль)", 35)
    services.register_no_show(дубль, reason="Не явился", actor=None)  # 35,00 → 34,80
    chair = председатель()

    services.merge_profiles(основная, дубль, reason="Один человек, два телефона", actor=chair)

    k = карточка(основная)
    # 40 (старт основной) − 0,20 (неявка дубля); старт дубля 35 не считается.
    assert k.value == Decimal("39.80")
    assert k.no_shows == 1
    # Карточка дубля исчезла: параллельных карточек не бывает.
    assert not RatingProfile.objects.filter(user=дубль).exists()

    kinds = list(k.entries.values_list("kind", "is_reverted"))
    assert kinds.count((RatingEntry.KIND_START, False)) == 1  # старт основной
    assert kinds.count((RatingEntry.KIND_START, True)) == 1  # старт дубля — в истории, отменён
    assert (RatingEntry.KIND_NO_SHOW, False) in kinds


def test_объединение_записано_в_журнал(params):
    основная = игрок("+7704000003", "Спортсмен", 40)
    дубль = игрок("+7704000004", "Спортсмен (дубль)", 30)
    chair = председатель()

    services.merge_profiles(основная, дубль, reason="Документ удостоверения совпал", actor=chair)

    запись = карточка(основная).entries.get(kind=RatingEntry.KIND_MERGE)
    assert запись.delta == Decimal("0.00")
    assert запись.created_by == chair
    assert "Документ удостоверения совпал" in запись.reason
    assert "Спортсмен (дубль)" in запись.reason


def test_с_самой_собой_не_объединить(params):
    u = игрок("+7704000007", "Спортсмен", 40)
    with pytest.raises(services.MergeError, match="саму с собой"):
        services.merge_profiles(u, u, reason="Ошибка", actor=None)


def test_без_основания_не_объединить(params):
    a = игрок("+7704000008", "А", 40)
    b = игрок("+7704000009", "Б", 30)
    with pytest.raises(services.MergeError, match="Основание"):
        services.merge_profiles(a, b, reason="  ", actor=None)


# ── API ─────────────────────────────────────────────────────────────


def test_объединять_может_только_председатель(params):
    a = игрок("+7704000010", "А", 40)
    b = игрок("+7704000011", "Б", 30)
    body = {"keep_user_id": str(a.pk), "drop_user_id": str(b.pk), "reason": "Дубль"}

    assert APIClient().post("/api/rating/merge/", body, format="json").status_code in (401, 403)

    staff = User.objects.create_user(phone="+7700888", name="Админ")
    staff.is_staff = True
    staff.save()
    api = APIClient()
    api.force_authenticate(staff)
    assert api.post("/api/rating/merge/", body, format="json").status_code == 403


def test_объединение_через_api(params):
    a = игрок("+7704000012", "Основная", 40)
    b = игрок("+7704000013", "Дубль", 30)
    api = APIClient()
    api.force_authenticate(председатель())

    r = api.post(
        "/api/rating/merge/",
        {"keep_user_id": str(a.pk), "drop_user_id": str(b.pk), "reason": "Дубль"},
        format="json",
    )
    assert r.status_code == 200, r.data
    assert r.data["value"] == "40.00"
    assert api.get("/api/rating/%s/" % b.pk).status_code == 404


def test_без_основания_через_api_400(params):
    a = игрок("+7704000014", "Основная", 40)
    b = игрок("+7704000015", "Дубль", 30)
    api = APIClient()
    api.force_authenticate(председатель())

    r = api.post(
        "/api/rating/merge/",
        {"keep_user_id": str(a.pk), "drop_user_id": str(b.pk), "reason": ""},
        format="json",
    )
    assert r.status_code == 400
    assert "Основание" in r.data["detail"]
