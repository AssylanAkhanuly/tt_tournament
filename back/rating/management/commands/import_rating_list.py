"""Загрузить рейтинг-лист федерации из Excel ✳ (03.11.2026).

    python manage.py import_rating_list men.xlsx u17.xlsx [--column rj|ri] [--wipe]

Файл — «Квалификационные списки рейтинга спортсменов по настольному теннису»
(оригиналы — docs/refs/reyting-list-*-2026-09-02.xlsx): строки данных — те, где
в первой колонке номер; колонки «Nж · Rж · Rи · N · Ф.И.О. · Гр · Город». Ниже
таблицы — подпись судьи и дисциплинарные взыскания, они не читаются.

- Стартовое значение — «Rж» (решение владельца продукта 03.11.2026), перенос
  прежнего рейтинга один к одному (п. 6.3); `--column ri` — «Rи».
- Один человек в нескольких списках (мужчины и юноши U-17) — одна карточка:
  ключ — ФИО и дата рождения; уже заведённый с тем же ключом не заводится снова.
- ФИО: «ГЕРАСИМЕНКО Кирилл» → «Герасименко Кирилл» (так хранятся имена; на
  экране фамилию прописными рисует `fio()`).
- Пол — из заголовка листа над таблицей ✳ (04.11.2026): «мужчины», «юноши»,
  «мальчики» — «m»; «женщины», «девушки», «девочки» — «f». Незнакомый
  заголовок — отказ всей загрузки: угадывать пол по имени нельзя.
- Город → регион закреплённого списка (`regions.py`), сокращения — `REGION`
  ниже; незнакомый — отказ всей загрузки, ничего не записано.
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


def _space(s) -> str:
    return " ".join(str(s or "").split())


def _name(raw: str) -> str:
    """«ГЕРАСИМЕНКО Кирилл» → «Герасименко Кирилл»; дефисы сохраняются."""
    return " ".join("-".join(p[:1].upper() + p[1:].lower() for p in w.split("-")) for w in _space(raw).split(" "))


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
    """Пол по заголовку над таблицей — строки до шапки «Nж · Rж · …»."""
    titles = []
    for r in rows:
        if r and isinstance(r[0], int):
            break
        head = _space(r[0] if r else "").lower()
        if head:
            titles.append(head)
            sex = SEX_BY_TITLE.get(head.split(" ")[0])
            if sex:
                return sex
    raise TitleError(" / ".join(titles) or "заголовка нет")


def read(path: str, column: str) -> list:
    ws = load_workbook(path, read_only=True, data_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    sex = _sex(rows)
    out = []
    for r in rows:
        if not (r and isinstance(r[0], int) and len(r) >= 7 and r[4]):
            continue
        out.append(
            {
                "value": r[1] if column == "rj" else r[2],
                "name": _name(r[4]),
                "birth": _birth(r[5]),
                "city": _space(r[6]),
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

    @transaction.atomic
    def handle(self, *args, files, column, wipe, **_):
        rows = []
        for f in files:
            try:
                rows += read(f, column)
            except TitleError as e:
                raise CommandError("Пол не понятен по заголовку листа: %s (%s)" % (e, f))
            except ValueError as e:
                raise CommandError("Дата рождения не читается: %s (%s)" % (e, f))
        unknown = sorted({r["city"] for r in rows if REGION.get(r["city"]) is None})
        if unknown:
            raise CommandError("Незнакомый регион: %s — добавьте в REGION" % ", ".join(unknown))

        if wipe:
            self._wipe()

        from rating.models import RatingProfile

        have = {(p.user.name, p.birth_date) for p in RatingProfile.objects.select_related("user")}
        made = 0
        for r in rows:
            key = (r["name"], r["birth"])
            if key in have:
                continue
            services.create_athlete(
                name=r["name"],
                region=REGION[r["city"]],
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
