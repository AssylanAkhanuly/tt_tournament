"""Завести роль «тренер сборной возрастной группы» с входом по почте и паролю ✳ (19.11.2026,
NATIONAL.md). Общая часть — `_role_account.py`.

Запуск:
  python manage.py create_national_team_coach --email ... --name "Фамилия Имя" --password ... --age-group cadet|junior|adult
"""
from users.models import Role

from ._role_account import RoleAccountCommand


class Command(RoleAccountCommand):
    help = "Завести: тренер сборной возрастной группы"
    kind = Role.KIND_NATIONAL_TEAM_COACH

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument("--age-group", required=True, choices=[c for c, _ in Role.AGE_GROUP_CHOICES])

    def scope(self, options) -> dict:
        return {"scope": Role.SCOPE_SYSTEM, "scope_id": None, "age_group": options["age_group"]}
