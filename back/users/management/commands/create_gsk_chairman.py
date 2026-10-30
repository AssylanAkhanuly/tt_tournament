"""Завести председателя ГСК с входом по почте и паролю.

Если пользователь с такой почтой уже есть, ему выдаётся роль и, если передан,
меняется пароль. Общая часть — `_role_account.py`.

Запуск:
  python manage.py create_gsk_chairman --email gsk@example.kz --name "Фамилия Имя" --password ...
"""
from users.models import Role

from ._role_account import RoleAccountCommand


class Command(RoleAccountCommand):
    help = "Завести председателя ГСК (вход по почте и паролю)"
    kind = Role.KIND_GSK_CHAIRMAN
