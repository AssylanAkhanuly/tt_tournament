"""Завести главного тренера национальной команды (роль 11) с входом по почте и
паролю ✳ (19.11.2026). Общая часть — `_role_account.py`.

Запуск:
  python manage.py create_national_head_coach --email ... --name "Фамилия Имя" --password ...
"""
from users.models import Role

from ._role_account import RoleAccountCommand


class Command(RoleAccountCommand):
    help = "Завести главного тренера национальной команды (вход по почте и паролю)"
    kind = Role.KIND_NATIONAL_HEAD_COACH
