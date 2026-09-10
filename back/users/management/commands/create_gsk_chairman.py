"""Завести председателя ГСК с входом по почте и паролю.

Экрана выдачи ролей пока нет, поэтому первого председателя заводит команда.
Если пользователь с такой почтой уже есть, ему выдаётся роль и, если передан,
меняется пароль.

Вход по паролю — временный ✳ (10.09.2026): по ТЗ §2 личность подтверждает
Smart Bridge по ИИН, и паролей система не хранит. Пока Smart Bridge не
подключён, председателю ГСК нужен способ войти.

Запуск:
  python manage.py create_gsk_chairman --email gsk@example.kz --name "Фамилия Имя" --password ...
"""
import uuid

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from users.models import Role, User


class Command(BaseCommand):
    help = "Завести председателя ГСК (вход по почте и паролю)"

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--name", required=True)
        parser.add_argument("--password", required=False)
        parser.add_argument(
            "--phone",
            required=False,
            help="Телефон. Без него ставится служебный — вход всё равно по почте",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user is None:
            if not options["password"]:
                raise CommandError("Новому пользователю нужен пароль: --password")
            # Телефон в модели обязателен и уникален. Председатель входит по
            # почте, поэтому без явного номера ставится служебная метка.
            phone = options["phone"] or "gsk-" + uuid.uuid4().hex[:8]
            user = User.objects.create_user(phone=phone, name=options["name"],
                                            password=options["password"])
            user.email = email
            user.save(update_fields=["email"])
            self.stdout.write("Заведён пользователь: %s <%s>" % (user.name, email))
        elif options["password"]:
            user.set_password(options["password"])
            user.save(update_fields=["password"])
            self.stdout.write("Пароль обновлён: %s <%s>" % (user.name, email))

        _, created = Role.objects.get_or_create(
            user=user, kind=Role.KIND_GSK_CHAIRMAN, scope=Role.SCOPE_SYSTEM, scope_id=None
        )
        self.stdout.write(self.style.SUCCESS(
            ("Роль выдана" if created else "Роль уже была") + ": председатель ГСК"
        ))
