"""Показательный сезон Лиги для обзора сезона ✳ (21.11.2026, LEAGUE.md «Обзор сезона»).

`manage.py seed_league_demo` заводит (заново, если уже был) сезон «Показ 2026»:
15 лиг по 4 команды, туры в разных состояниях относительно сегодняшнего дня —
сыгранные, идущий, с отправленным расписанием, черновики с судьями и без,
без расписания близко к дате и далеко. Нужен, чтобы полоска туров на странице
сезона показала все цвета. Боевые данные не трогает: всё помечено «[показ]»
или живёт в сезоне «Показ 2026»."""
import datetime

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from clubs.models import Club
from league import services
from league.models import LeagueDivision, LeagueSeason, LeagueTour
from users.models import Role, User

SEASON = "Показ 2026"
LEAGUES = [
    ("m", "Суперлига"), ("m", "Высшая лига"), ("m", "1 лига"), ("m", "2 лига"), ("m", "3 лига"),
    ("m", "4 лига"), ("m", "5 лига"), ("m", "6 лига"), ("f", "Ж Суперлига"), ("f", "Ж 1 лига"),
    ("f", "Ж 2 лига"), ("m", "Ветераны 40+"), ("m", "Ветераны 50+"), ("m", "Юниоры U19"), ("f", "Девушки U19"),
]
CITIES = ["Астана", "Алматы", "Шымкент", "Караганда", "Актобе", "Тараз", "Павлодар", "Костанай"]
CLUBS = ["Алматы ТТ", "Астана Спин", "Шымкент ТТК", "Караганда", "Актобе", "Тараз", "Павлодар", "Костанай",
         "Кокшетау", "Семей", "Атырау", "Орал", "Туркестан", "Петропавл", "Талдыкорган", "Жезказган"]


class Command(BaseCommand):
    help = "Показательный сезон Лиги: 15 лиг, туры во всех состояниях."

    @transaction.atomic
    def handle(self, *args, **opts):
        admin = User.objects.filter(roles__kind=Role.KIND_FEDERATION_ADMIN).first() or \
            User.objects.filter(roles__kind=Role.KIND_GSK_CHAIRMAN).first()
        if admin is None:
            self.stderr.write("Нет администратора федерации или председателя ГСК.")
            return
        referees = list(User.objects.filter(roles__kind=Role.KIND_REFEREE).distinct()[:4]) or [admin]

        old = LeagueSeason.objects.filter(name=SEASON)
        LeagueDivision.objects.filter(season__in=old).delete()
        old.delete()

        today = timezone.localdate()
        season = services.create_season(today.year, SEASON, None, admin)
        clubs = [Club.objects.get_or_create(name="[показ] " + n)[0] for n in CLUBS]

        for i, (gender, name) in enumerate(LEAGUES):
            div = services.create_division(season, gender, name, i + 1, admin)
            for k in range(4):
                club = clubs[(i * 3 + k) % len(clubs)]
                services.register_team(div, club, club.name.replace("[показ] ", ""), admin)
            for n, (offset, plan) in enumerate(self.plan(i), start=1):
                tour = services.create_tour(div, n, CITIES[(i + n * 3) % len(CITIES)], today + datetime.timedelta(days=offset), admin)
                self.apply(tour, plan, referees)
        self.stdout.write("Сезон «%s»: %s" % (SEASON, season.id))

    @staticmethod
    def plan(i):
        """Туры лиги `i`: (сдвиг даты от сегодня в днях, что с ним сделать)."""
        first = ("unscored" if i == 3 else "played")
        second = ("live" if i % 4 == 1 else "unscored" if i == 6 else "played")
        third = ["ready", "draft", "draft_noref", "none", "ready"][i % 5]
        tours = [(-56, first), (0 if second == "live" else -21, second), (10, third)]
        if i % 3 != 2:
            tours.append((38, "draft" if i % 6 == 0 else "none"))
        if i == 0:
            tours += [(66, "none"), (94, "none")]
        return tours

    @staticmethod
    def apply(tour: LeagueTour, plan: str, referees):
        matches = list(tour.matches.order_by("id"))
        if plan in ("played", "unscored", "live"):
            done = matches if plan == "played" else matches[:-1] if plan == "unscored" else matches[:2]
            for m in done:
                m.status, m.rubbers_a, m.rubbers_b, m.winner = "finished", 3, 1, "a"
                m.save(update_fields=["status", "rubbers_a", "rubbers_b", "winner"])
            tour.schedule_status = "final"
        elif plan in ("ready", "draft", "draft_noref"):
            tour.schedule_status = "final" if plan == "ready" else "draft"
        else:
            tour.save()
            return
        start = timezone.make_aware(datetime.datetime.combine(tour.starts_on, datetime.time(10)))
        for k, m in enumerate(matches):
            m.round_number = k // 2 + 1
            m.table = k % 2 + 1
            m.scheduled_at = start + datetime.timedelta(minutes=120 * (k // 2))
            m.referee = None if plan == "draft_noref" and k % 2 else referees[k % len(referees)]
            m.save(update_fields=["round_number", "table", "scheduled_at", "referee"])
        tour.referees.set(referees)
        tour.save()
