"""Проверка ролей для ручек API.

Роль — связка «пользователь → роль → область» (ТЗ §2, `ROLE` в
`diagrams/domain.d2`), а не флажок на пользователе. Ручка спрашивает не «кто
это», а «есть ли у него такая роль»: добавить следующую роль — это новая строка
в `Role.KIND_CHOICES` и новый класс здесь, а не правка всех ручек.
"""
from rest_framework.permissions import BasePermission

from .models import Role


def has_role(user, kind: str) -> bool:
    """Есть ли у пользователя действующая роль этого вида."""
    if not user or not user.is_authenticated:
        return False
    return user.roles.filter(kind=kind).exists()


class IsGskChairman(BasePermission):
    """Председатель Главной судейской коллегии.

    По Положению о Национальном рейтинге он ведёт базу и историю рейтинга и
    отвечает за достоверность результатов (п. 8.3, 22) — отсюда и право править
    рейтинговые данные: коэффициенты, неявки, исправления.
    """

    message = "Действие доступно только председателю Главной судейской коллегии."

    def has_permission(self, request, view):
        return has_role(request.user, Role.KIND_GSK_CHAIRMAN)
