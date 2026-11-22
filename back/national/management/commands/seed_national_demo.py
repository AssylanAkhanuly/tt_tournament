"""Показательные планы подготовки для доски планов ✳ (21.11.2026, NATIONAL.md «Доска планов»).

`manage.py seed_national_demo` берёт десять спортсменов из рейтинг-листа, вносит
их в сборную (если ещё не там) и заводит каждому план на два месяца вокруг
сегодняшнего дня: работа с разными сроками (выполненная, просроченная,
будущая), сбор и старт из календаря подготовки, у двоих план не согласован, у
одного плана нет. Повторный запуск сносит прежние показательные планы и
мероприятия (по пометке «[показ]») и заводит заново.

Состав побольше ✳ (22.11.2026, просьба владельца продукта — показать страницы
карточек состава): ещё `--extra` спортсменов (по умолчанию 30) следующими по
рейтингу вносятся в сборную без планов. Группа — по году рождения (до 15 лет —
кадеты, до 18 — юноши, старше — взрослые; границы наши, для показа), верхняя
половина — основной состав, остальные — расширенный. Уже внесённых не трогает.

УМО ✳ (22.11.2026): десяти первым — по три осмотра раз в 3 месяца с
**выдуманными** значениями около референсов (детерминированно по id), чтобы
вкладкам медкарты было что показать. Настоящих результатов здесь нет и быть не
должно — присланный шаблон с данными спортсменки в репозиторий не кладём.
Повторный запуск пересоздаёт показательные осмотры (пометка «[показ]» в
примечании)."""
import datetime

from django.core.management.base import BaseCommand
from django.db import transaction

import random

from national import umo
from national.models import NationalTeamMember, PlanItem, TrainingEvent, TrainingPlan, UmoExam, UmoValue
from rating.models import RatingProfile

TAG = "[показ] "
GROUPS = ["adult", "adult", "adult", "junior", "junior", "junior", "cadet", "cadet", "adult", "junior"]
WORK = ["Тест ОФП", "Видеоразбор соперников", "Подача: короткая в середину", "Скорость ног", "Приём подачи",
        "Контроль веса", "Игра с левшой", "Восстановление после старта"]


class Command(BaseCommand):
    help = "Показательные планы подготовки сборной для доски планов."

    def add_arguments(self, parser):
        parser.add_argument("--extra", type=int, default=30, help="сколько ещё спортсменов внести в состав без планов")

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
        extra = list(RatingProfile.objects.select_related("user").order_by("-value")[10:10 + opts["extra"]])
        added = 0
        for k, prof in enumerate(extra):
            age = today.year - prof.birth_year if prof.birth_year else 20
            group = "cadet" if age <= 15 else "junior" if age <= 18 else "adult"
            squad = "main" if k < len(extra) // 2 else "extended"
            _, made = NationalTeamMember.objects.get_or_create(user=prof.user, defaults={"age_group": group, "squad": squad})
            added += made
        UmoExam.objects.filter(note__startswith=TAG).delete()
        for prof in profiles:
            self.umo(NationalTeamMember.objects.get(user=prof.user), prof.sex or "", today)
        self.stdout.write("Показательные планы: %d спортсменов; в состав внесено ещё %d" % (len(profiles), added))

    TEXT = {
        "menstrual": "регулярный", "appetite": "нормальный", "ketones": "отрицательно", "rank": "МС",
        "results": "улучшается", "tolerance": "хорошая", "recovery": "своевременное", "sleep": "нормальный",
        "pain": "нет", "posture": "без особенностей", "ecg_rhythm": "синусовый", "ecg_axis": "нормальное положение",
        "echo_conclusion": "без структурных изменений", "urine_protein": "отрицательно", "urine_glucose": "отрицательно",
        "urine_rbc": "отрицательно", "urine_wbc": "отрицательно", "visus_od": "1,0", "visus_os": "1,0",
    }
    PLAIN = {"weight": (55, 80), "sessions": (8, 12), "session_hours": (2, 3), "hr_rest": (50, 72), "bp_sys": (100, 125),
             "bp_dia": (60, 80), "ecg_hr_min": (45, 60), "ecg_hr_max": (65, 85), "echo_vmax": (1.1, 1.5), "echo_pg": (5, 9)}

    def umo(self, member, sex, today):
        """Три выдуманных осмотра: база полгода назад, потом через 3 месяца."""
        rnd = random.Random(str(member.pk))
        base = {}
        height = rnd.randint(158, 186)
        for n in range(3):
            exam = UmoExam.objects.create(
                member=member, date=today - datetime.timedelta(days=182 - 91 * n), height_cm=height,
                stage=["подготовительный", "УТС", "соревновательный"][n], note=TAG + "выдуманные значения для показа",
            )
            for code, p in umo.P.items():
                if p.calc is not None or (p.female_only and sex != "f"):
                    continue
                if p.kind == umo.TEXT:
                    if code in self.TEXT:
                        UmoValue.objects.create(exam=exam, code=code, value=self.TEXT[code])
                    continue
                lo, hi = p.ref
                if code in self.PLAIN:
                    lo, hi = self.PLAIN[code]
                if lo is None and hi is None:
                    continue
                lo = lo if lo is not None else hi * 0.6
                hi = hi if hi is not None else lo * 1.6
                if code not in base:
                    base[code] = rnd.uniform(lo, hi)
                # дрейф от осмотра к осмотру; изредка — выход за референс
                value = base[code] * (1 + rnd.uniform(-0.08, 0.08) * n) * (1.25 if rnd.random() < 0.04 else 1)
                if code in ("sessions", "session_hours", "hr_rest", "bp_sys", "bp_dia", "ecg_hr_min", "ecg_hr_max"):
                    digits = 0
                elif hi - lo < 0.5:
                    digits = 3  # плотность мочи, моноциты
                else:
                    digits = 0 if hi >= 100 else 1 if hi >= 10 else 2
                UmoValue.objects.create(exam=exam, code=code, value=str(round(value, digits)))
