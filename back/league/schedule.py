"""Расписание тура Лиги ✳ (19.11.2026, решение владельца продукта: «как у
обычного турнира»; LEAGUE.md «Расписание тура»). Ручки (`views.py`) только
переводят правила в HTTP.

Ход тот же, что у турнира (`tournaments/schedule.py`): ведущий лигу задаёт
столов, минут на командную встречу и игровые дни → **черновик**: встречи тура
по кругам (каждая команда в круге играет не больше раза), каждой — время и стол
→ правка времени и стола (сервер отбивает занятый стол и команду, у которой в
это время другая встреча) → **«Отправить»**: расписание запирается. Счёт
встречи вносится и до, и после отправки — расписание его не ограничивает.

Отличия от турнира — наши, подлежат утверждению: встреча занимает **один стол**
(в настоящей лиге личные встречи иногда разводят на два — QUESTIONS 11.1);
судей стола у тура пока нет (судейский контур Лиги — LEAGUE.md «Чего ещё нет»),
поэтому раскладка ограничена только столами; длительность встречи по умолчанию
— 120 минут (до пяти личных встреч до трёх побед). Чистая часть — общая с
турниром: `round_robin_rounds`, `assign_slots`, `play_slots`.
"""
import datetime

from django.db import transaction
from django.utils import timezone

from tournaments import schedule as tschedule

from .models import LeagueTour, TeamMatch
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
    # Судей у тура нет: «судьи» раскладки — столы, ограничивают только они.
    try:
        placed = tschedule.assign_slots([(m.id, m.team_a_id, m.team_b_id) for m in matches], tables, list(range(tables)))
        starts = tschedule.play_slots(tschedule._days(days), match_minutes, max(slot for _, slot, _, _ in placed) + 1)
    except ValueError as e:
        raise LeagueError(str(e))
    by_id = {m.id: m for m in matches}
    for key, slot, table, _ in placed:
        m = by_id[key]
        m.table, m.scheduled_at = table, timezone.make_aware(starts[slot])
    TeamMatch.objects.bulk_update(matches, ["round_number", "table", "scheduled_at"])
    tour.schedule_tables, tour.schedule_match_minutes, tour.schedule_days = tables, match_minutes, days
    tour.schedule_status = DRAFT
    tour.save(update_fields=["schedule_tables", "schedule_match_minutes", "schedule_days", "schedule_status"])
    return tour


@transaction.atomic
def edit_match(match: TeamMatch, *, table=None, scheduled_at=None, by) -> TeamMatch:
    """Стол и время встречи вручную. На отрезке встречи (начало + длительность)
    — ни занятого стола, ни команды, у которой другая встреча."""
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
    match.save(update_fields=["table", "scheduled_at"])
    return match


@transaction.atomic
def finalize(tour: LeagueTour, by) -> LeagueTour:
    """Отправить: расписание запирается."""
    _staff(by)
    _open(tour.division.season)
    _draft_only(tour)
    if tour.matches.filter(scheduled_at__isnull=True).exists():
        raise LeagueError("Не у всех встреч есть время и стол.")
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
        "can_edit": bool(user and user.is_authenticated and is_league_staff(user))
        and not tour.division.season.closed
        and tour.schedule_status != FINAL,
    }
