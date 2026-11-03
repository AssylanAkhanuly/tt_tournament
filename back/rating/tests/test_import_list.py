"""Загрузка рейтинг-листа федерации ✳ (03.11.2026): `manage.py import_rating_list`.

Файл — «Квалификационные списки рейтинга спортсменов» (docs/refs): строки
«Nж · Rж · Rи · N · Ф.И.О. · Гр · Город». Стартовое значение — колонка «Rж»
(решение владельца продукта 03.11.2026), перенос прежнего рейтинга один к одному
(п. 6.3). Один человек в двух списках (мужчины и U-17) — одна карточка. Регион
приводится к закреплённому списку; незнакомый — отказ всей загрузки. `--wipe`
перед загрузкой сносит турниры, рейтинговые карточки и учётки без ролей;
председатель и `is_staff` остаются."""
import datetime
from decimal import Decimal

import pytest
from django.core.management import CommandError, call_command
from openpyxl import Workbook

from rating.models import RatingProfile
from tournaments.models import Tournament
from users.models import Role, User

pytestmark = pytest.mark.django_db


def лист(path, title, rows):
    wb = Workbook()
    ws = wb.active
    ws.append([None])
    ws.append(["Квалификационные списки рейтинга спортсменов по настольному теннису"])
    ws.append(["РЕСПУБЛИКА  КАЗАХСТАН"])
    ws.append([title])
    ws.append(["составлено на 02.09.2026"])
    ws.append(["Nж", "Rж", "Rи", "N", "Ф.И.О.", "Гр", "Город"])
    for r in rows:
        ws.append(list(r))
    ws.append([None])
    ws.append([None, "Судья по рейтингу Республики Казахстан …", None, None, None, None, "Мирасланов М.К."])
    ws.append([None, None, None, None, "Дициплинарные взыскания (желтые карточки)"])
    ws.append([None, None, None, 1, "ГЕРАСИМЕНКО Кирилл  ", datetime.datetime(2026, 4, 12)])
    wb.save(path)
    return str(path)


@pytest.fixture
def файлы(tmp_path):
    men = лист(tmp_path / "men.xlsx", "мужчины", [
        (1, 79, 82, 8, "ГЕРАСИМЕНКО Кирилл  ", "18.12.1996", "г. Астана"),
        (2, 66, 66, 22, "КУРМАНГАЛИЕВ Алан  ", "12.01.2007", "Карагандин. обл."),
        (3, 38, 38, 26, "ZHUMAGUL Marlen  ", "25.10.2011", "Туркестан. обл."),
        (4, 30, 30, 5, "ТОЛЕБАЕВ  Самат  ", "01.02.2005", "ЮКО"),
    ])
    boys = лист(tmp_path / "u17.xlsx", "юноши  U - 17", [
        (1, 38, 38, 26, "ZHUMAGUL Marlen  ", "25.10.2011", "Туркестан. обл."),
    ])
    return men, boys


def test_загрузка_по_колонке_rж_одна_карточка_на_человека(файлы):
    call_command("import_rating_list", *файлы)
    assert RatingProfile.objects.count() == 4  # Zhumagul — в обоих списках, карточка одна
    г = RatingProfile.objects.select_related("user").get(user__name="Герасименко Кирилл")
    assert г.value == Decimal("79.00")  # «Rж», а не «Rи» = 82
    assert (г.region, г.sex, г.birth_date, г.birth_year) == ("Астана", "m", datetime.date(1996, 12, 18), 1996)
    assert г.origin == "legacy"
    assert RatingProfile.objects.get(user__name="Курмангалиев Алан").region == "Карагандинская область"
    assert RatingProfile.objects.get(user__name="Zhumagul Marlen").region == "Туркестанская область"
    # ЮКО — прежнее название Туркестанской области; двойной пробел в ФИО схлопнут.
    assert RatingProfile.objects.get(user__name="Толебаев Самат").region == "Туркестанская область"


def test_повторная_загрузка_не_задваивает(файлы):
    call_command("import_rating_list", *файлы)
    call_command("import_rating_list", *файлы)
    assert RatingProfile.objects.count() == 4


def test_незнакомый_регион_отменяет_всю_загрузку(tmp_path):
    bad = лист(tmp_path / "bad.xlsx", "мужчины", [
        (1, 10, 10, 1, "ИВАНОВ Иван", "01.01.2000", "г. Алматы"),
        (2, 10, 10, 1, "ПЕТРОВ Пётр", "01.01.2000", "Луна"),
    ])
    with pytest.raises(CommandError, match="Луна"):
        call_command("import_rating_list", bad)
    assert RatingProfile.objects.count() == 0


def test_wipe_сносит_турниры_и_игроков_но_не_роли(файлы):
    председатель = User.objects.create_user(phone="+77001110001", name="Председатель", password="x")
    Role.objects.create(user=председатель, kind=Role.KIND_GSK_CHAIRMAN)
    админ = User.objects.create_user(phone="+77001110002", name="Суперпользователь", password="x")
    админ.is_staff = True
    админ.save()
    игрок = User.objects.create_user(phone="+77001110003", name="Старый игрок", password="x")
    Tournament.objects.create(name="Старый турнир", created_by=председатель)

    call_command("import_rating_list", *файлы, "--wipe")

    assert Tournament.objects.count() == 0
    assert not User.objects.filter(pk=игрок.pk).exists()
    assert User.objects.filter(pk__in=[председатель.pk, админ.pk]).count() == 2
    assert RatingProfile.objects.count() == 4
