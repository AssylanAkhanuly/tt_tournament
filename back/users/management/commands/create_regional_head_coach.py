"""Завести старшего тренера региона с входом по почте и паролю ✳ (19.11.2026).

Роль с областью «регион»: тренер заявляет на главные старты спортсменов своего
региона (`tournaments/admission/`, ADMISSION.md). Регион — из закреплённого
списка (`rating/regions.py`). Общая часть — `_role_account.py`.

Запуск:
  python manage.py create_regional_head_coach --email ... --name "Фамилия Имя" --password ... --region "Алматы"
"""
from django.core.management.base import CommandError

from rating import regions
from users.models import Role

from ._role_account import RoleAccountCommand


class Command(RoleAccountCommand):
    help = "Завести старшего тренера региона (вход по почте и паролю)"
    kind = Role.KIND_REGIONAL_HEAD_COACH

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument("--region", required=True, help="Регион из закреплённого списка")

    def scope(self, options) -> dict:
        region = (options["region"] or "").strip()
        if region not in regions.REGIONS:
            raise CommandError("Регион — из списка: %s" % ", ".join(regions.REGIONS))
        return {"scope": Role.SCOPE_REGION, "scope_id": None, "region": region}
