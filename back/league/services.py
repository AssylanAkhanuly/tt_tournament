"""Правила Евразийской лиги над базой ✳ (19.11.2026, LEAGUE.md). Ручки
(`views.py`) только переводят их в HTTP; арифметика — `engine.py`."""
import datetime
from itertools import combinations
from typing import List, Sequence

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date

from rating.models import RatingProfile
from users.models import Role, User
from users.permissions import has_role

from . import engine
from .models import LeagueDivision, LeagueRules, LeagueSeason, LeagueTour, Team, TeamMatch, TeamMember


class LeagueError(Exception):
    """Нельзя; текст — для человека. `status` — 400 или 403."""

    def __init__(self, detail: str, status: int = 400):
        super().__init__(detail)
        self.detail = detail
        self.status = status


def is_league_staff(user) -> bool:
    """Ведёт лигу: председатель ГСК или администратор федерации ✳ (наше
    допущение; по ТЗ §4.10 протокол тура закрывает главный судья тура — когда
    у тура появится судейский состав, право перейдёт к нему)."""
    return has_role(user, Role.KIND_GSK_CHAIRMAN, Role.KIND_FEDERATION_ADMIN)


def can_manage_club(user, club) -> bool:
    return is_league_staff(user) or club.is_admin(user)


# ── Сезон ✳ (19.11.2026, LEAGUE.md «Сезон») ─────────────────────────────────

YEARS = (2020, 2100)  # границы года сезона — наши, от опечатки


def _open(season: LeagueSeason) -> None:
    """Завершённый сезон закрыт для любых изменений."""
    if season.closed:
        raise LeagueError("Сезон завершён — изменения закрыты.")


def _year(value) -> int:
    try:
        year = int(value)
    except (TypeError, ValueError):
        raise LeagueError("Год сезона — числом.")
    if not YEARS[0] <= year <= YEARS[1]:
        raise LeagueError("Год сезона — от %d до %d." % YEARS)
    return year


def _date(value):
    """День ГГГГ-ММ-ДД или пусто."""
    if value in (None, ""):
        return None
    if isinstance(value, datetime.date):
        return value
    parsed = parse_date(str(value))
    if parsed is None:
        raise LeagueError("Срок регистрации — дата ГГГГ-ММ-ДД.")
    return parsed


def create_season(year, name: str, registration_until, by) -> LeagueSeason:
    """Сезон заводится с закрытой регистрацией, пока не указан срок: открыть её
    — решение, а не умолчание. Указан срок — окно открыто до него."""
    if not is_league_staff(by):
        raise LeagueError("Сезон заводит администратор федерации или председатель ГСК.", 403)
    year = _year(year)
    registration_until = _date(registration_until)
    name = (name or "").strip() or "Сезон %d" % year
    return LeagueSeason.objects.create(
        year=year, name=name[:80], registration_open=bool(registration_until), registration_until=registration_until or None,
    )


def update_season(season: LeagueSeason, data: dict, by) -> LeagueSeason:
    """Название, окно регистрации, «завершён». Завершение снимается тем же
    переключателем; у завершённого сезона регистрация не идёт, что бы ни
    стояло в окне."""
    if not is_league_staff(by):
        raise LeagueError("Сезон ведёт администратор федерации или председатель ГСК.", 403)
    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            raise LeagueError("У сезона должно быть название.")
        season.name = name[:80]
    if "registration_open" in data:
        season.registration_open = bool(data["registration_open"])
    if "registration_until" in data:
        season.registration_until = _date(data["registration_until"])
    if "closed" in data:
        season.closed = bool(data["closed"])
    season.save()
    season.refresh_from_db()
    return season


def create_division(season: LeagueSeason, gender: str, name: str, level, by) -> LeagueDivision:
    if not is_league_staff(by):
        raise LeagueError("Лигу сезона заводит администратор федерации или председатель ГСК.", 403)
    _open(season)
    if gender not in ("m", "f"):
        raise LeagueError("Розыгрыш — мужчины или женщины.")
    try:
        level = int(level)
    except (TypeError, ValueError):
        raise LeagueError("Уровень лиги — числом (1 — Суперлига).")
    name = (name or "").strip()
    if not name or level < 1:
        raise LeagueError("У лиги должны быть название и уровень от 1.")
    if LeagueDivision.objects.filter(season=season, gender=gender, level=level).exists():
        raise LeagueError("Лига этого розыгрыша и уровня в сезоне уже есть.")
    return LeagueDivision.objects.create(season=season, gender=gender, name=name, level=level)


def register_team(division: LeagueDivision, club, name: str, by) -> Team:
    if not can_manage_club(by, club):
        raise LeagueError("Заявить команду может администратор этого клуба.", 403)
    _open(division.season)
    staff = is_league_staff(by)
    # Клуб заявляется сам только в окно регистрации; ведущие лигу вносят за
    # клуб в любой момент незавершённого сезона ✳.
    if not staff and not division.season.registration_active():
        raise LeagueError("Регистрация команд сезона закрыта.")
    name = (name or "").strip() or club.name
    if Team.objects.filter(division=division, name=name).exists():
        raise LeagueError("Команда «%s» в этом дивизионе уже есть." % name)
    # Заявка клуба ждёт решения федерации; внесённая федерацией — принята.
    status = Team.STATUS_ACCEPTED if staff else Team.STATUS_SUBMITTED
    return Team.objects.create(division=division, club=club, name=name, submitted_by=by, status=status)


def squad_refusal(team: Team, user):
    """Почему этот человек не может менять состав команды; None — может ✳.
    Ведущие лигу — в любой момент незавершённого сезона. Клуб — пока идёт
    регистрация и заявка не принята: принятый состав меняет только федерация,
    иначе решение о допуске теряет смысл."""
    if team.division.season.closed:
        return "Сезон завершён — изменения закрыты."
    if is_league_staff(user):
        return None
    if not team.club.is_admin(user):
        return "Менять состав может администратор клуба команды."
    if not team.division.season.registration_active():
        return "Регистрация команд сезона закрыта — состав меняет федерация."
    if team.status == Team.STATUS_ACCEPTED:
        return "Заявка принята — состав меняет федерация."
    return None


def _squad_check(team: Team, by) -> None:
    reason = squad_refusal(team, by)
    if reason:
        raise LeagueError(reason, 403 if not (is_league_staff(by) or team.club.is_admin(by)) else 400)


def decide_team(team: Team, decision: str, comment: str, by) -> Team:
    """Решение федерации по заявке клуба: принять или отклонить (с
    комментарием — клуб видит причину и подаёт снова)."""
    if not is_league_staff(by):
        raise LeagueError("Решение по заявке принимает администратор федерации или председатель ГСК.", 403)
    _open(team.division.season)
    comment = (comment or "").strip()
    if decision == "accept":
        team.status = Team.STATUS_ACCEPTED
    elif decision == "reject":
        if not comment:
            raise LeagueError("Отклонить можно только с комментарием — клуб должен понять, что исправить.")
        team.status = Team.STATUS_REJECTED
    else:
        raise LeagueError("Решение — accept или reject.")
    team.decision_comment, team.decided_by, team.decided_at = comment, by, timezone.now()
    team.save(update_fields=["status", "decision_comment", "decided_by", "decided_at"])
    return team


def resubmit_team(team: Team, by) -> Team:
    """Клуб подаёт отклонённую заявку снова — пока идёт регистрация."""
    if not team.club.is_admin(by):
        raise LeagueError("Подать заявку снова может администратор клуба команды.", 403)
    _open(team.division.season)
    if team.status != Team.STATUS_REJECTED:
        raise LeagueError("Подать снова можно только отклонённую заявку.")
    if not team.division.season.registration_active():
        raise LeagueError("Регистрация команд сезона закрыта.")
    team.status = Team.STATUS_SUBMITTED
    team.save(update_fields=["status"])
    return team


def club_teams(user):
    """Команды клубов, которые ведёт человек, — кабинет администратора клуба."""
    return Team.objects.filter(club__admin_memberships__user=user).select_related("club", "division__season").distinct()


def open_seasons():
    """Сезоны, в которые сейчас можно заявиться, и их лиги."""
    return [s for s in LeagueSeason.objects.filter(closed=False, registration_open=True) if s.registration_active()]


def add_member(team: Team, user: User, by) -> TeamMember:
    _squad_check(team, by)
    rules = LeagueRules.active()
    with transaction.atomic():
        if team.members.count() >= rules.squad_max:
            raise LeagueError("В составе на сезон — не больше %d игроков." % rules.squad_max)
        other = (
            TeamMember.objects.filter(user=user, team__division__season=team.division.season)
            .exclude(team__status=Team.STATUS_REJECTED)
            .select_related("team")
            .first()
        )
        if other:
            raise LeagueError("%s уже в составе команды «%s» этого сезона." % (user.name, other.team.name))
        return TeamMember.objects.create(team=team, user=user)


def remove_member(team: Team, user_id, by) -> None:
    _squad_check(team, by)
    deleted, _ = TeamMember.objects.filter(team=team, user_id=user_id).delete()
    if not deleted:
        raise LeagueError("Этого игрока нет в составе.")


def member_candidates(team: Team, q: str = "", limit: int = 30):
    """Спортсмены, которых можно добавить: с рейтинговой карточкой, ещё ни в
    одной команде сезона; пол — как у розыгрыша дивизиона, если он указан."""
    taken = (
        TeamMember.objects.filter(team__division__season=team.division.season)
        .exclude(team__status=Team.STATUS_REJECTED)
        .values_list("user_id", flat=True)
    )
    qs = RatingProfile.objects.select_related("user").exclude(user_id__in=taken)
    if team.division.gender:
        qs = qs.filter(sex=team.division.gender)
    if q.strip():
        qs = qs.filter(user__name__icontains=q.strip())
    return [p.user for p in qs.order_by("user__name")[:limit]]


def create_tour(division: LeagueDivision, number: int, city: str, starts_on, by) -> LeagueTour:
    """Тур и его встречи: каждая команда дивизиона с каждой (круговая, ТЗ §4.10)."""
    if not is_league_staff(by):
        raise LeagueError("Туры заводит председатель ГСК.", 403)
    _open(division.season)
    if LeagueTour.objects.filter(division=division, number=number).exists():
        raise LeagueError("Тур %d в этом дивизионе уже есть." % number)
    # В тур идут только принятые заявки ✳.
    teams = list(division.teams.filter(status=Team.STATUS_ACCEPTED).order_by("created_at"))
    if len(teams) < 2:
        raise LeagueError("В лиге меньше двух принятых команд — встреч не составить.")
    with transaction.atomic():
        tour = LeagueTour.objects.create(division=division, number=number, city=city or "", starts_on=starts_on)
        TeamMatch.objects.bulk_create(TeamMatch(tour=tour, team_a=a, team_b=b) for a, b in combinations(teams, 2))
    return tour


def _check_lineup(team: Team, lineup: Sequence, rules: engine.Rules) -> List[str]:
    ids = [str(x) for x in lineup or []]
    if len(ids) != rules.players or len(set(ids)) != len(ids):
        raise LeagueError("Расстановка «%s» — ровно %d разных игрока." % (team.name, rules.players))
    squad = {str(u) for u in team.members.values_list("user_id", flat=True)}
    if not set(ids) <= squad:
        raise LeagueError("В расстановке «%s» игрок не из состава команды." % team.name)
    return ids


def record_result(match: TeamMatch, lineup_a, lineup_b, rubbers, by) -> TeamMatch:
    if not is_league_staff(by):
        raise LeagueError("Счёт встречи вносит председатель ГСК.", 403)
    _open(match.tour.division.season)
    rules = LeagueRules.active().to_rules()
    a = _check_lineup(match.team_a, lineup_a, rules)
    b = _check_lineup(match.team_b, lineup_b, rules)
    try:
        scores = [(int(x[0]), int(x[1])) for x in rubbers or []]
        result = engine.team_match_result(scores, rules)
    except engine.RubberError as e:
        raise LeagueError(str(e))
    except (TypeError, ValueError, IndexError):
        raise LeagueError("Счёт личных встреч — списком пар чисел.")
    match.lineup_a, match.lineup_b, match.rubbers, match.no_show = a, b, [list(s) for s in scores], ""
    _apply(match, result, by)
    return match


def record_no_show(match: TeamMatch, absent: str, by) -> TeamMatch:
    if not is_league_staff(by):
        raise LeagueError("Неявку фиксирует председатель ГСК.", 403)
    _open(match.tour.division.season)
    if absent not in ("a", "b"):
        raise LeagueError("Не явилась команда «a» или «b».")
    result = engine.no_show_result(absent, LeagueRules.active().to_rules())
    match.lineup_a, match.lineup_b, match.rubbers, match.no_show = [], [], [], absent
    _apply(match, result, by)
    return match


def _apply(match: TeamMatch, result: engine.MatchResult, by) -> None:
    match.rubbers_a, match.rubbers_b = result.rubbers_a, result.rubbers_b
    match.winner = result.winner or ""
    match.status = "finished" if result.finished else "pending"
    match.entered_by, match.entered_at = by, timezone.now()
    match.save()


# ── Состояние тура для обзора сезона ✳ (21.11.2026, LEAGUE.md «Обзор сезона») ──

SOON_DAYS = 14  # за сколько дней до тура отсутствие расписания — проблема; число наше


def tour_state(tour: LeagueTour, today=None):
    """Что показать в полоске туров лиги: `(состояние, проблема)`.

    `done` — все встречи сыграны; `live` — часть сыграна, день тура не прошёл;
    `ready` — расписание отправлено, ждём тура; `draft` — черновик расписания;
    `planned` — тур заведён, расписания нет и до него больше `SOON_DAYS` дней;
    `issue` — нужно действие, текст во втором значении: день прошёл, а счёт
    внесён не весь («Не внесён счёт»), в черновике встреча без судьи («Нет
    судей стола»), до тура `SOON_DAYS` дней или меньше, а расписания нет («Нет
    расписания»). Решает сервер — экран правил не повторяет."""
    today = today or timezone.localdate()
    matches = list(tour.matches.all())
    total = len(matches)
    finished = sum(1 for m in matches if m.status == "finished")
    if total and finished == total:
        return "done", ""
    if tour.starts_on and tour.starts_on < today:
        return "issue", "Не внесён счёт"
    if finished:
        return "live", ""
    if tour.schedule_status == "final":
        return "ready", ""
    if tour.schedule_status == "draft":
        if any(m.referee_id is None for m in matches):
            return "issue", "Нет судей стола"
        return "draft", ""
    if tour.starts_on and (tour.starts_on - today).days <= SOON_DAYS:
        return "issue", "Нет расписания"
    return "planned", ""


def table(division: LeagueDivision) -> List[engine.Row]:
    rules = LeagueRules.active().to_rules()
    teams = list(division.teams.filter(status=Team.STATUS_ACCEPTED).order_by("created_at"))
    played = [
        engine.PlayedMatch(team_a=m.team_a_id, team_b=m.team_b_id, rubbers=[tuple(r) for r in m.rubbers], no_show=m.no_show or None)
        for m in TeamMatch.objects.filter(tour__division=division, status="finished")
    ]
    return engine.standings([t.id for t in teams], played, rules)
