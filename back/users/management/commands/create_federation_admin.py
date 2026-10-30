"""Завести администратора федерации (роль 1, ROLES.md) с входом по почте и паролю.

«Десктоп, правит всё». Кабинет роли — `/dashboard` на фронте, пока пустой:
состав разделов задаёт владелец продукта. До тех пор администратор проходит
всё, что проходит председатель ГСК (`users/permissions.py`), и получает
Django-админку (`is_staff` + `is_superuser`). Общая часть — `_role_account.py`.

Запуск:
  python manage.py create_federation_admin --email admin@example.kz --name "Фамилия Имя" --password ...
"""
from users.models import Role, User

from ._role_account import RoleAccountCommand


class Command(RoleAccountCommand):
    help = "Завести администратора федерации (вход по почте и паролю, Django-админка)"
    kind = Role.KIND_FEDERATION_ADMIN

    def extra(self, user: User) -> None:
        if not (user.is_staff and user.is_superuser):
            user.is_staff = user.is_superuser = True
            user.save(update_fields=["is_staff", "is_superuser"])
