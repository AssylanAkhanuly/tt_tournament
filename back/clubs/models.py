from uuid import uuid4
from django.db import models
from django.conf import settings


class Club(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    photo       = models.ImageField(upload_to="club_photos/", null=True, blank=True)
    created_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='created_clubs',
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    def is_admin(self, user):
        """Check if user can administrate this club (staff or explicit ClubAdmin)."""
        if not user or not user.is_authenticated:
            return False
        if user.is_staff:
            return True
        return self.admin_memberships.filter(user=user).exists()


class ClubAdmin(models.Model):
    """Users who can administer a specific club."""
    club     = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='admin_memberships')
    user     = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='club_admin_roles')
    added_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='+',
    )

    class Meta:
        unique_together = ('club', 'user')

    def __str__(self):
        return f"{self.user} → {self.club}"


class ClubTable(models.Model):
    """A physical table in a club."""
    club      = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='tables')
    number    = models.PositiveIntegerField()
    name      = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('club', 'number')
        ordering        = ['number']

    def __str__(self):
        return f"{self.club.name} – {self.display_name}"

    @property
    def display_name(self):
        return self.name if self.name else f"Стол {self.number}"
