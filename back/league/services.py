"""Правила Евразийской лиги над базой ✳ (19.11.2026, LEAGUE.md). Ручки
(`views.py`) только переводят их в HTTP; арифметика — `engine.py`."""
from itertools import combinations
from typing import List, Sequence

from django.db import transaction
from django.utils import timezone

from rating.models import RatingProfile
from users.models import Role, User
from users.permissions import has_role

from . import engine
from .models import LeagueDivision, LeagueRules, LeagueTour, Team, TeamMatch, TeamMember


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


def register_team(division: LeagueDivision, club, name: str, by) -> Team:
    if not can_manage_club(by, club):
        raise LeagueError("Заявить команду может администратор этого клуба.", 403)
    name = (name or "").strip() or club.name
    if Team.objects.filter(division=division, name=name).exists():
        raise LeagueError("Команда «%s» в этом дивизионе уже есть." % name)
    return Team.objects.create(division=division, club=club, name=name, submitted_by=by)


def add_member(team: Team, user: User, by) -> TeamMember:
    if not can_manage_club(by, team.club):
        raise LeagueError("Менять состав может администратор клуба команды.", 403)
    rules = LeagueRules.active()
    with transaction.atomic():
        if team.members.count() >= rules.squad_max:
            raise LeagueError("В составе на сезон — не больше %d игроков." % rules.squad_max)
        other = (
            TeamMember.objects.filter(user=user, team__division__season=team.division.season)
            .select_related("team")
            .first()
        )
        if other:
            raise LeagueError("%s уже в составе команды «%s» этого сезона." % (user.name, other.team.name))
        return TeamMember.objects.create(team=team, user=user)


def remove_member(team: Team, user_id, by) -> None:
    if not can_manage_club(by, team.club):
        raise LeagueError("Менять состав может администратор клуба команды.", 403)
    deleted, _ = TeamMember.objects.filter(team=team, user_id=user_id).delete()
    if not deleted:
        raise LeagueError("Этого игрока нет в составе.")


def member_candidates(team: Team, q: str = "", limit: int = 30):
    """Спортсмены, которых можно добавить: с рейтинговой карточкой, ещё ни в
    одной команде сезона; пол — как у розыгрыша дивизиона, если он указан."""
    taken = TeamMember.objects.filter(team__division__season=team.division.season).values_list("user_id", flat=True)
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
    if LeagueTour.objects.filter(division=division, number=number).exists():
        raise LeagueError("Тур %d в этом дивизионе уже есть." % number)
    teams = list(division.teams.order_by("created_at"))
    if len(teams) < 2:
        raise LeagueError("В дивизионе меньше двух команд — встреч не составить.")
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


def table(division: LeagueDivision) -> List[engine.Row]:
    rules = LeagueRules.active().to_rules()
    teams = list(division.teams.order_by("created_at"))
    played = [
        engine.PlayedMatch(team_a=m.team_a_id, team_b=m.team_b_id, rubbers=[tuple(r) for r in m.rubbers], no_show=m.no_show or None)
        for m in TeamMatch.objects.filter(tour__division=division, status="finished")
    ]
    return engine.standings([t.id for t in teams], played, rules)
