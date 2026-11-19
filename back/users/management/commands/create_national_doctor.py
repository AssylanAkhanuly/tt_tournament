"""Завести врача сборной (роль 21) с входом по почте и паролю ✳ (19.11.2026).
По ROLES.md аккаунт и роль заводит администратор федерации — пока экрана
выдачи ролей нет, это делает команда. Общая часть — `_role_account.py`.

Запуск:
  python manage.py create_national_doctor --email ... --name "Фамилия Имя" --password ...
"""
from users.models import Role

from ._role_account import RoleAccountCommand


class Command(RoleAccountCommand):
    help = "Завести врача сборной (вход по почте и паролю)"
    kind = Role.KIND_NATIONAL_DOCTOR
