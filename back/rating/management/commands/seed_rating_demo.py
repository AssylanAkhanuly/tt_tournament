"""Показательный набор рейтинговых данных.

Нужен двум вещам: сквозным проверкам фронта (им нужны предсказуемые числа) и
показу федерации — пустая таблица ничего не объясняет.

Набор детерминированный: те же спортсмены, тот же турнир, те же результаты, а
значит и те же рейтинги при каждом прогоне. Считает боевой расчёт, а не
подставленные значения, — иначе демонстрация показывала бы не то, что система.

Запуск: `python manage.py seed_rating_demo --reset`
"""
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from rating import engine
from rating.models import RatingEntry, RatingParams, RatingProfile
from rating.services import apply_tournament, get_or_create_profile, register_no_show
from tournaments.models import Match, Tournament, TournamentParticipant
from users.models import User

ПРЕФИКС = "+7799000"

#: Спортсмены: телефон, имя, происхождение, значение, регион, пол, год рождения.
СОСТАВ = [
    ("01", "Ахметов Ерлан", engine.ORIGIN_LEGACY, 82, "Алматы", "m", 1998),
    ("02", "Сулейменов Азамат", engine.ORIGIN_LEGACY, 50, "Астана", "m", 2001),
    ("03", "Ким Виктор", engine.ORIGIN_LEGACY, 40, "Шымкент", "m", 2006),
    ("04", "Нурланов Данияр", engine.ORIGIN_LEGACY, 33, "Караганда", "m", 2010),
    ("05", "Оспанов Тимур", engine.ORIGIN_NEW, 1, "Актобе", "m", 2012),
    ("06", "Ли Александр", engine.ORIGIN_ITTF, 0, "Алматы", "m", 2000),
    ("07", "Жумабаева Айна", engine.ORIGIN_LEGACY, 47, "Алматы", "f", 2002),
    ("08", "Оралбек Дана", engine.ORIGIN_LEGACY, 38, "Астана", "f", 2008),
]

#: Пара дублей для показа объединения (п. 5.3): один человек — две карточки.
#: В турнир не входят. У дубля одна неявка — чтобы объединение было видно по
#: числу: 30,00 − 0,20 = 29,80, а не 30,00 и не 57,80.
ДУБЛИ = [
    ("09", "Сейтказы Арман", 30),
    ("10", "Сейтказы Арман (дубль)", 28),
]

#: Матчи турнира: кто, с кем, счёт. Победы распределены так, чтобы в истории
#: были и ожидаемые исходы, и сенсация — иначе поведение шкалы не разглядеть.
МАТЧИ = [
    ("01", "02", 3, 1),
    ("03", "04", 3, 0),
    ("01", "03", 3, 2),
    ("02", "04", 3, 1),
    ("05", "04", 3, 2),  # новичок обыгрывает середняка — видно переходный период
    ("06", "05", 3, 0),
    ("07", "08", 3, 1),
    ("01", "06", 3, 2),
]

#: Итоговые места — от них коэффициент P (п. 10).
МЕСТА = {"01": 1, "02": 2, "03": 3, "06": 4}


class Command(BaseCommand):
    help = "Засеять показательный рейтинг: спортсмены, турнир, посчитанные начисления"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Снести прежний показательный набор перед засевом",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            Tournament.objects.filter(name__startswith="[demo] ").delete()
            User.objects.filter(phone__startswith=ПРЕФИКС).delete()
            # Коэффициенты тоже возвращаются к значениям по умолчанию: иначе
            # показательные числа зависели бы от того, что кто-то накрутил в
            # калибровке, и сквозные проверки перестали бы что-либо проверять.
            RatingParams.objects.all().delete()
            # Выпуски — тоже все: лист показывает последний выпуск, и снимок,
            # сделанный до засева, спрятал бы показательные числа. Команда
            # показательная и на боевой базе не запускается.
            from rating.models import RatingEdition

            RatingEdition.objects.all().delete()

        params = RatingParams.active()
        users = {}
        for suffix, name, origin, value, region, sex, year in СОСТАВ:
            user, _ = User.objects.get_or_create(
                phone=ПРЕФИКС + suffix, defaults={"name": name}
            )
            users[suffix] = user
            profile = RatingProfile.objects.filter(user=user).first()
            if not profile:
                kwargs = {"region": region, "sex": sex, "birth_year": year}
                if origin == engine.ORIGIN_ITTF:
                    kwargs["ittf_position"] = 100
                elif origin == engine.ORIGIN_LEGACY:
                    kwargs["legacy"] = value
                profile = get_or_create_profile(user, origin=origin, **kwargs)
            else:
                profile.region, profile.sex, profile.birth_year = region, sex, year
                profile.save(update_fields=["region", "sex", "birth_year"])

        organiser = users["01"]
        tournament = Tournament.objects.create(
            name="[demo] Чемпионат Республики Казахстан",
            created_by=organiser,
            status=Tournament.STATUS_FINISHED,
            level="top",
            starts_at=timezone.now(),
        )
        for suffix, user in users.items():
            TournamentParticipant.objects.create(
                tournament=tournament, user=user, place=МЕСТА.get(suffix)
            )
        for i, (a, b, s1, s2) in enumerate(МАТЧИ, start=1):
            Match.objects.create(
                tournament=tournament,
                round_number=1,
                match_number=i,
                player1=users[a],
                player2=users[b],
                score1=s1,
                score2=s2,
                winner=users[a] if s1 > s2 else users[b],
                status=Match.FINISHED,
            )

        written = apply_tournament(tournament)

        for suffix, name, value in ДУБЛИ:
            user, _ = User.objects.get_or_create(phone=ПРЕФИКС + suffix, defaults={"name": name})
            profile = get_or_create_profile(
                user, origin=engine.ORIGIN_LEGACY, legacy=value,
                region="Павлодар", sex="m", birth_year=2004,
            )
            if "(дубль)" in name and not profile.no_shows:
                register_no_show(user, reason="Показательная неявка дубля")

        # Отдельный областной турнир для показа утверждения протокола (п. 10, 13):
        # свои спортсменки и один матч, чтобы пересчёт с новым уровнем и местами
        # не задевал основной показательный набор. Уровень «областные» (C = 0,80):
        # 25,00 + 0,60 × 0,80 × 0,50 = 25,24 у победительницы.
        кубок_игроки = {}
        for suffix, name in (("11", "Бекова Алия"), ("12", "Нурпеисова Жанар")):
            user, _ = User.objects.get_or_create(phone=ПРЕФИКС + suffix, defaults={"name": name})
            get_or_create_profile(
                user, origin=engine.ORIGIN_LEGACY, legacy=25,
                region="Костанай", sex="f", birth_year=2003,
            )
            кубок_игроки[suffix] = user
        кубок = Tournament.objects.create(
            name="[demo] Кубок Костанайской области",
            created_by=кубок_игроки["11"],
            status=Tournament.STATUS_FINISHED,
            level="region",
            starts_at=timezone.now(),
        )
        for user in кубок_игроки.values():
            TournamentParticipant.objects.create(tournament=кубок, user=user)
        Match.objects.create(
            tournament=кубок, round_number=1, match_number=1,
            player1=кубок_игроки["11"], player2=кубок_игроки["12"],
            score1=3, score2=1, winner=кубок_игроки["11"], status=Match.FINISHED,
        )
        apply_tournament(кубок)

        self.stdout.write("Коэффициенты: D=%s K=%s" % (params.d, params.k_standard))
        self.stdout.write("Записей в журнале: %d" % written)
        for suffix, _, _, _, _, _, _ in СОСТАВ:
            profile = RatingProfile.objects.get(user=users[suffix])
            self.stdout.write(
                "  %-22s %6s  матчей %d  %d/%d"
                % (profile.user.name, profile.value, profile.matches_played, profile.wins, profile.losses)
            )
        self.stdout.write(self.style.SUCCESS("Показательный рейтинг засеян"))
