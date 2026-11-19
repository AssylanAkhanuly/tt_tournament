"""Евразийская лига ✳ (19.11.2026, ТЗ §4.10; LEAGUE.md) — командная ветка:
участник не игрок, а команда клуба. Дивизион → команды с составом на сезон →
туры → командные встречи. Счёт встречи — производная от личных встреч, их
порядок и правила — в `LeagueRules` (настройка, не константа кода).

Сущности — по `diagrams/domain.d2` (LEAGUE_DIVISION, LEAGUE_TOUR, TEAM,
TEAM_MEMBER, TEAM_MATCH). Отступление от схемы: личные встречи внутри
командной хранятся списком счетов в самой встрече (`rubbers`), а не строками
MATCH — пока они не идут в личный рейтинг, отдельные матчи не нужны.
"""
import uuid

from django.conf import settings
from django.db import models

from . import engine


class LeagueRules(models.Model):
    """Правила лиги — одна строка ✳. Значения по умолчанию — допущения ТЗ
    §4.10 (система Свейтлинга, международная практика), подлежат утверждению
    федерацией (QUESTIONS 11.1–11.4). Правит председатель ГСК."""

    order = models.CharField(max_length=80, default="A-X,B-Y,C-Z,A-Y,B-X", verbose_name="Порядок личных встреч")
    players = models.PositiveSmallIntegerField(default=3, verbose_name="Игроков от команды на встречу")
    wins_needed = models.PositiveSmallIntegerField(default=3, verbose_name="Побед до победы во встрече")
    games_to_win = models.PositiveSmallIntegerField(default=3, verbose_name="Партий до победы в личной встрече")
    points_win = models.PositiveSmallIntegerField(default=2, verbose_name="Очки за победу")
    points_loss = models.PositiveSmallIntegerField(default=1, verbose_name="Очки за поражение")
    points_no_show = models.PositiveSmallIntegerField(default=0, verbose_name="Очки за неявку")
    promote = models.PositiveSmallIntegerField(default=2, verbose_name="Вверх по итогам сезона")
    relegate = models.PositiveSmallIntegerField(default=2, verbose_name="Вниз по итогам сезона")
    squad_max = models.PositiveSmallIntegerField(default=8, verbose_name="Состав на сезон, не больше")

    class Meta:
        verbose_name = "Правила лиги"
        verbose_name_plural = "Правила лиги"

    @classmethod
    def active(cls) -> "LeagueRules":
        return cls.objects.get_or_create(pk=1)[0]

    def to_rules(self) -> engine.Rules:
        return engine.Rules(
            order=self.order, players=self.players, wins_needed=self.wins_needed, games_to_win=self.games_to_win,
            points_win=self.points_win, points_loss=self.points_loss, points_no_show=self.points_no_show,
            promote=self.promote, relegate=self.relegate, squad_max=self.squad_max,
        )


class LeagueSeason(models.Model):
    """Сезон — верхний уровень Лиги ✳ (19.11.2026, LEAGUE.md «Сезон»): год,
    название, окно регистрации команд и признак «завершён». Лиги, команды и
    туры живут внутри сезона. Год не уникален: сезон узнаётся по id."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    year = models.PositiveSmallIntegerField(verbose_name="Год")
    name = models.CharField(max_length=80, verbose_name="Название")
    registration_open = models.BooleanField(default=False, verbose_name="Регистрация команд открыта")
    registration_until = models.DateField(null=True, blank=True, verbose_name="Регистрация до (включительно)")
    closed = models.BooleanField(default=False, verbose_name="Сезон завершён")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Сезон"
        verbose_name_plural = "Сезоны"
        ordering = ["-year", "-created_at"]

    def __str__(self):
        return self.name

    def registration_active(self, today=None) -> bool:
        """Регистрация идёт: окно открыто, сезон не завершён, срок не прошёл —
        то же правило, что у приёма заявок турнира (`tournaments.models._active`)."""
        if self.closed or not self.registration_open:
            return False
        if self.registration_until is None:
            return True
        from django.utils import timezone

        return (today or timezone.localdate()) <= self.registration_until


class LeagueDivision(models.Model):
    """Дивизион (лига) сезона: Суперлига (уровень 1), 2–6 лиги у мужчин,
    Суперлига и 2 лига у женщин (ТЗ §4.1). Розыгрыши мужчин и женщин раздельные."""

    GENDER_CHOICES = [("m", "Мужчины"), ("f", "Женщины")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    season = models.ForeignKey(LeagueSeason, on_delete=models.PROTECT, related_name="divisions", verbose_name="Сезон")
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, verbose_name="Розыгрыш")
    name = models.CharField(max_length=80, verbose_name="Название")
    level = models.PositiveSmallIntegerField(verbose_name="Уровень (1 — Суперлига)")

    class Meta:
        verbose_name = "Дивизион"
        verbose_name_plural = "Дивизионы"
        ordering = ["-season__year", "gender", "level"]
        unique_together = ("season", "gender", "level")

    def __str__(self):
        return "%s %s, %s" % (self.name, self.get_gender_display().lower(), self.season.year)


class Team(models.Model):
    """Команда клуба в дивизионе сезона — она же заявка клуба ✳ (19.11.2026,
    LEAGUE.md «Заявка клуба»). Заявляет администратор клуба (ТЗ §2, §8.2) — тогда
    «ждёт решения», пока федерация не примет или не отклонит (отказ — с
    комментарием); внесённая администратором федерации или председателем ГСК —
    сразу «принята». В туры и таблицу идут только принятые."""

    STATUS_SUBMITTED = "submitted"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"
    STATUS_CHOICES = [(STATUS_SUBMITTED, "Ждёт решения"), (STATUS_ACCEPTED, "Принята"), (STATUS_REJECTED, "Отклонена")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    division = models.ForeignKey(LeagueDivision, on_delete=models.CASCADE, related_name="teams", verbose_name="Дивизион")
    club = models.ForeignKey("clubs.Club", on_delete=models.PROTECT, related_name="league_teams", verbose_name="Клуб")
    name = models.CharField(max_length=120, verbose_name="Название")
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL, related_name="+", verbose_name="Кто заявил"
    )
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_ACCEPTED, verbose_name="Заявка")
    decision_comment = models.TextField(blank=True, verbose_name="Комментарий решения")
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+", verbose_name="Кто решил"
    )
    decided_at = models.DateTimeField(null=True, blank=True, verbose_name="Когда решено")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Команда"
        verbose_name_plural = "Команды"
        ordering = ["created_at"]
        unique_together = ("division", "name")

    def __str__(self):
        return self.name


class TeamMember(models.Model):
    """Игрок состава на сезон ✳ (ТЗ §4.10: до 8, за сезон — одна команда).
    Состав на конкретный тур — расстановка самой встречи (`TeamMatch.lineup_*`)."""

    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="members", verbose_name="Команда")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="league_memberships")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Игрок состава"
        verbose_name_plural = "Состав"
        unique_together = ("team", "user")
        ordering = ["id"]


class LeagueTour(models.Model):
    """Тур дивизиона: 1–4 за сезон. При заведении получает встречи по круговой."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    division = models.ForeignKey(LeagueDivision, on_delete=models.CASCADE, related_name="tours", verbose_name="Дивизион")
    number = models.PositiveSmallIntegerField(verbose_name="Номер тура")
    city = models.CharField(max_length=120, blank=True, verbose_name="Город")
    starts_on = models.DateField(null=True, blank=True, verbose_name="Дата")

    class Meta:
        verbose_name = "Тур"
        verbose_name_plural = "Туры"
        ordering = ["number"]
        unique_together = ("division", "number")


class TeamMatch(models.Model):
    """Командная встреча. Счёт — производная от личных встреч (`rubbers`,
    по порядку `LeagueRules.order`), `rubbers_a/b` и `winner` — их итог,
    записанный движком. Неявка — техническое поражение (`no_show`)."""

    STATUS_CHOICES = [("pending", "Ожидает"), ("finished", "Завершена")]
    SIDE_CHOICES = [("", "—"), ("a", "Команда A"), ("b", "Команда B")]

    tour = models.ForeignKey(LeagueTour, on_delete=models.CASCADE, related_name="matches", verbose_name="Тур")
    team_a = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="+", verbose_name="Команда A")
    team_b = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="+", verbose_name="Команда B")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    lineup_a = models.JSONField(default=list, blank=True, verbose_name="Расстановка A (id игроков)")
    lineup_b = models.JSONField(default=list, blank=True, verbose_name="Расстановка B (id игроков)")
    rubbers = models.JSONField(default=list, blank=True, verbose_name="Личные встречи [[a, b], …]")
    no_show = models.CharField(max_length=1, choices=SIDE_CHOICES, blank=True, default="")
    rubbers_a = models.PositiveSmallIntegerField(default=0)
    rubbers_b = models.PositiveSmallIntegerField(default=0)
    winner = models.CharField(max_length=1, choices=SIDE_CHOICES, blank=True, default="")
    entered_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    entered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Командная встреча"
        verbose_name_plural = "Командные встречи"
        ordering = ["id"]
