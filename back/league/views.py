"""Ручки Евразийской лиги ✳ (19.11.2026, LEAGUE.md) — только переводят
`services.py` в HTTP."""
import datetime

from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from clubs.models import Club
from users.models import User
from users.permissions import IsGskChairman

from . import schedule, services
from .models import LeagueDivision, LeagueRules, LeagueSeason, LeagueTour, Team, TeamMatch

RULE_FIELDS = (
    "order", "players", "wins_needed", "games_to_win", "points_win", "points_loss", "points_no_show",
    "promote", "relegate", "squad_max",
)


def _refused(e: services.LeagueError) -> Response:
    return Response({"detail": e.detail}, status=e.status)


def _rules_data(r: LeagueRules) -> dict:
    return {f: getattr(r, f) for f in RULE_FIELDS}


def _division_data(d: LeagueDivision) -> dict:
    return {
        "id": str(d.id), "season": d.season.year, "season_id": str(d.season_id), "season_name": d.season.name,
        "season_closed": d.season.closed, "gender": d.gender, "name": d.name, "level": d.level,
    }


def _calendar(tours, matches) -> dict:
    """Что нужно календарю соревнований ✳ (19.11.2026: Лига — строка рядом с
    турнирами): дата — первый тур с датой, окончание — последний, города — по
    порядку туров без повторов, ход — сыграно встреч из всех."""
    tours = list(tours)
    dates = sorted(t.starts_on for t in tours if t.starts_on)
    cities = []
    for t in sorted(tours, key=lambda t: (t.starts_on or datetime.date.max, t.number)):
        if t.city and t.city not in cities:
            cities.append(t.city)
    return {
        "tours": len(tours),
        "starts_on": dates[0] if dates else None,
        "ends_on": dates[-1] if dates else None,
        "cities": cities,
        "matches": matches.count(),
        "finished": matches.filter(status="finished").count(),
    }


def _division_row(d: LeagueDivision) -> dict:
    return {
        **_division_data(d),
        "teams": d.teams.count(),
        **_calendar(d.tours.all(), TeamMatch.objects.filter(tour__division=d)),
    }


def _tour_rows(d: LeagueDivision) -> list:
    """Туры лиги для обзора сезона: номер, город, дата и состояние — его решает
    `services.tour_state`."""
    today = timezone.localdate()
    out = []
    for t in d.tours.prefetch_related("matches").order_by("number"):
        state, problem = services.tour_state(t, today)
        out.append({"id": str(t.id), "number": t.number, "city": t.city, "starts_on": t.starts_on,
                    "state": state, "problem": problem})
    return out


def _season_row(s: LeagueSeason) -> dict:
    """Строка сезона: окно регистрации (идёт ли — считает сервер) и сводка для
    календаря по всем лигам сезона."""
    return {
        "id": str(s.id), "year": s.year, "name": s.name, "closed": s.closed,
        "registration": {
            "open": s.registration_open,
            "until": s.registration_until.isoformat() if s.registration_until else None,
            "active": s.registration_active(),
        },
        "leagues": s.divisions.count(),
        "teams": Team.objects.filter(division__season=s, status=Team.STATUS_ACCEPTED).count(),
        # Заявок клубов ждёт решения — значок у «Команд» сезона.
        "pending": Team.objects.filter(division__season=s, status=Team.STATUS_SUBMITTED).count(),
        **_calendar(LeagueTour.objects.filter(division__season=s), TeamMatch.objects.filter(tour__division__season=s)),
    }


def _team_data(t: Team) -> dict:
    return {
        "status": t.status, "decision_comment": t.decision_comment,
        "id": str(t.id), "name": t.name, "club_id": str(t.club_id), "club_name": t.club.name,
        "members_count": t.members.count(),
    }


def _person(u: User) -> dict:
    card = getattr(u, "rating_profile", None)
    return {"id": str(u.id), "name": u.name, "region": card.region if card else "", "rating": str(card.value) if card else None}


def _match_data(m: TeamMatch) -> dict:
    return {
        "id": m.id, "tour_id": str(m.tour_id), "status": m.status,
        "team_a": {"id": str(m.team_a_id), "name": m.team_a.name},
        "team_b": {"id": str(m.team_b_id), "name": m.team_b.name},
        "rubbers_a": m.rubbers_a, "rubbers_b": m.rubbers_b, "winner": m.winner, "no_show": m.no_show,
        "rubbers": m.rubbers, "lineup_a": m.lineup_a, "lineup_b": m.lineup_b,
        # Расписание тура ✳: круг, время, стол.
        "round_number": m.round_number, "table": m.table,
        "scheduled_at": m.scheduled_at.isoformat() if m.scheduled_at else None,
        "referee": {"id": str(m.referee_id), "name": m.referee.name} if m.referee_id else None,
    }


def _participant_match(m: TeamMatch) -> dict:
    """Встреча в расписании участника: тур, лига и сезон рядом."""
    t = m.tour
    return {
        **_match_data(m),
        "tour": {"id": str(t.id), "number": t.number, "city": t.city},
        "division": {"id": str(t.division_id), "name": t.division.name},
        "season_name": t.division.season.name,
    }


class RulesView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsGskChairman()]

    def get(self, request):
        return Response(_rules_data(LeagueRules.active()))

    def patch(self, request):
        rules = LeagueRules.active()
        for f in RULE_FIELDS:
            if f in request.data:
                setattr(rules, f, request.data[f])
        try:
            services.engine.rubber_order(rules.to_rules())
            rules.full_clean()
        except Exception:
            return Response({"detail": "Правила не сходятся: проверьте порядок встреч и числа."}, status=400)
        rules.save()
        return Response(_rules_data(rules))


class SeasonsView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request):
        return Response([_season_row(s) for s in LeagueSeason.objects.all()])

    def post(self, request):
        d = request.data
        try:
            season = services.create_season(d.get("year"), d.get("name", ""), d.get("registration_until") or None, request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(_season_row(season), status=status.HTTP_201_CREATED)


class SeasonView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request, pk):
        s = get_object_or_404(LeagueSeason, pk=pk)
        divisions = s.divisions.select_related("season").prefetch_related("tours")
        teams = Team.objects.filter(division__season=s).select_related("club", "division", "submitted_by").annotate(n=Count("members"))
        return Response({
            **_season_row(s),
            # У лиги — туры с состоянием для обзора сезона ✳ (21.11.2026).
            "divisions": [{**_division_row(d), "tour_list": _tour_rows(d)} for d in divisions],
            # Команды всех лиг сезона — раздел «Команды» страницы сезона ✳.
            "team_list": [
                {"id": str(t.id), "name": t.name, "club_name": t.club.name, "division_id": str(t.division_id),
                 "division_name": t.division.name, "gender": t.division.gender, "members": t.n,
                 "status": t.status, "decision_comment": t.decision_comment,
                 "submitted_by": t.submitted_by.name if t.submitted_by else ""}
                for t in teams.order_by("division__gender", "division__level", "name")
            ],
        })

    def patch(self, request, pk):
        s = get_object_or_404(LeagueSeason, pk=pk)
        try:
            s = services.update_season(s, request.data, request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(_season_row(s))


class DivisionsView(APIView):
    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request):
        qs = LeagueDivision.objects.select_related("season")
        season = request.query_params.get("season")
        if season:
            qs = qs.filter(season__year=season)
        return Response([_division_row(d) for d in qs.prefetch_related("tours")])

    def post(self, request):
        data = request.data
        season = get_object_or_404(LeagueSeason, pk=data.get("season_id"))
        try:
            d = services.create_division(season, data.get("gender"), data.get("name", ""), data.get("level"), request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(_division_data(d), status=status.HTTP_201_CREATED)


class DivisionView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        d = get_object_or_404(LeagueDivision, pk=pk)
        teams = {t.id: t for t in d.teams.select_related("club")}
        rows = services.table(d)
        return Response({
            **_division_data(d),
            "teams": [_team_data(t) for t in teams.values()],
            "tours": [
                {"id": str(t.id), "number": t.number, "city": t.city, "starts_on": t.starts_on,
                 "matches": t.matches.count(), "finished": t.matches.filter(status="finished").count()}
                for t in d.tours.all()
            ],
            "table": [
                {"place": r.place, "team_id": str(r.team), "team": teams[r.team].name, "played": r.played,
                 "won": r.won, "lost": r.lost, "no_shows": r.no_shows, "points": r.points,
                 "rubbers_for": r.rubbers_for, "rubbers_against": r.rubbers_against,
                 "games_for": r.games_for, "games_against": r.games_against}
                for r in rows
            ],
        })


class DivisionTeamsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        d = get_object_or_404(LeagueDivision, pk=pk)
        club = get_object_or_404(Club, pk=request.data.get("club_id"))
        try:
            team = services.register_team(d, club, request.data.get("name", ""), request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(_team_data(team), status=status.HTTP_201_CREATED)


class DivisionToursView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        d = get_object_or_404(LeagueDivision, pk=pk)
        try:
            number = int(request.data.get("number"))
        except (TypeError, ValueError):
            return Response({"detail": "Номер тура — числом."}, status=400)
        try:
            tour = services.create_tour(d, number, request.data.get("city", ""), request.data.get("starts_on") or None, request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response({"id": str(tour.id), "number": tour.number, "matches": tour.matches.count()}, status=201)


class TeamView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        team = get_object_or_404(Team.objects.select_related("club", "division"), pk=pk)
        members = [m.user for m in team.members.select_related("user__rating_profile")]
        return Response({
            **_team_data(team), "division": _division_data(team.division), "members": [_person(u) for u in members],
            # Может ли смотрящий менять состав — экран не повторяет правила.
            "can_edit": request.user.is_authenticated and services.squad_refusal(team, request.user) is None,
        })


class TeamDecideView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        team = get_object_or_404(Team.objects.select_related("division__season"), pk=pk)
        try:
            services.decide_team(team, request.data.get("decision"), request.data.get("comment", ""), request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(_team_data(team))


class TeamResubmitView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        team = get_object_or_404(Team.objects.select_related("club", "division__season"), pk=pk)
        try:
            services.resubmit_team(team, request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(_team_data(team))


class MyLeagueView(APIView):
    """Кабинет администратора клуба ✳: его клубы, их команды по сезонам (с
    решением федерации и тем, что можно сделать) и сезоны, в которые сейчас
    открыта регистрация, с лигами."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        clubs = Club.objects.filter(admin_memberships__user=user).distinct().order_by("name")
        teams = services.club_teams(user).annotate(n=Count("members")).order_by("-division__season__year", "name")
        return Response({
            "clubs": [{"id": str(c.id), "name": c.name} for c in clubs],
            "teams": [
                {
                    **_team_data(t), "members": t.n, "season_id": str(t.division.season_id),
                    "season_name": t.division.season.name, "division_id": str(t.division_id),
                    "division_name": t.division.name, "gender": t.division.gender,
                    "registration_active": t.division.season.registration_active(),
                    "can_edit": services.squad_refusal(t, user) is None,
                    "can_resubmit": t.status == Team.STATUS_REJECTED and t.division.season.registration_active(),
                }
                for t in teams
            ],
            # Расписание участнику ✳ — только отправленное.
            **{k: [_participant_match(m) for m in v] for k, v in schedule.participant_matches(user).items()},
            "seasons": [
                {
                    "id": str(s.id), "name": s.name,
                    "registration_until": s.registration_until.isoformat() if s.registration_until else None,
                    "divisions": [
                        {"id": str(d.id), "name": d.name, "gender": d.gender, "level": d.level}
                        for d in s.divisions.order_by("gender", "level")
                    ],
                }
                for s in services.open_seasons()
            ],
        })


class TeamMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        team = get_object_or_404(Team.objects.select_related("club", "division"), pk=pk)
        user = get_object_or_404(User, pk=request.data.get("user_id"))
        try:
            services.add_member(team, user, request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(_person(user), status=status.HTTP_201_CREATED)


class TeamMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, user_id):
        team = get_object_or_404(Team.objects.select_related("club"), pk=pk)
        try:
            services.remove_member(team, user_id, request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TeamCandidatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        team = get_object_or_404(Team.objects.select_related("division"), pk=pk)
        return Response([_person(u) for u in services.member_candidates(team, request.query_params.get("q", ""))])


class TourView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        tour = get_object_or_404(LeagueTour.objects.select_related("division"), pk=pk)
        matches = tour.matches.select_related("team_a", "team_b", "referee")
        return Response({
            "id": str(tour.id), "number": tour.number, "city": tour.city, "starts_on": tour.starts_on,
            "division": _division_data(tour.division), "matches": [_match_data(m) for m in matches],
            "schedule": schedule.snapshot(tour, request.user),
        })


class TourScheduleBuildView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tour = get_object_or_404(LeagueTour.objects.select_related("division__season"), pk=pk)
        d = request.data
        try:
            schedule.build(tour, tables=d.get("tables"), match_minutes=d.get("match_minutes"), days=d.get("days"), by=request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(schedule.snapshot(tour, request.user))


class TourScheduleFinalizeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tour = get_object_or_404(LeagueTour.objects.select_related("division__season"), pk=pk)
        try:
            schedule.finalize(tour, request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(schedule.snapshot(tour, request.user))


class TourRefereesView(APIView):
    """Судьи стола тура: список, назначить `{user_id}`."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tour = get_object_or_404(LeagueTour, pk=pk)
        return Response([{"id": str(u.id), "name": u.name} for u in tour.referees.order_by("name")])

    def post(self, request, pk):
        tour = get_object_or_404(LeagueTour.objects.select_related("division__season"), pk=pk)
        user = get_object_or_404(User, pk=request.data.get("user_id"))
        try:
            schedule.add_referee(tour, user, request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response({"id": str(user.id), "name": user.name}, status=status.HTTP_201_CREATED)


class TourRefereeView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, user_id):
        tour = get_object_or_404(LeagueTour.objects.select_related("division__season"), pk=pk)
        try:
            schedule.remove_referee(tour, user_id, request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(status=status.HTTP_204_NO_CONTENT)


class TourRefereeCandidatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tour = get_object_or_404(LeagueTour.objects.select_related("division__season"), pk=pk)
        if not services.is_league_staff(request.user):
            return Response({"detail": "Судей тура назначает федерация."}, status=403)
        found = schedule.referee_candidates(tour, request.query_params.get("q", ""))
        return Response([{"id": str(u.id), "name": u.name} for u in found])


class TeamMatchScheduleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        match = get_object_or_404(TeamMatch.objects.select_related("tour__division__season", "team_a", "team_b"), pk=pk)
        d = request.data
        try:
            schedule.edit_match(
                match, table=d.get("table"), scheduled_at=d.get("scheduled_at"), referee_id=d.get("referee_id"), by=request.user
            )
        except services.LeagueError as e:
            return _refused(e)
        return Response(_match_data(match))


class TeamMatchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        m = get_object_or_404(TeamMatch.objects.select_related("team_a", "team_b", "tour"), pk=pk)
        squad = lambda team: [_person(tm.user) for tm in team.members.select_related("user__rating_profile")]  # noqa: E731
        rules = LeagueRules.active()
        return Response({
            **_match_data(m), "squad_a": squad(m.team_a), "squad_b": squad(m.team_b),
            "order": services.engine.rubber_order(rules.to_rules()), "rules": _rules_data(rules),
        })


class TeamMatchResultView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        m = get_object_or_404(TeamMatch.objects.select_related("team_a", "team_b"), pk=pk)
        try:
            services.record_result(
                m, request.data.get("lineup_a"), request.data.get("lineup_b"), request.data.get("rubbers"), request.user
            )
        except services.LeagueError as e:
            return _refused(e)
        return Response(_match_data(m))


class TeamMatchNoShowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        m = get_object_or_404(TeamMatch.objects.select_related("team_a", "team_b"), pk=pk)
        try:
            services.record_no_show(m, request.data.get("absent", ""), request.user)
        except services.LeagueError as e:
            return _refused(e)
        return Response(_match_data(m))
