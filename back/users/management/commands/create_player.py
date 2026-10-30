"""Завести спортсмена с входом по почте и паролю ✳ (28.10.2026).

Кабинет роли пока пустой. Общая часть — `_role_account.py`.

Запуск:
  python manage.py create_player --email ... --name "Фамилия Имя" --password ...
"""
from users.models import Role

from ._role_account import RoleAccountCommand


class Command(RoleAccountCommand):
    help = "Завести спортсмена (вход по почте и паролю)"
    kind = Role.KIND_PLAYER
