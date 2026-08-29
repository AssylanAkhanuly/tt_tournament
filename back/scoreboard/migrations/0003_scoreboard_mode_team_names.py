# Разряд встречи стал явным полем: его выбирают таббаром на пульте.
# Раньше пара угадывалась по заполненному второму имени, а командная встреча
# держалась флагом `team_enabled` — два разных способа сказать одно и то же.
# Здесь они сводятся в одно поле `mode`, и заводятся названия команд для
# верхней строки плашки.

from django.db import migrations, models


def set_mode(apps, schema_editor):
    """Существующие доски переносим по тому, чем они были на самом деле:
    включённый командный счёт → командная, заполненное второе имя → парная."""
    Scoreboard = apps.get_model("scoreboard", "Scoreboard")
    Scoreboard.objects.filter(team_enabled=True).update(mode="team")
    Scoreboard.objects.filter(team_enabled=False).exclude(
        left_name2="", right_name2=""
    ).update(mode="doubles")


def unset_mode(apps, schema_editor):
    """Назад: командные доски снова помечаем флагом, остальное выводится из имён."""
    Scoreboard = apps.get_model("scoreboard", "Scoreboard")
    Scoreboard.objects.filter(mode="team").update(team_enabled=True)


class Migration(migrations.Migration):

    dependencies = [
        ('scoreboard', '0002_scoreboard_first_server_scoreboard_left_card_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='scoreboard',
            name='mode',
            field=models.CharField(choices=[('single', 'Одиночный'), ('doubles', 'Парный'), ('team', 'Командный')], default='single', max_length=8),
        ),
        migrations.AddField(
            model_name='scoreboard',
            name='team_left_name',
            field=models.CharField(blank=True, default='', max_length=24),
        ),
        migrations.AddField(
            model_name='scoreboard',
            name='team_right_name',
            field=models.CharField(blank=True, default='', max_length=24),
        ),
        migrations.RunPython(set_mode, unset_mode),
        migrations.RemoveField(
            model_name='scoreboard',
            name='team_enabled',
        ),
    ]
