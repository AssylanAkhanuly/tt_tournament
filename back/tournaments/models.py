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
    # Absent / no-show: their matches are excluded from RTTF rating and score 0
    # group points; their unplayed group matches are auto-forfeited.
    is_absent = models.BooleanField(default=False, verbose_name="Отсутствует")
    # RTTF rating snapshot, set when the tournament finishes.
    rating_before = models.IntegerField(null=True, blank=True, verbose_name="Рейтинг до")
    rating_change = models.IntegerField(null=True, blank=True, verbose_name="Изменение рейтинга")

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
    # Walkover: opponent advanced because this player was absent (no real game).
    # Excluded from RTTF rating; reverted if the absent flag is cleared.
    is_walkover = models.BooleanField(default=False, verbose_name="Неявка")
    # The range of final places this match's participants can finish in
    # (e.g. 3..16 for an early consolation match, 3..4 for the bronze final).
    # Set only for all-places playoff brackets; null for single-elimination.
    place_lo = models.PositiveIntegerField(null=True, blank=True, verbose_name="Место от")
    place_hi = models.PositiveIntegerField(null=True, blank=True, verbose_name="Место до")

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
    # Stable seed position within the group (snake-seed order), used to keep the
    # table rows fixed while the computed place changes with results.
    seed = models.PositiveIntegerField(default=0, verbose_name="Посев")
    points = models.IntegerField(default=0)
    wins = models.IntegerField(default=0)
    losses = models.IntegerField(default=0)
    diff = models.IntegerField(default=0)   # score difference

    class Meta:
        unique_together = ('group', 'user')
        # Default ordering is by standings — reused for playoff seeding (A1, B1…).
        # The API serializes rows in `seed` order separately for the UI.
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
    # Walkover: auto-recorded when an opponent is marked absent. Reverted to
    # pending if the absent flag is cleared.
    is_walkover = models.BooleanField(default=False, verbose_name="Неявка")

    class Meta:
        ordering = ['match_number']
        unique_together = ('group', 'match_number')

    def __str__(self):
        return f"Группа {self.group.name}, матч {self.match_number}"


class ScoreLog(models.Model):
    """Audit trail of who entered/changed a match score and when. Display fields
    are denormalized so the log stays a stable historical record."""
    ACTION_SCORE = "score"
    ACTION_RESET = "reset"

    tournament      = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name="score_logs")
    entered_by      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+")
    entered_by_name = models.CharField(max_length=150, blank=True)
    kind            = models.CharField(max_length=12)            # "bracket" | "group"
    match_label     = models.CharField(max_length=80, blank=True)
    player1_name    = models.CharField(max_length=150, blank=True)
    player2_name    = models.CharField(max_length=150, blank=True)
    score1          = models.IntegerField(null=True, blank=True)
    score2          = models.IntegerField(null=True, blank=True)
    winner_name     = models.CharField(max_length=150, blank=True)
    action          = models.CharField(max_length=12, default=ACTION_SCORE)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.entered_by_name}: {self.player1_name} {self.score1}:{self.score2} {self.player2_name}"
