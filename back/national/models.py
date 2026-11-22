"""Национальная команда ✳ (19.11.2026, NATIONAL.md; ROLES.md роли 11, 19–22).

Состав сборной с личными тренерами, медицинская карта (врач сборной),
спортивная карточка (психолог сборной), планы подготовки (составляет личный
тренер, согласует главный), календарь подготовки — сборы и целевые старты, и
рапорты на командирование с историей согласования. Член сборной — спортсмен с
рейтинговой карточкой: имя, регион и рейтинг берутся оттуда.
"""
import uuid

from django.conf import settings
from django.db import models

AGE_CHOICES = [("cadet", "Кадеты"), ("junior", "Юноши"), ("adult", "Взрослые")]


class NationalTeamMember(models.Model):
    SQUAD_MAIN = "main"
    SQUAD_EXTENDED = "extended"
    SQUAD_CHOICES = [(SQUAD_MAIN, "Основной"), (SQUAD_EXTENDED, "Расширенный")]

    # Возрастные группы сборной — те же, что у тренеров сборной (роль 20):
    # кадеты, юноши, взрослые (совещание 04.11.2026).
    AGE_CADET = "cadet"
    AGE_JUNIOR = "junior"
    AGE_ADULT = "adult"
    AGE_CHOICES = AGE_CHOICES

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="national_membership",
        verbose_name="Спортсмен",
    )
    squad = models.CharField(max_length=16, choices=SQUAD_CHOICES, default=SQUAD_MAIN, verbose_name="Состав")
    age_group = models.CharField(max_length=16, choices=AGE_CHOICES, default=AGE_ADULT, verbose_name="Возрастная группа")
    # Личный тренер — из учёток с ролью `personal_coach` (совещание 04.11.2026:
    # «федерация вручную отмечает личного тренера и прикрепляет спортсменов»).
    personal_coach = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="coached_national_members", verbose_name="Личный тренер",
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
    )
    added_at = models.DateTimeField(auto_now_add=True)
    # Изображения карточки ✳ (22.11.2026, решение владельца продукта): аватар —
    # лицо; фигура — снимок по пояс (до бёдер) для баннера карточки и профиля.
    # Нет снимка — экран рисует сгенерированную заглушку своего пола.
    avatar = models.ImageField(upload_to="national/avatars/", blank=True, verbose_name="Аватар")
    figure = models.ImageField(upload_to="national/figures/", blank=True, verbose_name="Фигура для баннера")

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


class SportRecord(models.Model):
    """Строка спортивной карточки — её ведёт психолог сборной (роль 22,
    совещание 04.11.2026): комментарии и ход подготовки за год. Кто её читает,
    федерация не сказала (QUESTIONS 20.1) — пока только психологи ✳."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(NationalTeamMember, on_delete=models.CASCADE, related_name="sport_records")
    date = models.DateField(verbose_name="Дата")
    text = models.TextField(verbose_name="Запись")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Запись спортивной карточки"
        verbose_name_plural = "Спортивная карточка"
        ordering = ["-date", "-created_at"]


class TrainingEvent(models.Model):
    """Мероприятие календаря подготовки (флоу Э11.3): сбор (УТС) или целевой
    старт. Старт может ссылаться на турнир общего календаря федерации —
    календарь подготовки не второй календарь соревнований."""

    KIND_CAMP = "camp"
    KIND_START = "start"
    KIND_CHOICES = [(KIND_CAMP, "Сбор"), (KIND_START, "Старт")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    kind = models.CharField(max_length=8, choices=KIND_CHOICES, verbose_name="Вид")
    title = models.CharField(max_length=200, verbose_name="Название")
    city = models.CharField(max_length=120, blank=True, verbose_name="Где")
    starts_on = models.DateField(verbose_name="С")
    ends_on = models.DateField(verbose_name="По")
    # Пусто — для всей сборной.
    age_group = models.CharField(max_length=16, blank=True, choices=AGE_CHOICES, verbose_name="Возрастная группа")
    tournament = models.ForeignKey(
        "tournaments.Tournament", null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
        verbose_name="Турнир календаря",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Мероприятие подготовки"
        verbose_name_plural = "Календарь подготовки"
        ordering = ["starts_on"]


class TrainingPlan(models.Model):
    """План подготовки члена сборной на период. Составляет личный тренер,
    согласует главный тренер (или консультант) — совещание 04.11.2026."""

    STATUS_DRAFT = "draft"
    STATUS_SUBMITTED = "submitted"
    STATUS_APPROVED = "approved"
    STATUS_RETURNED = "returned"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Черновик"),
        (STATUS_SUBMITTED, "На согласовании"),
        (STATUS_APPROVED, "Согласован"),
        (STATUS_RETURNED, "Возвращён"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(NationalTeamMember, on_delete=models.CASCADE, related_name="plans")
    starts_on = models.DateField(verbose_name="С")
    ends_on = models.DateField(verbose_name="По")
    goal = models.CharField(max_length=300, blank=True, verbose_name="Цель периода")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_DRAFT, verbose_name="Согласование")
    review_comment = models.TextField(blank=True, verbose_name="Комментарий при возврате")
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
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
    # Начало работы ✳ (22.11.2026, решение владельца продукта: пункт на доске
    # растягивается по дням). Пусто — работа лежит на одном дне срока.
    starts_on = models.DateField(null=True, blank=True, verbose_name="Начало")
    # Сбор и старт не вводятся руками — берутся из календаря подготовки (Э11.5).
    event = models.ForeignKey(TrainingEvent, null=True, blank=True, on_delete=models.SET_NULL, related_name="plan_items")
    done = models.BooleanField(default=False, verbose_name="Выполнено")
    done_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Пункт плана"
        verbose_name_plural = "Пункты плана"
        ordering = ["due", "created_at"]


def report_file_path(instance, filename):
    return "national/reports/%s/%s" % (instance.id, filename)


class TravelReport(models.Model):
    """Рапорт на командирование (флоу Э11.4): по мероприятию календаря
    подготовки, на спортсменов одной возрастной группы, текстом или файлом.
    Пишут старшие тренеры регионов и тренерский штаб; решает главный тренер
    (или консультант): согласованный рапорт уходит в федерацию сам."""

    STATUS_SUBMITTED = "submitted"
    STATUS_RETURNED = "returned"
    STATUS_REJECTED = "rejected"
    STATUS_APPROVED = "approved"
    STATUS_CHOICES = [
        (STATUS_SUBMITTED, "Ждёт решения"),
        (STATUS_RETURNED, "На доработке"),
        (STATUS_REJECTED, "Отклонён"),
        (STATUS_APPROVED, "Согласован, ушёл в федерацию"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(TrainingEvent, on_delete=models.PROTECT, related_name="reports", verbose_name="Мероприятие")
    age_group = models.CharField(max_length=16, choices=AGE_CHOICES, verbose_name="Возрастная группа")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="travel_reports")
    athletes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="+", blank=True, verbose_name="Состав")
    text = models.TextField(blank=True, verbose_name="Текст рапорта")
    file = models.FileField(upload_to=report_file_path, null=True, blank=True, verbose_name="Файл рапорта")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=STATUS_SUBMITTED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Рапорт на командирование"
        verbose_name_plural = "Рапорты на командирование"
        ordering = ["-created_at"]


class ReportAction(models.Model):
    """История согласования рапорта: кто, что, когда и почему."""

    ACTION_SUBMITTED = "submitted"
    ACTION_RESUBMITTED = "resubmitted"
    ACTION_RETURNED = "returned"
    ACTION_REJECTED = "rejected"
    ACTION_APPROVED = "approved"
    ACTION_CHOICES = [
        (ACTION_SUBMITTED, "Подан"),
        (ACTION_RESUBMITTED, "Подан повторно"),
        (ACTION_RETURNED, "Возвращён на доработку"),
        (ACTION_REJECTED, "Отклонён"),
        (ACTION_APPROVED, "Согласован, ушёл в федерацию"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(TravelReport, on_delete=models.CASCADE, related_name="actions")
    action = models.CharField(max_length=16, choices=ACTION_CHOICES)
    by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+")
    comment = models.TextField(blank=True)
    at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["at"]


class UmoExam(models.Model):
    """Осмотр УМО ✳ (22.11.2026, NATIONAL.md «Медкарта: УМО»): дата и условия
    — сведения, от которых зависит сравнение заборов. Значения — `UmoValue`,
    параметры — каталог `national/umo.py`."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(NationalTeamMember, on_delete=models.CASCADE, related_name="umo_exams")
    date = models.DateField(verbose_name="Дата осмотра")
    height_cm = models.DecimalField(max_digits=5, decimal_places=1, null=True, blank=True, verbose_name="Рост, см")
    stage = models.CharField(max_length=200, blank=True, verbose_name="Этап подготовки")
    load_note = models.TextField(blank=True, verbose_name="Нагрузка за предшествующие 2 недели")
    illnesses = models.TextField(blank=True, verbose_name="Болезни и травмы за период")
    conditions = models.TextField(blank=True, verbose_name="Условия забора")
    supplements = models.TextField(blank=True, verbose_name="Добавки и препараты")
    note = models.TextField(blank=True, verbose_name="Врач, примечания")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["date", "created_at"]
        verbose_name = "Осмотр УМО"
        verbose_name_plural = "Осмотры УМО"


class UmoValue(models.Model):
    exam = models.ForeignKey(UmoExam, on_delete=models.CASCADE, related_name="values")
    code = models.CharField(max_length=40, verbose_name="Параметр")
    value = models.CharField(max_length=300, verbose_name="Значение")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["exam", "code"], name="umo_value_once")]
        verbose_name = "Значение УМО"
        verbose_name_plural = "Значения УМО"
