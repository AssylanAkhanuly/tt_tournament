"""Пересчёт статусов активности спортсменов (п. 18 Положения).

24 месяца без рейтинговых матчей — «неактивен», рейтинг сохраняется и
исключается из текущей таблицы; 60 месяцев — аннулирование отдельной строкой
журнала. Команда идемпотентна: гоняется хоть каждый день.

Запуск: `python manage.py refresh_activity`
"""
from django.core.management.base import BaseCommand

from rating.services import refresh_activity


class Command(BaseCommand):
    help = "Пересчитать статусы активности рейтинговых карточек (п. 18)"

    def handle(self, *args, **options):
        counts = refresh_activity()
        for status, n in counts.items():
            self.stdout.write("%s: %d" % (status, n))
        self.stdout.write(self.style.SUCCESS("Статусы пересчитаны"))
