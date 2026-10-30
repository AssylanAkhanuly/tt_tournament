# Игровые дни расписания ✳ (30.10.2026): у каждого дня своя дата и свои часы
# вместо одного «начала и конца дня» на весь турнир.

from django.db import migrations, models
from django.utils import timezone


def to_days(apps, schema_editor):
    """У построенных расписаний дни — даты их матчей с прежними часами."""
    Tournament = apps.get_model('tournaments', 'Tournament')
    GroupMatch = apps.get_model('tournaments', 'GroupMatch')
    for t in Tournament.objects.exclude(schedule_status='none'):
        dates = sorted(
            {
                timezone.localdate(at)
                for at in GroupMatch.objects.filter(group__tournament=t, scheduled_at__isnull=False).values_list(
                    'scheduled_at', flat=True
                )
            }
        )
        t.schedule_days = [
            {
                'date': d.isoformat(),
                'start': t.schedule_day_start.strftime('%H:%M'),
                'end': t.schedule_day_end.strftime('%H:%M'),
            }
            for d in dates
        ]
        t.save(update_fields=['schedule_days'])


class Migration(migrations.Migration):

    dependencies = [
        ('tournaments', '0023_schedule'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournament',
            name='schedule_days',
            field=models.JSONField(blank=True, default=list, verbose_name='Игровые дни'),
        ),
        migrations.RunPython(to_days, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name='tournament',
            name='schedule_day_end',
        ),
        migrations.RemoveField(
            model_name='tournament',
            name='schedule_day_start',
        ),
    ]
