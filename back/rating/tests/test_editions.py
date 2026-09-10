"""Выпуски рейтинга (п. 8.2) и срок апелляции (п. 21.2).

Рейтинговая таблица обновляется и публикуется еженедельно. Выпуск — снимок
значений на момент публикации: живая карточка дальше меняется, выпуск — нет.
От даты выпуска считается срок апелляции — 5 рабочих дней.

Проверки конкретные: какое значение стоит в выпуске после исправления живой
карточки, какой номер у второго выпуска, в какой день кончается срок.
"""
from datetime import date
from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from rating import engine, services
from rating.models import RatingEdition, RatingParams
from users.models import Role, User

pytestmark = pytest.mark.django_db


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


def председатель(phone="+7700999"):
    u = User.objects.create_user(phone=phone, name="Председатель")
    Role.objects.create(user=u, kind=Role.KIND_GSK_CHAIRMAN)
    return u


# ── Рабочие дни (п. 21.2–21.3) ──────────────────────────────────────


def test_пять_рабочих_дней_без_выходных():
    # 11.09.2026 — пятница: пн 14 … пт 18.
    assert engine.add_working_days(date(2026, 9, 11), 5) == date(2026, 9, 18)
    # Среда 9-го: чт 10, пт 11, пн 14, вт 15, ср 16.
    assert engine.add_working_days(date(2026, 9, 9), 5) == date(2026, 9, 16)
    # Опубликовали в субботу — отсчёт с понедельника.
    assert engine.add_working_days(date(2026, 9, 12), 5) == date(2026, 9, 18)


def test_десять_рабочих_дней_на_рассмотрение():
    # Пятница 11-го + 10 рабочих = пятница 25-го.
    assert engine.add_working_days(date(2026, 9, 11), 10) == date(2026, 9, 25)


# ── Выпуск как снимок ───────────────────────────────────────────────


def test_выпуск_это_снимок_на_дату_публикации(params):
    игрок("+7701000001", "Первый", 50)
    второй = игрок("+7701000002", "Второй", 40)
    chair = председатель()

    ed = services.publish_edition(actor=chair)
    rows = {r.user.name: r for r in ed.rows.all()}
    assert (rows["Первый"].place, rows["Первый"].value) == (1, Decimal("50.00"))
    assert (rows["Второй"].place, rows["Второй"].value) == (2, Decimal("40.00"))
    assert ed.published_by == chair

    services.register_correction(второй, 60, reason="опечатка", actor=chair)
    # Живое значение стало 60, в выпуске осталось 40.
    assert RatingEdition.objects.get(pk=ed.pk).rows.get(user=второй).value == Decimal("40.00")


def test_неактивный_в_выпуске_без_места(params):
    from datetime import timedelta

    сегодня = timezone.localdate()
    # Статус выводится из даты последнего матча — выпуск его пересчитывает (п. 18).
    игрок("+7701000003", "Активный", 30, last_match_at=сегодня - timedelta(days=30))
    игрок("+7701000004", "Неактивный", 45, last_match_at=сегодня - timedelta(days=25 * 31))

    rows = {r.user.name: r for r in services.publish_edition(actor=None).rows.all()}
    # Неактивный исключается из текущей таблицы (п. 18.2), но в выпуске хранится.
    assert rows["Активный"].place == 1
    assert rows["Неактивный"].place is None


def test_номера_подряд_и_срок_апелляции_от_даты_выпуска(params):
    игрок("+7701000005", "Кто-то", 20)
    first = services.publish_edition(actor=None)
    second = services.publish_edition(actor=None)

    assert (first.number, second.number) == (1, 2)
    день = timezone.localdate(second.published_at)
    assert second.appeal_until == engine.add_working_days(день, 5)


# ── Черновик: что изменилось с прошлого выпуска ─────────────────────


def test_черновик_показывает_только_сдвинувшихся_и_новых(params):
    игрок("+7701000006", "Стоял", 30)
    сдвинулся = игрок("+7701000007", "Сдвинулся", 20)
    services.publish_edition(actor=None)

    services.register_correction(сдвинулся, 25.5, reason="опечатка", actor=None)
    игрок("+7701000008", "Новенький", 10)

    by_name = {d["name"]: d for d in services.edition_draft()}
    assert set(by_name) == {"Сдвинулся", "Новенький"}
    assert by_name["Сдвинулся"]["before"] == Decimal("20.00")
    assert by_name["Сдвинулся"]["after"] == Decimal("25.50")
    assert by_name["Сдвинулся"]["delta"] == Decimal("5.50")
    assert by_name["Новенький"]["before"] is None


def test_черновик_до_первого_выпуска_это_все(params):
    игрок("+7701000009", "А", 30)
    игрок("+7701000010", "Б", 20)
    assert {d["name"] for d in services.edition_draft()} == {"А", "Б"}


# ── API ─────────────────────────────────────────────────────────────


def test_опубликовать_может_только_председатель(params):
    игрок("+7701000011", "Кто-то", 20)
    api = APIClient()
    assert api.post("/api/rating/editions/").status_code in (401, 403)

    staff = User.objects.create_user(phone="+7700888", name="Админ")
    staff.is_staff = True
    staff.save()
    api.force_authenticate(staff)
    assert api.post("/api/rating/editions/").status_code == 403

    api.force_authenticate(председатель())
    r = api.post("/api/rating/editions/")
    assert r.status_code == 201
    assert r.data["number"] == 1
    assert r.data["rows"] == 1


def test_публичный_лист_показывает_выпуск_а_не_живое_значение(params):
    спортсмен = игрок("+7701000012", "Спортсмен", 40)
    chair = председатель()
    services.publish_edition(actor=chair)
    services.register_correction(спортсмен, 60, reason="опечатка", actor=chair)

    api = APIClient()
    r = api.get("/api/rating/")
    assert r.data["results"][0]["value"] == "40.00"
    assert r.data["edition"]["number"] == 1

    live = api.get("/api/rating/", {"edition": "live"})
    assert live.data["results"][0]["value"] == "60.00"
    assert live.data["edition"] is None


def test_до_первого_выпуска_лист_живой(params):
    игрок("+7701000013", "Спортсмен", 33)
    r = APIClient().get("/api/rating/")
    assert r.data["results"][0]["value"] == "33.00"
    assert r.data["edition"] is None


def test_лист_прошлого_выпуска_по_номеру(params):
    спортсмен = игрок("+7701000014", "Спортсмен", 10)
    services.publish_edition(actor=None)
    services.register_correction(спортсмен, 20, reason="опечатка", actor=None)
    services.publish_edition(actor=None)

    первый = RatingEdition.objects.get(number=1)
    r = APIClient().get("/api/rating/", {"edition": str(первый.id)})
    assert r.data["results"][0]["value"] == "10.00"
    assert r.data["edition"]["number"] == 1


def test_фильтры_и_исключение_неактивных_работают_на_выпуске(params):
    from datetime import timedelta

    недавно = timezone.localdate() - timedelta(days=30)
    игрок("+7701000015", "Он", 20, sex="m", last_match_at=недавно)
    игрок("+7701000016", "Она", 30, sex="f", last_match_at=недавно)
    игрок("+7701000017", "Ушла", 50, sex="f", last_match_at=timezone.localdate() - timedelta(days=25 * 31))
    services.publish_edition(actor=None)

    r = APIClient().get("/api/rating/", {"sex": "f"})
    assert [x["name"] for x in r.data["results"]] == ["Она"]
    assert r.data["edition"] is not None


def test_список_выпусков_открыт_а_черновик_только_председателю(params):
    игрок("+7701000018", "Кто-то", 20)
    services.publish_edition(actor=None)

    api = APIClient()
    r = api.get("/api/rating/editions/")
    assert r.status_code == 200
    assert [e["number"] for e in r.data] == [1]

    assert api.get("/api/rating/editions/draft/").status_code in (401, 403)
    api.force_authenticate(председатель())
    d = api.get("/api/rating/editions/draft/")
    assert d.status_code == 200
    assert d.data == []  # с выпуска ничего не менялось


# ── Статусы активности обновляются при публикации (п. 18) ───────────


def test_выпуск_сначала_обновляет_статусы_активности(params):
    """Выпуск еженедельный (п. 8.2) — это и есть расписание пересчёта статусов:
    без него «неактивен через 24 месяца» (п. 18.1) держался бы на ручном
    запуске команды, и снимок уходил бы со вчерашним статусом."""
    from datetime import timedelta

    давно = игрок("+7701000019", "Давно не играл", 45, status=engine.STATUS_ACTIVE)
    профиль = давно.rating_profile
    профиль.last_match_at = timezone.localdate() - timedelta(days=25 * 31)
    профиль.save(update_fields=["last_match_at"])
    игрок("+7701000020", "Играет", 30, status=engine.STATUS_ACTIVE)

    ed = services.publish_edition(actor=None)

    строка = ed.rows.get(user=давно)
    assert строка.status == engine.STATUS_INACTIVE
    assert строка.place is None  # исключён из текущей таблицы (п. 18.2)
    assert ed.rows.get(user__name="Играет").place == 1
