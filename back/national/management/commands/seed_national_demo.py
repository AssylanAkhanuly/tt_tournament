"""Показательные планы подготовки для доски планов ✳ (21.11.2026, NATIONAL.md «Доска планов»).

`manage.py seed_national_demo` берёт десять спортсменов из рейтинг-листа, вносит
их в сборную (если ещё не там) и заводит каждому план на два месяца вокруг
сегодняшнего дня: работа с разными сроками (выполненная, просроченная,
будущая), сбор и старт из календаря подготовки, у двоих план не согласован, у
одного плана нет. Повторный запуск сносит прежние показательные планы и
мероприятия (по пометке «[показ]») и заводит заново."""
import datetime

from django.core.management.base import BaseCommand
from django.db import transaction

from national.models import NationalTeamMember, PlanItem, TrainingEvent, TrainingPlan
from rating.models import RatingProfile

TAG = "[показ] "
GROUPS = ["adult", "adult", "adult", "junior", "junior", "junior", "cadet", "cadet", "adult", "junior"]
WORK = ["Тест ОФП", "Видеоразбор соперников", "Подача: короткая в середину", "Скорость ног", "Приём подачи",
        "Контроль веса", "Игра с левшой", "Восстановление после старта"]


class Command(BaseCommand):
    help = "Показательные планы подготовки сборной для доски планов."

    @transaction.atomic
    def handle(self, *args, **opts):
        today = datetime.date.today()
        D = datetime.timedelta
        TrainingPlan.objects.filter(goal__startswith=TAG).delete()
        TrainingEvent.objects.filter(title__startswith=TAG).delete()

        camp = TrainingEvent.objects.create(kind="camp", title=TAG + "УТС Алматы", city="Алматы",
                                            starts_on=today - D(2), ends_on=today + D(4))
        start = TrainingEvent.objects.create(kind="start", title=TAG + "Чемпионат РК", city="Астана",
                                             starts_on=today + D(12), ends_on=today + D(15))
        camp2 = TrainingEvent.objects.create(kind="camp", title=TAG + "УТС Шымкент", city="Шымкент",
                                             starts_on=today + D(20), ends_on=today + D(27), age_group="junior")

        profiles = list(RatingProfile.objects.select_related("user").order_by("-value")[:10])
        for k, prof in enumerate(profiles):
            member, _ = NationalTeamMember.objects.get_or_create(user=prof.user, defaults={"age_group": GROUPS[k]})
            if k == 9:
                continue  # без плана — строка «Нет плана на этот период»
            status = "submitted" if k in (3, 7) else "approved"
            plan = TrainingPlan.objects.create(member=member, starts_on=today - D(20), ends_on=today + D(40),
                                               goal=TAG + "Подготовка к Чемпионату РК", status=status)
            for n in range(4):
                due = today + D((k * 3 + n * 5) % 24 - 9)
                PlanItem.objects.create(plan=plan, title=WORK[(k + n) % len(WORK)], due=due,
                                        done=due < today and (k + n) % 3 != 0)
            PlanItem.objects.create(plan=plan, kind="camp", title="Сбор: УТС Алматы", event=camp)
            if k % 2 == 0:
                PlanItem.objects.create(plan=plan, kind="start", title="Чемпионат РК", event=start)
            if member.age_group == "junior":
                PlanItem.objects.create(plan=plan, kind="camp", title="Сбор: УТС Шымкент", event=camp2)
        self.stdout.write("Показательные планы: %d спортсменов" % len(profiles))
