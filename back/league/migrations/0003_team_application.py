"""Заявка команды клубом ✳ (19.11.2026, LEAGUE.md «Заявка клуба»): состояние
заявки и решение федерации. Команды, заведённые до этого, — принятые (их вносила
федерация)."""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("league", "0002_leagueseason"),
    ]

    operations = [
        migrations.AddField(
            model_name="team",
            name="status",
            field=models.CharField(
                choices=[("submitted", "Ждёт решения"), ("accepted", "Принята"), ("rejected", "Отклонена")],
                default="accepted", max_length=12, verbose_name="Заявка",
            ),
        ),
        migrations.AddField(
            model_name="team", name="decision_comment",
            field=models.TextField(blank=True, verbose_name="Комментарий решения"),
        ),
        migrations.AddField(
            model_name="team", name="decided_by",
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="+",
                to=settings.AUTH_USER_MODEL, verbose_name="Кто решил",
            ),
        ),
        migrations.AddField(
            model_name="team", name="decided_at",
            field=models.DateTimeField(blank=True, null=True, verbose_name="Когда решено"),
        ),
    ]
