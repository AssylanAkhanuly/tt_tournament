"""Хранилище Национального рейтинга.

Три вещи: настраиваемые коэффициенты, рейтинговая карточка спортсмена (п. 19
Положения) и журнал изменений (п. 20). Считает не эта модель — расчёт в
`engine.py`, сборка в `services.py`.
"""
from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from . import engine

LEVEL_CHOICES = [(code, engine.LEVEL_LABELS[code]) for code in engine.LEVELS]


class RatingParams(models.Model):
    """Коэффициенты расчёта — их вводит федерация, а не программист.

    Шесть значений Положение называет, но не задаёт (D, оба K, потолок
    изменения, Rmax и k перевода из ITTF), и до калибровки они будут меняться.
    Поэтому набор живёт в базе и правится через API, а не константами в коде.

    Версионирования по дате вступления в силу нет — решение владельца продукта
    (10.09.2026). Смысл прошлых начислений это не ломает: каждая строка журнала
    хранит применённые именно к ней D, K, C и P (см. RatingEntry), поэтому
    правка коэффициентов не переписывает историю задним числом, что и запрещают
    п. 24.3–24.4.
    """

    name = models.CharField(max_length=120, default="Действующий набор", verbose_name="Название")
    is_active = models.BooleanField(default=True, verbose_name="Действующий")

    # ⚠ Значения не заданы Положением — наши, подлежат калибровке.
    d = models.DecimalField(
        max_digits=6, decimal_places=2, default=15,
        verbose_name="D — масштаб шкалы (п. 9.4)",
    )
    k_standard = models.DecimalField(
        max_digits=6, decimal_places=3, default=0.6,
        verbose_name="K стандартный, с 21-го матча (п. 11.4)",
    )
    k_transition = models.DecimalField(
        max_digits=6, decimal_places=3, default=3,
        verbose_name="K переходного периода (п. 11.2)",
    )
    max_delta = models.DecimalField(
        max_digits=6, decimal_places=2, default=1,
        verbose_name="Потолок изменения за матч, 0 — без потолка (п. 12.1)",
    )
    cap_in_transition = models.BooleanField(
        default=False, verbose_name="Резать потолком и переходный период",
    )
    ittf_r_max = models.DecimalField(
        max_digits=6, decimal_places=2, default=90,
        verbose_name="Rmax перевода из ITTF (п. 17.4)",
    )
    ittf_k = models.DecimalField(
        max_digits=6, decimal_places=2, default=10,
        verbose_name="k перевода из ITTF (п. 17.4)",
    )

    # Задано Положением — правится только вместе с документом.
    transition_matches = models.PositiveIntegerField(
        default=20, verbose_name="Длина переходного периода, матчей (п. 11.2–11.3)",
    )
    c_top = models.DecimalField(max_digits=4, decimal_places=2, default=1.2, verbose_name="C · высшие (п. 13)")
    c_republic = models.DecimalField(max_digits=4, decimal_places=2, default=1.0, verbose_name="C · республиканские")
    c_region = models.DecimalField(max_digits=4, decimal_places=2, default=0.8, verbose_name="C · областные")
    c_amateur = models.DecimalField(max_digits=4, decimal_places=2, default=0.6, verbose_name="C · любительские")
    p_first = models.DecimalField(max_digits=4, decimal_places=2, default=1.2, verbose_name="P · 1 место (п. 10.3)")
    p_second = models.DecimalField(max_digits=4, decimal_places=2, default=1.15, verbose_name="P · 2 место")
    p_third = models.DecimalField(max_digits=4, decimal_places=2, default=1.1, verbose_name="P · 3 место")
    min_rating = models.DecimalField(
        max_digits=6, decimal_places=2, default=0, verbose_name="Нижняя граница (п. 15.15)",
    )

    # Прочтения, по которым нужно решение федерации (QUESTIONS 5.8, 5.10).
    prize_mode = models.CharField(
        max_length=16,
        default=engine.PRIZE_MATCH,
        choices=[
            (engine.PRIZE_MATCH, "P в формуле каждого матча (п. 9.2)"),
            (engine.PRIZE_TOURNAMENT, "P к итогу турнира (п. 10.6)"),
            (engine.PRIZE_NONE, "Без коэффициента места"),
        ],
        verbose_name="Как применяется коэффициент места",
    )
    baseline = models.CharField(
        max_length=16,
        default=engine.BASELINE_SEQUENTIAL,
        choices=[
            (engine.BASELINE_SEQUENTIAL, "Поматчево — как в примере п. 20"),
            (engine.BASELINE_PRE_TOURNAMENT, "От рейтинга до турнира — как в п. 8.1"),
        ],
        verbose_name="База расчёта внутри турнира",
    )

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_params_edits",
    )

    class Meta:
        verbose_name = "Коэффициенты рейтинга"
        verbose_name_plural = "Коэффициенты рейтинга"

    def __str__(self) -> str:
        return "%s%s" % (self.name, " (действующий)" if self.is_active else "")

    @classmethod
    def active(cls) -> "RatingParams":
        """Действующий набор; заводится со значениями по умолчанию, если его нет."""
        obj = cls.objects.filter(is_active=True).order_by("-updated_at").first()
        return obj or cls.objects.create()

    def to_engine(self) -> engine.Params:
        """Набор из базы → параметры движка. Единственное место перевода."""
        f = float
        return engine.Params(
            d=f(self.d),
            k_standard=f(self.k_standard),
            k_transition=f(self.k_transition),
            transition_matches=self.transition_matches,
            max_delta=f(self.max_delta),
            cap_in_transition=self.cap_in_transition,
            level_c={
                engine.LEVEL_TOP: f(self.c_top),
                engine.LEVEL_REPUBLIC: f(self.c_republic),
                engine.LEVEL_REGION: f(self.c_region),
                engine.LEVEL_AMATEUR: f(self.c_amateur),
            },
            prize_p={1: f(self.p_first), 2: f(self.p_second), 3: f(self.p_third)},
            prize_mode=self.prize_mode,
            baseline=self.baseline,
            min_rating=f(self.min_rating),
            ittf_r_max=f(self.ittf_r_max),
            ittf_k=f(self.ittf_k),
        )


class RatingProfile(models.Model):
    """Рейтинговая карточка спортсмена — поля из таблицы п. 19 Положения.

    ФИО и контакты живут в `users.User`; здесь — то, что относится к рейтингу:
    значение, происхождение, счётчики и статус активности. Значение живое:
    посчитали — сразу действует (решение владельца продукта, 10.09.2026);
    отдельного «опубликованного» слоя из п. 1.2 нет, публикация остаётся датой
    последнего обновления.
    """

    ORIGIN_CHOICES = [
        (engine.ORIGIN_NEW, "Новый спортсмен (п. 6.1)"),
        (engine.ORIGIN_LEGACY, "Перенос прежнего (п. 6.3)"),
        (engine.ORIGIN_ITTF, "Из позиции ITTF (п. 17)"),
    ]
    STATUS_CHOICES = [
        (engine.STATUS_NO_MATCHES, "Нет матчей"),
        (engine.STATUS_ACTIVE, "Активен"),
        (engine.STATUS_INACTIVE, "Неактивен"),
        (engine.STATUS_VOID, "Рейтинг аннулирован"),
    ]
    SEX_CHOICES = [("m", "Мужской"), ("f", "Женский")]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rating_profile",
    )
    value = models.DecimalField(
        max_digits=6, decimal_places=2, default=1,
        validators=[MinValueValidator(0)], verbose_name="Текущий рейтинг",
    )
    origin = models.CharField(
        max_length=10, choices=ORIGIN_CHOICES, default=engine.ORIGIN_NEW,
        verbose_name="Происхождение стартового значения",
    )
    start_value = models.DecimalField(
        max_digits=6, decimal_places=2, default=1, verbose_name="Стартовое значение",
    )
    ittf_position = models.PositiveIntegerField(
        null=True, blank=True, verbose_name="Позиция в ITTF World Ranking",
    )

    matches_played = models.PositiveIntegerField(default=0, verbose_name="Рейтинговых матчей")
    wins = models.PositiveIntegerField(default=0, verbose_name="Побед")
    losses = models.PositiveIntegerField(default=0, verbose_name="Поражений")
    no_shows = models.PositiveIntegerField(default=0, verbose_name="Подтверждённых неявок")

    last_match_at = models.DateField(null=True, blank=True, verbose_name="Последний рейтинговый матч")
    status = models.CharField(
        max_length=12, choices=STATUS_CHOICES, default=engine.STATUS_NO_MATCHES,
        verbose_name="Статус",
    )

    # Нужны выборкам рейтинг-листа: пол, возрастная категория, регион (п. 7.2, 19).
    sex = models.CharField(max_length=1, choices=SEX_CHOICES, blank=True, verbose_name="Пол")
    birth_year = models.PositiveIntegerField(null=True, blank=True, verbose_name="Год рождения")
    region = models.CharField(max_length=120, blank=True, verbose_name="Регион")

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Рейтинговая карточка"
        verbose_name_plural = "Рейтинговые карточки"
        ordering = ["-value"]
        indexes = [
            models.Index(fields=["-value"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self) -> str:
        return "%s — %s" % (self.user, self.value)

    @property
    def age_category(self):
        """Возрастная выборка (п. 7.2–7.4): не отдельный рейтинг, а срез общего."""
        from datetime import date

        if not self.birth_year:
            return None
        return engine.age_category(date.today().year, self.birth_year)

    def transition_left(self, params: RatingParams) -> int:
        """Сколько матчей переходного периода осталось (п. 11.3)."""
        if self.origin != engine.ORIGIN_NEW:
            return 0
        return max(0, params.transition_matches - self.matches_played)


class RatingEntry(models.Model):
    """Строка рейтинговой истории — таблица п. 20 Положения.

    Хранит не только «до / изменение / после», но и слагаемые (E, K, C, P):
    п. 4.6 требует, чтобы каждое изменение было связано с конкретным матчем и
    объяснимо. Это же делает историю независимой от текущих коэффициентов —
    правка настроек не меняет смысла прошлых начислений (п. 24.3–24.4).

    Записи не удаляются (п. 21.6): возврат протокола на доработку помечает их
    `is_reverted`, а не стирает.
    """

    KIND_MATCH = "match"
    KIND_NO_SHOW = "no_show"
    KIND_PRIZE = "prize"
    KIND_CORRECTION = "correction"
    KIND_START = "start"
    KIND_VOID = "void"
    KIND_CHOICES = [
        (KIND_MATCH, "Матч"),
        (KIND_NO_SHOW, "Неявка без уважительной причины (п. 15.4–15.6)"),
        (KIND_PRIZE, "Надбавка за призовое место (п. 10.6)"),
        (KIND_CORRECTION, "Исправление (п. 21.5–21.6)"),
        (KIND_START, "Стартовое значение (п. 6, 17)"),
        (KIND_VOID, "Аннулирование за неактивность (п. 18.4)"),
    ]

    profile = models.ForeignKey(RatingProfile, on_delete=models.CASCADE, related_name="entries")
    kind = models.CharField(max_length=12, choices=KIND_CHOICES, default=KIND_MATCH)
    occurred_at = models.DateField(verbose_name="Дата")

    tournament = models.ForeignKey(
        "tournaments.Tournament", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_entries",
    )
    # Матч бывает сеточный и групповой — это две разные модели прототипа.
    match = models.ForeignKey(
        "tournaments.Match", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_entries",
    )
    group_match = models.ForeignKey(
        "tournaments.GroupMatch", null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_entries",
    )
    opponent = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_entries_as_opponent",
    )
    score = models.CharField(max_length=12, blank=True, verbose_name="Счёт")
    won = models.BooleanField(null=True, blank=True)

    before = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Рейтинг до")
    delta = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Изменение")
    after = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Рейтинг после")

    # Применённые к этой строке коэффициенты — из чего сложилось изменение.
    expected = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True, verbose_name="E")
    d = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, verbose_name="D")
    k = models.DecimalField(max_digits=6, decimal_places=3, null=True, blank=True, verbose_name="K")
    c = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, verbose_name="C")
    p = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True, verbose_name="P")
    capped = models.BooleanField(default=False, verbose_name="Обрезано потолком (п. 12.1)")
    transition = models.BooleanField(default=False, verbose_name="Переходный период (п. 11.2)")

    reason = models.TextField(blank=True, verbose_name="Основание")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_entries_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    is_reverted = models.BooleanField(default=False, verbose_name="Отменена")
    reverted_at = models.DateTimeField(null=True, blank=True)
    reverted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_entries_reverted",
    )

    class Meta:
        verbose_name = "Строка рейтинговой истории"
        verbose_name_plural = "Рейтинговая история"
        ordering = ["-occurred_at", "-created_at"]
        indexes = [
            models.Index(fields=["profile", "-occurred_at"]),
            models.Index(fields=["tournament"]),
        ]

    def __str__(self) -> str:
        return "%s %s%s" % (self.occurred_at, "+" if self.delta >= 0 else "", self.delta)


class RatingEdition(models.Model):
    """Выпуск рейтинговой таблицы — п. 8.2: «обновляется и публикуется
    еженедельно».

    Выпуск — снимок на момент публикации: живая карточка дальше меняется, а
    выпуск нет. Иначе не от чего считать срок апелляции (п. 21.2 — 5 рабочих
    дней с официального опубликования), и спор шёл бы о числе, которое успело
    пересчитаться. Прежнее решение «значение живое, публикация — дата пересчёта»
    (10.09.2026) заменено выпусками ✳ (11.09.2026, карта функций рейтинга).
    """

    number = models.PositiveIntegerField(unique=True, verbose_name="Номер выпуска")
    published_at = models.DateTimeField(verbose_name="Опубликован")
    published_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_editions",
    )
    appeal_until = models.DateField(verbose_name="Приём апелляций до (п. 21.2)")

    class Meta:
        verbose_name = "Выпуск рейтинга"
        verbose_name_plural = "Выпуски рейтинга"
        ordering = ["-number"]

    def __str__(self) -> str:
        return "Выпуск №%s" % self.number


class RatingEditionRow(models.Model):
    """Строка выпуска: значение и место спортсмена на дату публикации.

    Поля выборок (пол, год рождения, регион) копируются сюда же: лист прошлого
    выпуска фильтруется так же, как живой, и не должен меняться от того, что
    спортсмен потом сменил регион (п. 5.4 — на рейтинг это и так не влияет).
    """

    edition = models.ForeignKey(RatingEdition, on_delete=models.CASCADE, related_name="rows")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rating_edition_rows",
    )
    # Неактивные хранятся, но места в текущей таблице у них нет (п. 18.2).
    place = models.PositiveIntegerField(null=True, blank=True, verbose_name="Место")
    value = models.DecimalField(max_digits=6, decimal_places=2, verbose_name="Рейтинг")
    matches_played = models.PositiveIntegerField(default=0)
    wins = models.PositiveIntegerField(default=0)
    losses = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=12, choices=RatingProfile.STATUS_CHOICES)
    sex = models.CharField(max_length=1, choices=RatingProfile.SEX_CHOICES, blank=True)
    birth_year = models.PositiveIntegerField(null=True, blank=True)
    region = models.CharField(max_length=120, blank=True)

    class Meta:
        verbose_name = "Строка выпуска"
        verbose_name_plural = "Строки выпуска"
        unique_together = ("edition", "user")
        ordering = ["edition", "place"]

    @property
    def age_category(self):
        from datetime import date

        if not self.birth_year:
            return None
        return engine.age_category(date.today().year, self.birth_year)


class RatingAppeal(models.Model):
    """Апелляция на рейтинг (п. 21.1–21.4) ✳ (11.09.2026).

    Подаётся в письменной форме в адрес Федерации (п. 21.2), поэтому в системе
    её регистрирует председатель ГСК — с тем, что требует п. 21.2: кто подал,
    что обжалуется, обстоятельства, требование, документы. Обжалуется всегда
    конкретный выпуск: от его даты считается срок подачи.

    Решение окончательное. Удовлетворённая апелляция исправляет значение
    отдельной строкой журнала (`correction`) — выпуск при этом не меняется,
    подача не приостанавливает опубликованный рейтинг (п. 21.2), изменение
    уходит в следующий выпуск (п. 21.4).
    """

    STATUS_PENDING = "pending"
    STATUS_UPHELD = "upheld"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Ждёт решения"),
        (STATUS_UPHELD, "Удовлетворена"),
        (STATUS_REJECTED, "Отклонена"),
    ]

    edition = models.ForeignKey(RatingEdition, on_delete=models.CASCADE, related_name="appeals")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rating_appeals",
    )
    applicant = models.CharField(max_length=120, blank=True, verbose_name="Кто подал (п. 21.1)")
    subject = models.TextField(verbose_name="Обжалуемое значение или действие")
    circumstances = models.TextField(blank=True, verbose_name="Обстоятельства")
    demand = models.TextField(verbose_name="Требование")
    documents = models.TextField(blank=True, verbose_name="Документы")

    received_at = models.DateField(verbose_name="Получена")
    review_until = models.DateField(verbose_name="Рассмотреть до (п. 21.3)")

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)
    decision = models.TextField(blank=True, verbose_name="Решение")
    decided_at = models.DateTimeField(null=True, blank=True)
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_appeals_decided",
    )
    correction = models.ForeignKey(
        RatingEntry, null=True, blank=True, on_delete=models.SET_NULL, related_name="appeals",
    )
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="rating_appeals_registered",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Апелляция"
        verbose_name_plural = "Апелляции"
        ordering = ["-received_at", "-id"]

    def __str__(self) -> str:
        return "Апелляция №%s — %s" % (self.pk, self.user)
