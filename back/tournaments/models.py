import uuid
from django.conf import settings
from django.db import models


class Tournament(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
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
