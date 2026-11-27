"""Состав турнира вручную ✳ (28.10.2026): спортсмены и судьи из существующих
учёток. Ручки (`views.py`) только принимают запрос и отдают ответ — правила
здесь.

Судья турнира — роль с областью «турнир» (`Role.scope = tournament`,
`scope_id` — турнир), как задумано моделью «пользователь → роль → область».
Должности — роли ТЗ §2 ✳ (28.10.2026, решение владельца продукта): главный
судья, заместитель главного судьи, главный секретарь — по одному на турнир,
судей стола (`referee`) — сколько угодно. У человека в турнире одна должность.
"""
from typing import Optional

from django.db.models import Q

from users.models import Role, User

from .models import Tournament, TournamentParticipant

LIMIT = 20  # строк в выдаче поиска — наше значение


# Должности по старшинству — в этом же порядке идёт список судей турнира.
POSITIONS = [
    Role.KIND_CHIEF_REFEREE,
    Role.KIND_DEPUTY_CHIEF_REFEREE,
    Role.KIND_CHIEF_SECRETARY,
    Role.KIND_REFEREE,
    # Врач соревнований ✳ (22.11.2026) — не судья, но назначается в турнир так
    # же и по одному; в заявках судей его нет (`recruitment`).
    Role.KIND_COMPETITION_DOCTOR,
]
# Судейские должности — без врача: на них подают заявку судьи (`recruitment`).
REFEREE_POSITIONS = [p for p in POSITIONS if p != Role.KIND_COMPETITION_DOCTOR]
# Должности, которые в турнире может занимать только один человек.
SINGLE = {Role.KIND_CHIEF_REFEREE, Role.KIND_DEPUTY_CHIEF_REFEREE, Role.KIND_CHIEF_SECRETARY, Role.KIND_COMPETITION_DOCTOR}


class RosterError(Exception):
    """Добавить нельзя; текст — для человека."""


def referees(tournament: Tournament):
    """Судьи турнира по старшинству должности, внутри — по имени."""
    roles = Role.objects.filter(kind__in=POSITIONS, scope="tournament", scope_id=tournament.id).select_related("user")
    return sorted(roles, key=lambda r: (POSITIONS.index(r.kind), r.user.name))


def candidates(tournament: Tournament, role: str, q: str = ""):
    """Учётки, которых в этом списке турнира ещё нет; поиск — по имени, почте,
    телефону."""
    if role == "referee":
        taken = [r.user_id for r in referees(tournament)]
    else:
        taken = tournament.participants.values_list("user_id", flat=True)
    qs = User.objects.filter(is_active=True).exclude(id__in=taken)
    q = q.strip()
    if q:
        qs = qs.filter(Q(name__icontains=q) | Q(email__icontains=q) | Q(phone__icontains=q))
    return qs.order_by("name")[:LIMIT]


def add_participant(tournament: Tournament, user: User) -> TournamentParticipant:
    # Те же границы, что у прежнего добавления по телефону: в завершённый турнир
    # и в идущую сетку плей-офф новых не берём. Расписание отправлено ✳
    # (30.10.2026) — тоже: группы и пары уже сложены.
    if tournament.schedule_status == "final":
        raise RosterError("Расписание отправлено — состав не меняется.")
    if tournament.status == Tournament.STATUS_FINISHED:
        raise RosterError("Турнир завершён — нельзя добавить спортсмена.")
    if tournament.status == Tournament.STATUS_IN_PROGRESS and tournament.matches.exists():
        raise RosterError("Плей-офф уже идёт — добавить спортсмена в готовую сетку нельзя.")
    if tournament.participants.filter(user=user).exists():
        raise RosterError("Спортсмен уже в турнире.")
    return TournamentParticipant.objects.create(tournament=tournament, user=user)


def add_referee(tournament: Tournament, user: User, position: str) -> Role:
    if position not in POSITIONS:
        raise RosterError("Неизвестная судейская должность.")
    current = referees(tournament)
    if any(r.user_id == user.id for r in current):
        raise RosterError("Этот человек уже в судейской коллегии турнира.")
    if position in SINGLE:
        holder = next((r for r in current if r.kind == position), None)
        if holder:
            raise RosterError(f"«{holder.get_kind_display()}» уже назначен: {holder.user.name}.")
    return Role.objects.create(user=user, kind=position, scope="tournament", scope_id=tournament.id)


def referee_role(tournament: Tournament, user_id) -> Optional[Role]:
    """Судейская должность человека в этом турнире; не судит здесь — `None`."""
    return next((r for r in referees(tournament) if str(r.user_id) == str(user_id)), None)


def other_tournaments(role: Role):
    """Другие турниры, где этот человек судит, — с его должностью там. Свежие
    сверху."""
    roles = Role.objects.filter(user_id=role.user_id, kind__in=POSITIONS, scope="tournament").exclude(
        scope_id=role.scope_id
    )
    by_id = {r.scope_id: r for r in roles}
    found = Tournament.objects.filter(id__in=by_id).order_by("-starts_at")
    return [(t, by_id[t.id]) for t in found]


def referee_profile(user) -> dict:
    """Профиль судьи ✳ (24.11.2026, решение владельца продукта: «профиль судьи —
    как у спортсмена»): все его должности в турнирах (свежие сверху), сколько
    матчей он отсудил судьёй стола (подтверждённых) и сколько раз был главным.
    Рейтинга судей в системе ещё нет (flows Э0.11) — здесь только факты."""
    from .models import GroupMatch

    roles = Role.objects.filter(user_id=user.id, kind__in=POSITIONS, scope="tournament")
    by_id = {r.scope_id: r for r in roles}
    found = list(Tournament.objects.filter(id__in=by_id).order_by("-starts_at"))
    matches = GroupMatch.objects.filter(referee_id=user.id, status=GroupMatch.FINISHED)
    per_tournament = {}
    for tid in matches.values_list("group__tournament_id", flat=True):
        per_tournament[tid] = per_tournament.get(tid, 0) + 1
    history = [
        {
            "tournament": {
                "id": str(t.id),
                "name": t.name,
                "starts_at": t.starts_at.isoformat() if t.starts_at else None,
                "ends_at": t.ends_at.isoformat() if t.ends_at else None,
                "status": t.status,
                "city": t.city,
            },
            "position": by_id[t.id].kind,
            "position_label": by_id[t.id].get_kind_display(),
            "matches": per_tournament.get(t.id, 0),
        }
        for t in found
    ]
    return {
        "user": {"id": str(user.id), "name": user.name, "email": user.email, "avatar": user.avatar.url if user.avatar else None},
        "is_referee": Role.objects.filter(user_id=user.id, kind=Role.KIND_REFEREE).exists() or bool(history),
        "tournaments": len(history),
        "as_chief": sum(1 for h in history if h["position"] == Role.KIND_CHIEF_REFEREE),
        "matches": sum(per_tournament.values()),
        "last": history[0]["tournament"]["starts_at"] if history else None,
        "history": history,
    }


def change_referee(tournament: Tournament, role: Role, position: str) -> Role:
    """Сменить должность судьи в турнире. Единственные должности — те же
    правила, что при назначении: занятую второму не дать."""
    if position not in POSITIONS:
        raise RosterError("Неизвестная судейская должность.")
    if position == role.kind:
        return role
    if position in SINGLE:
        holder = next((r for r in referees(tournament) if r.kind == position), None)
        if holder:
            raise RosterError(f"«{holder.get_kind_display()}» уже назначен: {holder.user.name}.")
    role.kind = position
    role.save(update_fields=["kind"])
    return role
