"""Расписание тура Лиги ✳ (19.11.2026, решение владельца продукта: «как у
обычного турнира»; LEAGUE.md «Расписание тура»). Ручки (`views.py`) только
переводят правила в HTTP.

Ход тот же, что у турнира (`tournaments/schedule.py`): ведущий лигу задаёт
столов, минут на командную встречу и игровые дни → **черновик**: встречи тура
по кругам (каждая команда в круге играет не больше раза), каждой — время и стол
→ правка времени и стола (сервер отбивает занятый стол и команду, у которой в
это время другая встреча) → **«Отправить»**: расписание запирается. Счёт
встречи вносится и до, и после отправки — расписание его не ограничивает.

Судьи стола ✳ — как коллегия турнира: ведущий лигу назначает судей тура
(учётки с ролью «судья»; игрок состава команды этого сезона судьёй тура быть
не может — судил бы свою лигу), раскладка сажает на встречу наименее
загруженного свободного судью, без судей расписания нет, правка проверяет и
судью, «Отправить» — только когда у всех встреч есть судья.

Отличия от турнира — наши, подлежат утверждению: встреча занимает **один стол**
(в настоящей лиге личные встречи иногда разводят на два — QUESTIONS 11.1), на
встречу — **один судья**; длительность встречи по умолчанию — 120 минут (до
пяти личных встреч до трёх побед). Чистая часть — общая с
турниром: `round_robin_rounds`, `assign_slots`, `play_slots`.
"""
import datetime

from django.db import transaction
from django.utils import timezone

from users.models import Role, User

from tournaments import schedule as tschedule

from .models import LeagueTour, Team, TeamMatch, TeamMember
from .services import LeagueError, _open, is_league_staff

NONE, DRAFT, FINAL = "none", "draft", "final"
DEFAULT_DAY = tschedule.DEFAULT_DAY  # часы игрового дня по умолчанию — общие с турниром


def _staff(by) -> None:
    if not is_league_staff(by):
        raise LeagueError("Расписание тура ведёт администратор федерации или председатель ГСК.", 403)


def _draft_only(tour: LeagueTour) -> None:
    if tour.schedule_status == FINAL:
        raise LeagueError("Расписание отправлено — его уже не изменить.")
    if tour.schedule_status != DRAFT:
        raise LeagueError("Сначала сформируйте расписание.")


def tour_days(tour: LeagueTour) -> list:
    """Игровые дни по умолчанию — день тура с часами `DEFAULT_DAY`."""
    if not tour.starts_on:
        raise LeagueError("У тура нет даты — задайте игровые дни.")
    return [{"date": tour.starts_on.isoformat(), "start": DEFAULT_DAY[0], "end": DEFAULT_DAY[1]}]


def _clean_days(days) -> list:
    """Дни с экрана → запись; правила те же, что у турнира."""
    try:
        return tschedule._clean_days(days)
    except tschedule.ScheduleError as e:
        raise LeagueError(str(e))


def _season_players(tour: LeagueTour):
    """Игроки составов команд сезона (кроме отклонённых заявок)."""
    return TeamMember.objects.filter(team__division__season=tour.division.season).exclude(
        team__status=Team.STATUS_REJECTED
    ).values_list("user_id", flat=True)


def referee_candidates(tour: LeagueTour, q: str = "", limit: int = 30):
    """Кого можно назначить судьёй тура: роль «судья», ещё не в туре, не игрок сезона."""
    qs = (
        User.objects.filter(roles__kind=Role.KIND_REFEREE)
        .exclude(id__in=tour.referees.values_list("id", flat=True))
        .exclude(id__in=_season_players(tour))
        .distinct()
    )
    if q.strip():
        qs = qs.filter(name__icontains=q.strip())
    return list(qs.order_by("name")[:limit])


def add_referee(tour: LeagueTour, user: User, by) -> None:
    _staff(by)
    _open(tour.division.season)
    if tour.schedule_status == FINAL:
        raise LeagueError("Расписание отправлено — судей не меняют.")
    if not user.roles.filter(kind=Role.KIND_REFEREE).exists():
        raise LeagueError("Судьёй тура может быть только человек с ролью «судья».")
    if user.id in set(_season_players(tour)):
        raise LeagueError("%s в составе команды этого сезона — судить тур не может." % user.name)
    tour.referees.add(user)


def remove_referee(tour: LeagueTour, user_id, by) -> None:
    """Убрать судью; его встречи в черновике остаются без судьи — до правки
    или нового «Сформировать»."""
    _staff(by)
    _open(tour.division.season)
    if tour.schedule_status == FINAL:
        raise LeagueError("Расписание отправлено — судей не меняют.")
    tour.referees.remove(user_id)
    tour.matches.filter(referee_id=user_id).update(referee=None)


def _ordered(tour: LeagueTour) -> list:
    """Встречи тура по кругам: «многоугольник» по командам тура — в круге
    команда играет не больше раза. Круг пишется во встречу."""
    matches = list(tour.matches.all())
    teams = []
    for m in sorted(matches, key=lambda m: m.id):
        for t in (m.team_a_id, m.team_b_id):
            if t not in teams:
                teams.append(t)
    by_pair = {frozenset((m.team_a_id, m.team_b_id)): m for m in matches}
    ordered = []
    for number, pairs in enumerate(tschedule.round_robin_rounds(teams), start=1):
        for a, b in pairs:
            m = by_pair.pop(frozenset((a, b)), None)
            if m:
                m.round_number = number
                ordered.append(m)
    # Встречи вне круговой (если тур составлен не всеми со всеми) — в конец.
    ordered += sorted(by_pair.values(), key=lambda m: m.id)
    return ordered


@transaction.atomic
def build(tour: LeagueTour, *, tables, match_minutes, days, by) -> LeagueTour:
    """Черновик заново: время и стол каждой встрече. Прежний черновик — прочь."""
    _staff(by)
    _open(tour.division.season)
    if tour.schedule_status == FINAL:
        raise LeagueError("Расписание отправлено — его уже не изменить.")
    try:
        tables, match_minutes = int(tables), int(match_minutes)
    except (TypeError, ValueError):
        raise LeagueError("Столов и длительность встречи — числами.")
    if tables < 1:
        raise LeagueError("Нужен хотя бы один стол.")
    if match_minutes < 1:
        raise LeagueError("Длительность встречи — хотя бы минута.")
    days = _clean_days(days) if days is not None else tour_days(tour)
    matches = _ordered(tour)
    if not matches:
        raise LeagueError("У тура нет встреч — расписывать нечего.")
    refs = list(tour.referees.order_by("name").values_list("id", flat=True))
    if not refs:
        raise LeagueError("Назначьте судей стола тура — встречи некому судить.")
    # В слоте встреч не больше, чем столов и судей; судья — наименее загруженный.
    try:
        placed = tschedule.assign_slots([(m.id, m.team_a_id, m.team_b_id) for m in matches], tables, refs)
        starts = tschedule.play_slots(tschedule._days(days), match_minutes, max(slot for _, slot, _, _ in placed) + 1)
    except ValueError as e:
        raise LeagueError(str(e))
    by_id = {m.id: m for m in matches}
    for key, slot, table, ref in placed:
        m = by_id[key]
        m.table, m.scheduled_at, m.referee_id = table, timezone.make_aware(starts[slot]), ref
    TeamMatch.objects.bulk_update(matches, ["round_number", "table", "scheduled_at", "referee"])
    tour.schedule_tables, tour.schedule_match_minutes, tour.schedule_days = tables, match_minutes, days
    tour.schedule_status = DRAFT
    tour.save(update_fields=["schedule_tables", "schedule_match_minutes", "schedule_days", "schedule_status"])
    return tour


@transaction.atomic
def edit_match(match: TeamMatch, *, table=None, scheduled_at=None, referee_id=None, by) -> TeamMatch:
    """Стол, время и судья встречи вручную. На отрезке встречи (начало +
    длительность) — ни занятого стола, ни команды с другой встречей, ни судьи,
    который в это время судит другую."""
    tour = match.tour
    _staff(by)
    _open(tour.division.season)
    _draft_only(tour)
    if table is not None:
        try:
            table = int(table)
        except (TypeError, ValueError):
            raise LeagueError("Стол — числом.")
        if not 1 <= table <= tour.schedule_tables:
            raise LeagueError(f"Стол — от 1 до {tour.schedule_tables}.")
        match.table = table
    if referee_id is not None:
        ref = tour.referees.filter(id=referee_id).first()
        if ref is None:
            raise LeagueError("Встречу судит только судья стола этого тура.")
        match.referee_id = ref.id  # id из базы, а не строка запроса: ниже он сравнивается
    if scheduled_at is not None:
        try:
            when = datetime.datetime.fromisoformat(str(scheduled_at).replace("Z", "+00:00"))
        except ValueError:
            raise LeagueError("Время — дата и время.")
        match.scheduled_at = when if timezone.is_aware(when) else timezone.make_aware(when)
    span = datetime.timedelta(minutes=tour.schedule_match_minutes)
    start, end = match.scheduled_at, match.scheduled_at + span
    overlapping = [
        o for o in tour.matches.exclude(pk=match.pk).filter(scheduled_at__isnull=False)
        if o.scheduled_at < end and start < o.scheduled_at + span
    ]
    if any(o.table == match.table for o in overlapping):
        raise LeagueError("Этот стол в это время занят.")
    teams = {match.team_a_id, match.team_b_id}
    if any({o.team_a_id, o.team_b_id} & teams for o in overlapping):
        raise LeagueError("У команды в это время другая встреча.")
    if match.referee_id and any(o.referee_id == match.referee_id for o in overlapping):
        raise LeagueError("Этот судья в это время судит другую встречу.")
    match.save(update_fields=["table", "scheduled_at", "referee"])
    return match


@transaction.atomic
def finalize(tour: LeagueTour, by) -> LeagueTour:
    """Отправить: расписание запирается."""
    _staff(by)
    _open(tour.division.season)
    _draft_only(tour)
    if tour.matches.filter(scheduled_at__isnull=True).exists() or tour.matches.filter(referee__isnull=True).exists():
        raise LeagueError("Не у всех встреч есть время, стол и судья.")
    tour.schedule_status = FINAL
    tour.save(update_fields=["schedule_status"])
    return tour


def snapshot(tour: LeagueTour, user) -> dict:
    """Расписание в ответе тура: состояние, параметры, дни (по умолчанию — день
    тура), может ли смотрящий его вести."""
    days = tour.schedule_days or (tour_days(tour) if tour.starts_on else [])
    return {
        "status": tour.schedule_status,
        "tables": tour.schedule_tables,
        "match_minutes": tour.schedule_match_minutes,
        "days": days,
        "referees": [{"id": str(u.id), "name": u.name} for u in tour.referees.order_by("name")],
        "can_edit": bool(user and user.is_authenticated and is_league_staff(user))
        and not tour.division.season.closed
        and tour.schedule_status != FINAL,
    }


def participant_matches(user) -> dict:
    """Расписание участникам ✳ — только отправленное: черновик видит федерация.
    `matches` — встречи команд клубов, которые ведёт человек; `judging` —
    встречи, которые он судит."""
    sent = TeamMatch.objects.filter(tour__schedule_status=FINAL).select_related(
        "tour__division__season", "team_a", "team_b", "referee"
    ).order_by("scheduled_at", "table")
    clubs = list(user.club_admin_roles.values_list("club_id", flat=True))
    from django.db.models import Q

    return {
        "matches": list(sent.filter(Q(team_a__club_id__in=clubs) | Q(team_b__club_id__in=clubs))) if clubs else [],
        "judging": list(sent.filter(referee=user)),
    }
