from django.db import migrations, models


def fill_region(apps, schema_editor):
    """Регион уже записанных турниров — по городу из справочника; город вне
    справочника остаётся строкой, как был."""
    from tournaments import places

    Tournament = apps.get_model("tournaments", "Tournament")
    for t in Tournament.objects.exclude(city=""):
        place = places.clean("", t.city)
        if place:
            t.region = place[0]
            t.save(update_fields=["region"])


class Migration(migrations.Migration):

    dependencies = [
        ("tournaments", "0024_schedule_days"),
    ]

    operations = [
        migrations.AddField(
            model_name="tournament",
            name="region",
            field=models.CharField(blank=True, max_length=120, verbose_name="Регион"),
        ),
        migrations.RunPython(fill_region, migrations.RunPython.noop),
    ]
