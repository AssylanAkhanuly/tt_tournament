"""Завести администратора клуба с входом по почте и паролю ✳ (19.11.2026).

Роль 13 (ROLES.md): кабинет `/club`, заявка команды клуба в Евразийскую лигу
и её состав (LEAGUE.md «Заявка клуба»). Клуб — по названию; нет такого —
заводится. Членство в клубе — `clubs.ClubAdmin`, роль — пропуск в кабинет.
Общая часть — `_role_account.py`.

Запуск:
  python manage.py create_club_admin --email ... --name "Фамилия Имя" --password ... --club "Название клуба"
"""
from clubs.models import Club, ClubAdmin
from users.models import Role

from ._role_account import RoleAccountCommand


class Command(RoleAccountCommand):
    help = "Завести администратора клуба (вход по почте и паролю)"
    kind = Role.KIND_CLUB_ADMIN

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument("--club", required=True, help="Название клуба; нет такого — заведётся")

    def handle(self, *args, **options):
        self._club_name = options["club"].strip()
        super().handle(*args, **options)

    def extra(self, user) -> None:
        club, created = Club.objects.get_or_create(name=self._club_name, defaults={"created_by": user})
        ClubAdmin.objects.get_or_create(club=club, user=user)
        self.stdout.write(("Заведён клуб: " if created else "Клуб: ") + club.name)
