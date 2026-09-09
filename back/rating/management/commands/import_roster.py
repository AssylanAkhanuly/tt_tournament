"""Загрузка состава сборной РК в рейтинговые карточки.

Что грузим. Присланный федерацией список — это СОСТАВ, а не рейтинг-лист: в нём
нет ни рейтинговых значений, ни матчей. Есть спортивное звание, регион, пол и
год рождения. Значит перенос по п. 6.3 («прежний рейтинг переносится один к
одному») выполнить не из чего, и остаётся единственная опора шкалы — таблица
п. 6, где заданы ровно две точки: КМС = 40,00 и МС = 50,00.

Всем остальным званиям значения в Положении НЕТ, поэтому они входят новыми
спортсменами со старта 1,00 (п. 6.1) — и это не наш выбор, а следствие
документа. Насколько это ломает картину, видно сразу после загрузки.

Исходник обезличен: ИИН в файле нет. Пол и год рождения выведены из него на
машине, где лежит оригинал (`docs/refs/private/`), и в репозиторий не попали —
репозиторий публичный, а в списке есть несовершеннолетние.

Запуск: `python manage.py import_roster --reset`
"""
import json
import os

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from rating import engine
from rating.models import RatingProfile
from rating.services import get_or_create_profile
from users.models import User

ПРЕФИКС = "+7798000"
ФАЙЛ = os.path.join(settings.BASE_DIR, "..", "docs", "refs", "sostav-sbornoy-rk-2026.json")


class Command(BaseCommand):
    help = "Загрузить состав сборной РК в рейтинговые карточки"

    def add_arguments(self, parser):
        parser.add_argument("--file", default=ФАЙЛ, help="Обезличенный состав в JSON")
        parser.add_argument("--reset", action="store_true", help="Снести прежнюю загрузку")

    @transaction.atomic
    def handle(self, *args, **options):
        with open(options["file"], encoding="utf-8") as f:
            roster = json.load(f)

        if options["reset"]:
            User.objects.filter(phone__startswith=ПРЕФИКС).delete()

        без_старта = []
        for row in roster:
            фио = " ".join(x for x in (row["surname"], row["name"], row["patronymic"]) if x)
            телефон = ПРЕФИКС + "%03d" % row["n"]
            user, _ = User.objects.get_or_create(phone=телефон, defaults={"name": фио})
            if RatingProfile.objects.filter(user=user).exists():
                continue

            общее = {"region": row["region"], "sex": row["sex"], "birth_year": row["birth_year"]}
            if row["start"] is not None:
                get_or_create_profile(
                    user, origin=engine.ORIGIN_LEGACY, legacy=row["start"], **общее
                )
            else:
                # Звания нет в таблице п. 6 — значит и значения нет. Человек
                # входит новым со старта 1,00 (п. 6.1).
                get_or_create_profile(user, origin=engine.ORIGIN_NEW, **общее)
                без_старта.append((фио, row["title"], row["place"]))

        всего = RatingProfile.objects.filter(user__phone__startswith=ПРЕФИКС).count()
        self.stdout.write("Загружено карточек: %d" % всего)
        self.stdout.write(
            "Со стартом по п. 6 (МС или КМС): %d" % (всего - len(без_старта))
        )
        self.stdout.write(self.style.WARNING(
            "Без опоры в Положении — вошли с 1,00: %d" % len(без_старта)
        ))
        for фио, звание, место in без_старта:
            self.stdout.write("  %-34s %-20s чемпионат РК: %d место" % (фио, звание, место))
