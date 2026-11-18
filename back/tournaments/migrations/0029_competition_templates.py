"""Виды соревнований календаря ФНТ РК ✳ (19.11.2026, ТЗ §4.1; ADMISSION.md).

Значения засева — наши, подлежат утверждению федерацией:
- главный старт: заявку подаёт только старший тренер региона (ТЗ §8.2 — это
  документ); квота 3 от региона — наше значение, в ТЗ это пример («например, не
  больше трёх»), у каждого старта она своя по положению;
- Евразийская лига: командная, заявителя (клуба) и командной ветки пока нет —
  такой турнир не заводится (QUESTIONS 11.x);
- открытый: спортсмен подаёт сам (ТЗ §8.2).
Дальше виды правит администратор федерации в админке.
"""
from django.db import migrations

TEMPLATES = [
    dict(code="main_start", name="Главный республиканский старт", category="main", is_team=False,
         applicant_kinds=["regional_head_coach"], region_quota=3, order=1),
    dict(code="eurasian_league", name="Евразийская лига", category="league", is_team=True,
         applicant_kinds=[], region_quota=None, order=2),
    dict(code="open", name="Открытый республиканский", category="open", is_team=False,
         applicant_kinds=["self"], region_quota=None, order=3),
]


def seed(apps, schema_editor):
    Template = apps.get_model("tournaments", "TournamentTemplate")
    for row in TEMPLATES:
        Template.objects.update_or_create(code=row["code"], defaults=row)


def unseed(apps, schema_editor):
    apps.get_model("tournaments", "TournamentTemplate").objects.filter(
        code__in=[r["code"] for r in TEMPLATES]
    ).delete()


class Migration(migrations.Migration):
    dependencies = [("tournaments", "0028_admission")]
    operations = [migrations.RunPython(seed, unseed)]
