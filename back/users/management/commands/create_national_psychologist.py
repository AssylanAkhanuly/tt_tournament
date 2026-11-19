"""Завести роль «психолог сборной» с входом по почте и паролю ✳ (19.11.2026,
NATIONAL.md). Общая часть — `_role_account.py`.

Запуск:
  python manage.py create_national_psychologist --email ... --name "Фамилия Имя" --password ...
"""
from users.models import Role

from ._role_account import RoleAccountCommand


class Command(RoleAccountCommand):
    help = "Завести: психолог сборной"
    kind = Role.KIND_NATIONAL_PSYCHOLOGIST
