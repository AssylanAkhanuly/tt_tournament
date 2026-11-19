"""Сезон Лиги ✳ (19.11.2026, LEAGUE.md «Сезон»): `LeagueDivision.season` из
числа-года становится ссылкой на `LeagueSeason`. Существующие дивизионы
получают сезон своего года («Сезон 2026»), регистрация у таких сезонов
закрыта — открыть её решает администратор."""
import uuid

import django.db.models.deletion
from django.db import migrations, models


def to_seasons(apps, schema_editor):
    Season = apps.get_model("league", "LeagueSeason")
    Division = apps.get_model("league", "LeagueDivision")
    by_year = {}
    for d in Division.objects.all():
        if d.season_year not in by_year:
            by_year[d.season_year] = Season.objects.create(year=d.season_year, name="Сезон %d" % d.season_year)
        d.season = by_year[d.season_year]
        d.save(update_fields=["season"])


def to_years(apps, schema_editor):
    Division = apps.get_model("league", "LeagueDivision")
    for d in Division.objects.select_related("season"):
        d.season_year = d.season.year
        d.save(update_fields=["season_year"])


class Migration(migrations.Migration):
    dependencies = [("league", "0001_initial")]

    operations = [
        migrations.CreateModel(
            name="LeagueSeason",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("year", models.PositiveSmallIntegerField(verbose_name="Год")),
                ("name", models.CharField(max_length=80, verbose_name="Название")),
                ("registration_open", models.BooleanField(default=False, verbose_name="Регистрация команд открыта")),
                ("registration_until", models.DateField(blank=True, null=True, verbose_name="Регистрация до (включительно)")),
                ("closed", models.BooleanField(default=False, verbose_name="Сезон завершён")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"verbose_name": "Сезон", "verbose_name_plural": "Сезоны", "ordering": ["-year", "-created_at"]},
        ),
        migrations.AlterUniqueTogether(name="leaguedivision", unique_together=set()),
        migrations.RenameField(model_name="leaguedivision", old_name="season", new_name="season_year"),
        migrations.AddField(
            model_name="leaguedivision",
            name="season",
            field=models.ForeignKey(
                null=True, on_delete=django.db.models.deletion.PROTECT, related_name="divisions",
                to="league.leagueseason", verbose_name="Сезон",
            ),
        ),
        migrations.RunPython(to_seasons, to_years),
        migrations.RemoveField(model_name="leaguedivision", name="season_year"),
        migrations.AlterField(
            model_name="leaguedivision",
            name="season",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT, related_name="divisions",
                to="league.leagueseason", verbose_name="Сезон",
            ),
        ),
        migrations.AlterModelOptions(
            name="leaguedivision",
            options={"ordering": ["-season__year", "gender", "level"], "verbose_name": "Дивизион", "verbose_name_plural": "Дивизионы"},
        ),
        migrations.AlterUniqueTogether(name="leaguedivision", unique_together={("season", "gender", "level")}),
    ]
