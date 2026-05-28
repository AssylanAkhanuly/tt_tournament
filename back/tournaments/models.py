import uuid
from django.conf import settings
from django.db import models


class Tournament(models.Model):
    STATUS_OPEN = "open"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_FINISHED = "finished"
    STATUS_CHOICES = [
        (STATUS_OPEN, "Открыт"),
        (STATUS_IN_PROGRESS, "В процессе"),
        (STATUS_FINISHED, "Завершён"),
    ]

    FORMAT_SINGLE = "single_elimination"
    FORMAT_GROUP  = "group_playoff"
    FORMAT_CHOICES = [
        (FORMAT_SINGLE, "Олимпийская система"),
        (FORMAT_GROUP,  "Групповой этап + плей-офф"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    club = models.ForeignKey(
        'clubs.Club',
        on_delete=models.CASCADE,
        related_name='tournaments',
        null=True, blank=True,
        verbose_name="Клуб",
    )
    name = models.CharField(max_length=200, verbose_name="Название")
    description = models.TextField(blank=True, verbose_name="Описание")
    join_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tournaments_created",
        verbose_name="Создатель",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    starts_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата начала")
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_OPEN,
        verbose_name="Статус",
    )
    format = models.CharField(
        max_length=30,
        choices=FORMAT_CHOICES,
        default=FORMAT_SINGLE,
        verbose_name="Формат",
    )
    group_size = models.PositiveIntegerField(default=4, verbose_name="Игроков в группе")

    class Meta:
        verbose_name = "Турнир"
        verbose_name_plural = "Турниры"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="participants",
        verbose_name="Турнир",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tournament_participations",
        verbose_name="Участник",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Участник"
        verbose_name_plural = "Участники"
        unique_together = ("tournament", "user")

    def __str__(self):
        return f"{self.user} → {self.tournament}"


class TournamentTable(models.Model):
    """Tables specific to a tournament — pre-populated from ClubTable, editable per-tournament."""
    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name='tables',
        verbose_name="Турнир",
    )
    number = models.PositiveIntegerField(verbose_name="Номер")
    name   = models.CharField(max_length=100, blank=True, verbose_name="Название")
    is_active = models.BooleanField(default=True, verbose_name="Активен")

    class Meta:
        verbose_name = "Стол"
        verbose_name_plural = "Столы"
        unique_together = ('tournament', 'number')
        ordering = ['number']

    def __str__(self):
        return f"{self.display_name} — {self.tournament}"

    @property
    def display_name(self):
        return self.name or f"Стол {self.number}"


class Match(models.Model):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"
    STATUS_CHOICES = [
        (PENDING, "Ожидание"),
        (IN_PROGRESS, "Идёт"),
        (FINISHED, "Завершён"),
    ]

    tournament = models.ForeignKey(
        Tournament,
        on_delete=models.CASCADE,
        related_name="matches",
        verbose_name="Турнир",
    )
    round_number = models.PositiveIntegerField(verbose_name="Раунд")
    match_number = models.PositiveIntegerField(verbose_name="Номер матча")
    player1 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="matches_as_player1",
        verbose_name="Игрок 1",
    )
    player2 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="matches_as_player2",
        verbose_name="Игрок 2",
    )
    score1 = models.PositiveIntegerField(null=True, blank=True, verbose_name="Счёт игрока 1")
    score2 = models.PositiveIntegerField(null=True, blank=True, verbose_name="Счёт игрока 2")
    winner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="matches_won",
        verbose_name="Победитель",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING,
        verbose_name="Статус",
    )
    table_number = models.PositiveIntegerField(null=True, blank=True, verbose_name="Стол")
    winner_next = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='+', verbose_name="Следующий матч победителя"
    )
    winner_next_slot = models.PositiveSmallIntegerField(null=True, blank=True)
    loser_next = models.ForeignKey(
        'self', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='+', verbose_name="Следующий матч проигравшего"
    )
    loser_next_slot = models.PositiveSmallIntegerField(null=True, blank=True)
    is_consolation = models.BooleanField(default=False, verbose_name="Утешительный")

    class Meta:
        verbose_name = "Матч"
        verbose_name_plural = "Матчи"
        ordering = ["round_number", "match_number"]
        unique_together = ("tournament", "round_number", "match_number")

    def __str__(self):
        return f"Раунд {self.round_number}, матч {self.match_number} ({self.tournament})"


class TournamentGroup(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='groups')
    name = models.CharField(max_length=10)   # "A", "B", "C"
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']
        unique_together = ('tournament', 'name')

    def __str__(self):
        return f"Группа {self.name} ({self.tournament})"


class GroupParticipant(models.Model):
    group = models.ForeignKey(TournamentGroup, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_participations')
    points = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    diff = models.IntegerField(default=0)   # score difference

    class Meta:
        unique_together = ('group', 'user')
        ordering = ['-points', '-wins', '-diff']

    def __str__(self):
        return f"{self.user} в группе {self.group.name}"


class GroupMatch(models.Model):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"
    STATUS_CHOICES = [
        (PENDING, "Ожидание"),
        (IN_PROGRESS, "Идёт"),
        (FINISHED, "Завершён"),
    ]

    group = models.ForeignKey(TournamentGroup, on_delete=models.CASCADE, related_name='matches')
    match_number = models.PositiveIntegerField()
    player1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gm_p1')
    player2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gm_p2')
    score1 = models.IntegerField(null=True, blank=True)
    score2 = models.IntegerField(null=True, blank=True)
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='gm_won')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    table_number = models.PositiveIntegerField(null=True, blank=True, verbose_name="Стол")

    class Meta:
        ordering = ['match_number']
        unique_together = ('group', 'match_number')

    def __str__(self):
        return f"Группа {self.group.name}, матч {self.match_number}"
