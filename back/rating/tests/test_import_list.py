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


# ── Пол — из заголовка листа ✳ (04.11.2026): женский список федерации ──


def test_женский_список_заводит_спортсменок(tmp_path):
    women = лист(tmp_path / "w.xlsx", "женщины", [
        (1, 72, 72, 20, "АКАШЕВА Зауреш  ", "02.12.2000", "Карагандин. обл."),
        (2, 50, 50, 10, "ЛУКЬЯНОВА Мария  ", "22.11.2011", "Карагандин. обл."),
    ])
    girls = лист(tmp_path / "g.xlsx", "девушки  U - 15", [
        (1, 50, 50, 10, "ЛУКЬЯНОВА Мария  ", "22.11.2011", "Карагандин. обл."),
    ])
    call_command("import_rating_list", women, girls)
    assert RatingProfile.objects.count() == 2
    assert set(RatingProfile.objects.values_list("sex", flat=True)) == {"f"}
    assert RatingProfile.objects.get(user__name="Акашева Зауреш").value == Decimal("72.00")


def test_мужской_и_женский_вместе_у_каждого_свой_пол(файлы, tmp_path):
    women = лист(tmp_path / "w.xlsx", "женщины", [(1, 72, 72, 20, "АКАШЕВА Зауреш", "02.12.2000", "г. Алматы")])
    call_command("import_rating_list", *файлы, women)
    assert RatingProfile.objects.get(user__name="Герасименко Кирилл").sex == "m"
    assert RatingProfile.objects.get(user__name="Акашева Зауреш").sex == "f"


def test_незнакомый_заголовок_листа_отменяет_загрузку(tmp_path):
    odd = лист(tmp_path / "x.xlsx", "ветераны", [(1, 10, 10, 1, "ИВАНОВ Иван", "01.01.1960", "г. Алматы")])
    with pytest.raises(CommandError, match="ветераны"):
        call_command("import_rating_list", odd)
    assert RatingProfile.objects.count() == 0


# ── Листы октября 2026 ✳ (12.11.2026): лишняя колонка «Nп», заголовок во второй
#    колонке, зарубежные города, тот же человек казахскими буквами ──


def лист_октября(path, title, rows):
    """Как у федерации 02.10.2026: «Nп · Nж · Rж · Rи · N · Ф.И.О. · Гр · Город»."""
    wb = Workbook()
    ws = wb.active
    ws.append([None])
    ws.append([None, "Квалификационные списки рейтинга спортсменов по настольному теннису"])
    ws.append([None, "РЕСПУБЛИКА  КАЗАХСТАН"])
    ws.append([None, title])
    ws.append([None, "составлено на 02.10.2026"])
    ws.append(["Nп", "Nж", "Rж", "Rи", "N", "Ф.И.О.", "Гр", "Город"])
    for r in rows:
        ws.append(list(r))
    ws.append([None])
    ws.append([None, None, "Судья по рейтингу Республики Казахстан …", None, None, None, None, "Мирасланов М.К."])
    wb.save(path)
    return str(path)


def test_лист_октября_читается_по_шапке(tmp_path):
    f = лист_октября(tmp_path / "w.xlsx", "женщины", [
        (1, 73, 25, 26, 18, "ЖАРМУХАМБЕТОВА Алуа  ", "26.09.2008", "Абайская обл."),
    ])
    call_command("import_rating_list", f)
    p = RatingProfile.objects.select_related("user").get()
    # «Rж» = 25: не «Nж» = 73 и не «Rи» = 26 — колонки сдвинуты на одну.
    assert (p.user.name, p.value, p.sex) == ("Жармухамбетова Алуа", Decimal("25.00"), "f")
    assert (p.birth_date, p.region) == (datetime.date(2008, 9, 26), "Абайская область")


def test_зарубежный_город_без_региона_а_незнакомый_по_прежнему_отказ(tmp_path):
    f = лист_октября(tmp_path / "m.xlsx", "мужчины", [
        (1, 1, 30, 30, 5, "АВАЗОВ Шохжахон ", "29.08.2013", "г. Ташкент"),
        (2, 2, 20, 20, 5, "ПОПОВ  Андрей  ", "03.05.1996", "г.Н-Новгород"),
    ])
    call_command("import_rating_list", f)
    assert sorted(RatingProfile.objects.values_list("region", flat=True)) == ["", ""]
    bad = лист_октября(tmp_path / "x.xlsx", "мужчины", [(1, 1, 30, 30, 5, "ИВАНОВ Иван", "01.01.2000", "г. Астанаа")])
    with pytest.raises(CommandError, match="Астанаа"):
        call_command("import_rating_list", bad)
    assert RatingProfile.objects.count() == 2


def test_тот_же_человек_казахскими_буквами_и_в_другом_порядке_не_задваивается(tmp_path):
    from rating import engine, services

    services.create_athlete(name="ҚАЛДЫБАЙ Нұртас", region="Мангистауская область", sex="m",
                            birth_date=datetime.date(2011, 12, 31), origin=engine.ORIGIN_LEGACY, legacy=4)
    services.create_athlete(name="Ёлкин Пётр", region="Астана", sex="m",
                            birth_date=datetime.date(2000, 1, 1), origin=engine.ORIGIN_LEGACY, legacy=10)
    f = лист_октября(tmp_path / "m.xlsx", "мужчины", [
        (1, 1, 4, 4, 1, "КАЛДЫБАЙ Нуртас ", "31.12.2011", "Мангистау. обл."),
        (2, 2, 10, 10, 1, "Петр ЕЛКИН", "01.01.2000", "г. Астана"),
        # Тот же ФИО, но другая дата рождения — другой человек, заводится.
        (3, 3, 10, 10, 1, "ЕЛКИН Петр", "02.01.2000", "г. Астана"),
    ])
    call_command("import_rating_list", f)
    assert RatingProfile.objects.count() == 3


def test_dry_run_только_отчёт(tmp_path, capsys):
    f = лист_октября(tmp_path / "m.xlsx", "мужчины", [
        (1, 1, 30, 30, 5, "АВАЗОВ Шохжахон ", "29.08.2013", "г. Ташкент"),
        (2, 2, 20, 20, 5, "ИВАНОВ Иван", "01.01.2000", "г. Алматы"),
    ])
    call_command("import_rating_list", f, "--dry-run")
    out = capsys.readouterr().out
    assert RatingProfile.objects.count() == 0
    assert "будет заведено: 2 (без региона: 1)" in out
    assert "Авазов Шохжахон" in out


def test_дата_1900_это_заглушка_карточка_без_даты(tmp_path):
    f = лист_октября(tmp_path / "m.xlsx", "мужчины", [
        (1, 1, 42, 42, 5, "МА Чжен ", "01.01.1900", "г. Алматы"),
    ])
    call_command("import_rating_list", f)
    p = RatingProfile.objects.select_related("user").get()
    assert (p.user.name, p.birth_date, p.birth_year, p.value) == ("Ма Чжен", None, None, Decimal("42.00"))
    call_command("import_rating_list", f)  # повтор — та же карточка, не вторая
    assert RatingProfile.objects.count() == 1
