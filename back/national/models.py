"""Национальная команда ✳ (19.11.2026, NATIONAL.md; ROLES.md роли 11 и 21).

Состав сборной, медицинская карта члена сборной (ведёт врач сборной) и планы
подготовки (ведёт главный тренер). Член сборной — спортсмен с рейтинговой
карточкой: имя, регион и рейтинг берутся оттуда, здесь не дублируются.
"""
import uuid

from django.conf import settings
from django.db import models


class NationalTeamMember(models.Model):
    SQUAD_MAIN = "main"
    SQUAD_EXTENDED = "extended"
    SQUAD_CHOICES = [(SQUAD_MAIN, "Основной"), (SQUAD_EXTENDED, "Расширенный")]

    # Возрастные группы сборной — те же, что у тренеров сборной (роль 20):
    # кадеты, юноши, взрослые (совещание 04.11.2026).
    AGE_CADET = "cadet"
    AGE_JUNIOR = "junior"
    AGE_ADULT = "adult"
    AGE_CHOICES = [(AGE_CADET, "Кадеты"), (AGE_JUNIOR, "Юноши"), (AGE_ADULT, "Взрослые")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="national_membership",
        verbose_name="Спортсмен",
    )
    squad = models.CharField(max_length=16, choices=SQUAD_CHOICES, default=SQUAD_MAIN, verbose_name="Состав")
    age_group = models.CharField(max_length=16, choices=AGE_CHOICES, default=AGE_ADULT, verbose_name="Возрастная группа")
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Член сборной"
        verbose_name_plural = "Состав сборной"
        ordering = ["user__name"]

    def __str__(self):
        return self.user.name


class MedicalRecord(models.Model):
    """Строка медицинской карты. Допуск — строка вида `clearance` со сроком
    `until`; действует последний по дате. Ограничение нагрузки — `load_limit`
    у травмы, болезни или постоянного ограничения, снимается датой `until`
    (пусто — бессрочно)."""

    KIND_CLEARANCE = "clearance"
    KIND_UMO = "umo"
    KIND_ILLNESS = "illness"
    KIND_INJURY = "injury"
    KIND_RESTRICTION = "restriction"
    KIND_CHOICES = [
        (KIND_CLEARANCE, "Медицинский допуск"),
        (KIND_UMO, "УМО"),
        (KIND_ILLNESS, "Болезнь"),
        (KIND_INJURY, "Травма"),
        (KIND_RESTRICTION, "Постоянное ограничение"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(NationalTeamMember, on_delete=models.CASCADE, related_name="medical_records")
    kind = models.CharField(max_length=16, choices=KIND_CHOICES, verbose_name="Запись")
    date = models.DateField(verbose_name="Дата")
    title = models.CharField(max_length=200, blank=True, verbose_name="Заключение / диагноз")
    note = models.TextField(blank=True, verbose_name="Подробно")
    load_limit = models.CharField(max_length=200, blank=True, verbose_name="Ограничение нагрузки")
    until = models.DateField(null=True, blank=True, verbose_name="Действует до")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Запись медкарты"
        verbose_name_plural = "Медицинская карта"
        ordering = ["-date", "-created_at"]


class TrainingPlan(models.Model):
    """План подготовки члена сборной на период."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(NationalTeamMember, on_delete=models.CASCADE, related_name="plans")
    starts_on = models.DateField(verbose_name="С")
    ends_on = models.DateField(verbose_name="По")
    goal = models.CharField(max_length=300, blank=True, verbose_name="Цель периода")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "План подготовки"
        verbose_name_plural = "Планы подготовки"
        ordering = ["-starts_on"]


class PlanItem(models.Model):
    KIND_WORK = "work"
    KIND_CAMP = "camp"
    KIND_START = "start"
    KIND_CHOICES = [(KIND_WORK, "Работа"), (KIND_CAMP, "Сбор"), (KIND_START, "Старт")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(TrainingPlan, on_delete=models.CASCADE, related_name="items")
    kind = models.CharField(max_length=8, choices=KIND_CHOICES, default=KIND_WORK, verbose_name="Тип")
    title = models.CharField(max_length=300, verbose_name="Что делаем")
    due = models.DateField(null=True, blank=True, verbose_name="Срок")
    done = models.BooleanField(default=False, verbose_name="Выполнено")
    done_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Пункт плана"
        verbose_name_plural = "Пункты плана"
        ordering = ["due", "created_at"]
