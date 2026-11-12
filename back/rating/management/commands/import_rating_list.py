"""Загрузить рейтинг-лист федерации из Excel ✳ (03.11.2026).

    python manage.py import_rating_list men.xlsx u17.xlsx [--column rj|ri] [--wipe] [--dry-run]

Файл — «Квалификационные списки рейтинга спортсменов по настольному теннису»
(оригиналы — docs/refs/reyting-list-*.xlsx). Колонки ищутся **по шапке**
(«Rж», «Rи», «Ф.И.О.», «Гр», «Город»), а не по месту ✳ (12.11.2026): листы
сентября начинаются с «Nж», листы октября — с лишней колонки «Nп», и заголовок
листа у них во второй колонке. Строки данных — те, где в первой колонке номер.
Ниже таблицы — подпись судьи и дисциплинарные взыскания, они не читаются.

- Стартовое значение — «Rж» (решение владельца продукта 03.11.2026), перенос
  прежнего рейтинга один к одному (п. 6.3); `--column ri` — «Rи».
- Один человек в нескольких списках (мужчины и юноши U-17) — одна карточка:
  ключ — ФИО и дата рождения; уже заведённый с тем же ключом не заводится снова.
  ФИО сравнивается приведённым ✳ (12.11.2026): без регистра, казахские буквы
  как русские (ҚАЛДЫБАЙ Нұртас = Калдыбай Нуртас), «ё» как «е», слова в любом
  порядке — иначе тот же человек, записанный иначе, получал вторую карточку.
- ФИО: «ГЕРАСИМЕНКО Кирилл» → «Герасименко Кирилл» (так хранятся имена; на
  экране фамилию прописными рисует `fio()`).
- Пол — из заголовка листа над таблицей ✳ (04.11.2026): «мужчины», «юноши»,
  «мальчики» — «m»; «женщины», «девушки», «девочки» — «f». Незнакомый
  заголовок — отказ всей загрузки: угадывать пол по имени нельзя.
- Город → регион закреплённого списка (`regions.py`), сокращения — `REGION`
  ниже; незнакомый — отказ всей загрузки, ничего не записано. Зарубежные
  города листа (`FOREIGN`) ✳ (12.11.2026) заводятся без региона («не указан»):
  в закреплённом списке только регионы Казахстана, а спортсмены из Ташкента,
  Москвы и т. п. в листе федерации есть. Город, которого нет ни там, ни там, —
  по-прежнему отказ: опечатка в казахстанском городе не должна молча стать
  «не указан».
- `--dry-run` — только отчёт: сколько строк, сколько уже есть, кто будет
  заведён; ничего не записывается.
- Колонка «N» не читается: что она значит, в файле не сказано.
- `--wipe` перед загрузкой сносит все турниры, рейтинговые карточки с историей
  и учётки без ролей; учётки с ролями и `is_staff` остаются.
"""
import datetime
import re

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from openpyxl import load_workbook

from rating import engine, services

#: Написания региона в листах федерации → закреплённый список. «ЮКО» —
#: прежнее название Туркестанской области (до 2018 года) — наше прочтение.
REGION = {
    "г. Астана": "Астана",
    "г. Алматы": "Алматы",
    "г. Шымкент": "Шымкент",
    "Абайская обл.": "Абайская область",
    "Акмолинск. обл.": "Акмолинская область",
    "Актюбинск. обл.": "Актюбинская область",
    "Алматинск. обл.": "Алматинская область",
    "Атырауская обл.": "Атырауская область",
    "ВКО": "Восточно-Казахстанская область",
    "Жамбылск. обл.": "Жамбылская область",
    "Жетисуская обл.": "Жетысуская область",
    "ЗКО": "Западно-Казахстанская область",
    "Карагандин. обл.": "Карагандинская область",
    "Костанайск. обл": "Костанайская область",
    "Костанайск. обл.": "Костанайская область",
    "Кызылорд. обл.": "Кызылординская область",
    "Мангистау. обл.": "Мангистауская область",
    "Павлодар. обл.": "Павлодарская область",
    "СКО": "Северо-Казахстанская область",
    "Туркестан. обл.": "Туркестанская область",
    "ЮКО": "Туркестанская область",
    "Улытау. обл.": "Улытауская область",
}

#: Зарубежные города в листах федерации — регион «не указан» (пустая строка).
FOREIGN = {
    "г. Ташкент", "г. Андижан", "г. Самарканд", "г. Фергана",
    "г. Бишкек", "г. Баку", "г. Пекин",
    "г. Москва", "г. Санкт- Петербург", "г. Санкт-Петербург", "г. Екатеринбург", "г. Краснодар",
    "г. Казань", "г. Оренбург", "г. Архангельск", "г. Нижный-Новгород", "г. Нижний Новгород",
    "г.Н-Новгород",
}


def region_of(city: str):
    """Регион закреплённого списка, «» для зарубежного города, None — незнакомый."""
    if city in REGION:
        return REGION[city]
    if city in FOREIGN:
        return ""
    return None


def _space(s) -> str:
    return " ".join(str(s or "").split())


def _name(raw: str) -> str:
    """«ГЕРАСИМЕНКО Кирилл» → «Герасименко Кирилл»; дефисы сохраняются."""
    return " ".join("-".join(p[:1].upper() + p[1:].lower() for p in w.split("-")) for w in _space(raw).split(" "))


_KAZ = str.maketrans({"ә": "а", "ғ": "г", "қ": "к", "ң": "н", "ө": "о", "ұ": "у", "ү": "у", "һ": "х", "і": "и",
                      "ё": "е", "й": "и"})


def same_person_key(name: str, birth) -> tuple:
    """Ключ «тот же человек»: ФИО без регистра, казахские буквы как русские, «ё» как
    «е», слова в любом порядке — и дата рождения."""
    words = _space(name).lower().translate(_KAZ).replace("-", " ").split()
    return (" ".join(sorted(words)), birth)


def _birth(raw) -> datetime.date:
    if isinstance(raw, datetime.datetime):
        return raw.date()
    m = re.fullmatch(r"(\d\d)\.(\d\d)\.(\d{4})", _space(raw))
    if not m:
        raise ValueError(raw)
    return datetime.date(int(m.group(3)), int(m.group(2)), int(m.group(1)))


#: Заголовок листа → пол (первое слово, как в листах федерации).
SEX_BY_TITLE = {
    "мужчины": "m", "юноши": "m", "мальчики": "m",
    "женщины": "f", "девушки": "f", "девочки": "f",
}


class TitleError(ValueError):
    """У листа не нашлось заголовка, по которому понятен пол."""


def _sex(rows) -> str:
    """Пол по заголовку над таблицей — любая ячейка строк до шапки."""
    titles = []
    for r in rows:
        if r and isinstance(r[0], int):
            break
        for cell in r or ():
            head = _space(cell).lower()
            if not head:
                continue
            titles.append(head)
            sex = SEX_BY_TITLE.get(head.split(" ")[0])
            if sex:
                return sex
    raise TitleError(" / ".join(titles) or "заголовка нет")


class LayoutError(ValueError):
    """В листе нет шапки с нужными колонками."""


def _columns(rows) -> dict:
    """Номера колонок по шапке: «Rж», «Rи», «Ф.И.О.», «Гр», «Город»."""
    want = {"rj": "rж", "ri": "rи", "name": "ф.и.о.", "birth": "гр", "city": "город"}
    for r in rows:
        cells = [_space(c).lower() for c in (r or ())]
        if "ф.и.о." in cells:
            missing = [h for h in want.values() if h not in cells]
            if missing:
                raise LayoutError("в шапке нет колонок: " + ", ".join(missing))
            return {k: cells.index(h) for k, h in want.items()}
    raise LayoutError("шапки с «Ф.И.О.» нет")


def read(path: str, column: str) -> list:
    ws = load_workbook(path, read_only=True, data_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    sex = _sex(rows)
    col = _columns(rows)
    out = []
    for r in rows:
        if not (r and isinstance(r[0], int) and len(r) > col["city"] and r[col["name"]]):
            continue
        out.append(
            {
                "value": r[col[column]],
                "name": _name(r[col["name"]]),
                "birth": _birth(r[col["birth"]]),
                "city": _space(r[col["city"]]),
                "sex": sex,
            }
        )
    return out


class Command(BaseCommand):
    help = "Загрузить рейтинг-лист федерации (Excel): спортсмены с переносом прежнего рейтинга"

    def add_arguments(self, parser):
        parser.add_argument("files", nargs="+")
        parser.add_argument("--column", choices=["rj", "ri"], default="rj")
        parser.add_argument("--wipe", action="store_true", help="Сначала снести турниры, карточки и учётки без ролей")
        parser.add_argument("--dry-run", action="store_true", help="Только отчёт, ничего не записывать")

    @transaction.atomic
    def handle(self, *args, files, column, wipe, dry_run=False, **_):
        rows = []
        for f in files:
            try:
                rows += read(f, column)
            except TitleError as e:
                raise CommandError("Пол не понятен по заголовку листа: %s (%s)" % (e, f))
            except LayoutError as e:
                raise CommandError("Лист не читается: %s (%s)" % (e, f))
            except ValueError as e:
                raise CommandError("Дата рождения не читается: %s (%s)" % (e, f))
        unknown = sorted({r["city"] for r in rows if region_of(r["city"]) is None})
        if unknown:
            raise CommandError("Незнакомый регион: %s — добавьте в REGION или FOREIGN" % ", ".join(unknown))
        if wipe and dry_run:
            raise CommandError("--wipe и --dry-run вместе не бывают")

        if wipe:
            self._wipe()

        from rating.models import RatingProfile

        have = {same_person_key(p.user.name, p.birth_date) for p in RatingProfile.objects.select_related("user")}
        if dry_run:
            fresh, keys = [], set(have)
            for r in rows:
                key = same_person_key(r["name"], r["birth"])
                if key not in keys:
                    keys.add(key)
                    fresh.append(r)
            for r in fresh:
                self.stdout.write("  + %s, %s, %s, %s" % (
                    r["name"], r["birth"].strftime("%d.%m.%Y"),
                    region_of(r["city"]) or "регион не указан (%s)" % r["city"], r["value"]))
            self.stdout.write(
                "Строк в листах: %d, уже есть: %d, будет заведено: %d (без региона: %d). Ничего не записано." % (
                    len(rows), len(rows) - len(fresh), len(fresh), sum(1 for r in fresh if not region_of(r["city"]))))
            return
        made = 0
        for r in rows:
            key = same_person_key(r["name"], r["birth"])
            if key in have:
                continue
            services.create_athlete(
                name=r["name"],
                region=region_of(r["city"]),
                sex=r["sex"],
                birth_date=r["birth"],
                origin=engine.ORIGIN_LEGACY,
                legacy=r["value"],
            )
            have.add(key)
            made += 1
        self.stdout.write("Строк в листах: %d, заведено спортсменов: %d" % (len(rows), made))

    def _wipe(self):
        from rating.models import RatingEntry, RatingProfile
        from tournaments.models import Tournament
        from users.models import User

        n_t = Tournament.objects.count()
        Tournament.objects.all().delete()
        RatingEntry.objects.all().delete()
        RatingProfile.objects.all().delete()
        doomed = User.objects.filter(roles__isnull=True, is_staff=False, is_superuser=False)
        n_u = doomed.count()
        doomed.delete()
        # Коэффициенты (`RatingParams`) не трогаются: их правят на «Калибровке».
        self.stdout.write("Снесено: турниров %d, учёток без ролей %d" % (n_t, n_u))
