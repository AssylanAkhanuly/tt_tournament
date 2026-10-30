"""Общая часть команд, заводящих учётку с ролью и входом по почте и паролю.

Экрана выдачи ролей пока нет, поэтому учётки с ролью заводят команды. Команда
конкретной роли задаёт только `kind` и, если нужно, донастраивает пользователя
в `extra()`.

Вход по паролю — временный ✳ (10.09.2026): по ТЗ §2 личность подтверждает
Smart Bridge по ИИН, и паролей система не хранит. Пока Smart Bridge не
подключён, ролям с рабочим местом на вебе нужен способ войти.
"""
import uuid

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from users.models import Role, User


class RoleAccountCommand(BaseCommand):
    kind: str = ""  # Role.KIND_*

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True)
        parser.add_argument("--name", required=True)
        parser.add_argument("--password", required=False)
        parser.add_argument(
            "--phone",
            required=False,
            help="Телефон. Без него ставится служебный — вход всё равно по почте",
        )

    def extra(self, user: User) -> None:
        """Донастроить пользователя сверх роли. По умолчанию — ничего."""

    @transaction.atomic
    def handle(self, *args, **options):
        email = options["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user is None:
            if not options["password"]:
                raise CommandError("Новому пользователю нужен пароль: --password")
            # Телефон в модели обязателен и уникален. Входят по почте, поэтому
            # без явного номера ставится служебная метка.
            phone = options["phone"] or "%s-%s" % (self.kind[:5], uuid.uuid4().hex[:8])
            user = User.objects.create_user(phone=phone, name=options["name"],
                                            password=options["password"])
            user.email = email
            user.save(update_fields=["email"])
            self.stdout.write("Заведён пользователь: %s <%s>" % (user.name, email))
        elif options["password"]:
            user.set_password(options["password"])
            user.save(update_fields=["password"])
            self.stdout.write("Пароль обновлён: %s <%s>" % (user.name, email))

        role, created = Role.objects.get_or_create(
            user=user, kind=self.kind, scope=Role.SCOPE_SYSTEM, scope_id=None
        )
        self.extra(user)
        self.stdout.write(self.style.SUCCESS(
            ("Роль выдана" if created else "Роль уже была") + ": " + role.get_kind_display()
        ))
