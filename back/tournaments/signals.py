"""Связки, которых не выражает внешний ключ.

Роль с областью «турнир» (`users.Role`, `scope="tournament"`) ссылается на
турнир по `scope_id`: область бывает и клубом, и столом, поэтому внешнего ключа
нет. Значит удаление турнира само роли не уносит — без этого у людей копились
должности несуществующих турниров ✳ (28.10.2026, нашла сквозная проверка
профиля). `post_delete` срабатывает и при удалении запросом
(`QuerySet.delete()`), как сносит турниры засев.
"""
from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Tournament


@receiver(post_delete, sender=Tournament)
def drop_tournament_roles(sender, instance, **kwargs):
    from users.models import Role

    Role.objects.filter(scope="tournament", scope_id=instance.id).delete()
