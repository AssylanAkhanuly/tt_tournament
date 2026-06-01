from django.conf import settings
from django.db import models


class Notification(models.Model):
    """An in-app notification for a user. Match-ready alerts denormalize the
    match reference (kind + id) so a single row covers both bracket Match and
    group GroupMatch without a polymorphic FK."""

    TYPE_MATCH_READY = "match_ready"
    TYPE_SCORE_PROPOSED = "score_proposed"
    TYPE_SCORE_REJECTED = "score_rejected"
    TYPE_CHOICES = [
        (TYPE_MATCH_READY, "Матч готов"),
        (TYPE_SCORE_PROPOSED, "Подтвердите счёт"),
        (TYPE_SCORE_REJECTED, "Счёт отклонён"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    type = models.CharField(max_length=32, choices=TYPE_CHOICES, default=TYPE_MATCH_READY)
    title = models.CharField(max_length=200)
    body = models.CharField(max_length=400, blank=True)

    tournament = models.ForeignKey(
        "tournaments.Tournament",
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name="notifications",
    )
    match_kind = models.CharField(max_length=10, blank=True)   # 'bracket' | 'group'
    match_id = models.IntegerField(null=True, blank=True)
    table_number = models.IntegerField(null=True, blank=True)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"]),
        ]

    def __str__(self):
        return f"{self.title} → {self.user}"


class PushSubscription(models.Model):
    """A Web Push (VAPID) browser subscription for a user's device."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="push_subscriptions",
    )
    endpoint = models.URLField(max_length=600, unique=True)
    p256dh = models.CharField(max_length=200)
    auth = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"push:{self.user} {self.endpoint[:40]}"
