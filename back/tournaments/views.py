import secrets

from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from users.serializers import RegisterSerializer, UserSerializer
from users.views import _set_auth_cookies

from .bracket import advance_winner, advance_winner_and_loser, generate_bracket, generate_group_bracket, generate_playoff_from_groups
from .models import Match, Tournament, TournamentParticipant, TournamentTable, TournamentGroup, GroupMatch
from .serializers import (
    GroupMatchSerializer,
    GroupParticipantSerializer,
    GroupSerializer,
    MatchSerializer,
    ParticipantSerializer,
    TournamentCreateSerializer,
    TournamentSerializer,
    TournamentTableSerializer,
    TournamentUpdateSerializer,
)

User = get_user_model()


# ─── Permission helpers ──────────────────────────────────────────────────────

def _is_superadmin(user):
    return user.is_authenticated and user.is_staff


def _can_manage_tournament(user, tournament):
    """True for staff OR for a ClubAdmin of the tournament's club."""
    if not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    if tournament.club and tournament.club.is_admin(user):
        return True
    return False


def _can_create_tournament(user, club=None):
    """True for staff (any club) or club admin of the given club."""
    if not user.is_authenticated:
        return False
    if user.is_staff:
        return True
    if club and club.is_admin(user):
        return True
    return False


# ─── Tournament CRUD ─────────────────────────────────────────────────────────

class TournamentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TournamentCreateSerializer
        return TournamentSerializer

    def get_queryset(self):
        qs = Tournament.objects.select_related('club')
        club_id = self.request.query_params.get('club_id')
        if club_id:
            qs = qs.filter(club_id=club_id)
        return qs

    def create(self, request, *args, **kwargs):
        from clubs.models import Club
        club_id = request.data.get('club_id')
        club = None
        if club_id:
            club = Club.objects.filter(pk=club_id).first()

        if not _can_create_tournament(request.user, club):
            return Response(
                {"detail": "Только администраторы клуба могут создавать турниры."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TournamentCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        tournament = serializer.save()

        # Pre-populate tournament tables from club tables (if club assigned)
        if tournament.club_id:
            from clubs.models import ClubTable
            club_tables = ClubTable.objects.filter(
                club_id=tournament.club_id, is_active=True
            ).order_by('number')
            TournamentTable.objects.bulk_create([
                TournamentTable(
                    tournament=tournament,
                    number=ct.number,
                    name=ct.name,
                    is_active=True,
                )
                for ct in club_tables
            ])

        return Response(TournamentSerializer(tournament).data, status=status.HTTP_201_CREATED)


class TournamentDetailView(generics.RetrieveAPIView):
    queryset = Tournament.objects.select_related('club')
    serializer_class = TournamentSerializer
    permission_classes = [AllowAny]


class TournamentUpdateDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def get_tournament(self, pk):
        return get_object_or_404(Tournament.objects.select_related('club'), pk=pk)

    def patch(self, request, pk):
        tournament = self.get_tournament(pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        serializer = TournamentUpdateSerializer(tournament, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TournamentSerializer(tournament).data)

    def delete(self, request, pk):
        tournament = self.get_tournament(pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        tournament.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Participants ─────────────────────────────────────────────────────────────

class TournamentJoinView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_tournament(self, join_token):
        return get_object_or_404(Tournament, join_token=join_token)

    def get(self, request, join_token):
        tournament = self.get_tournament(join_token)
        return Response(TournamentSerializer(tournament).data)

    def post(self, request, join_token):
        tournament = self.get_tournament(join_token)
        participant, created = TournamentParticipant.objects.get_or_create(
            tournament=tournament, user=request.user,
        )
        return Response(
            ParticipantSerializer(participant).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class RegisterAndJoinView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, join_token):
        tournament = get_object_or_404(Tournament, join_token=join_token)
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        participant = TournamentParticipant.objects.create(tournament=tournament, user=user)
        refresh = RefreshToken.for_user(user)
        data = {
            "user": UserSerializer(user).data,
            "participant": ParticipantSerializer(participant).data,
        }
        response = Response(data, status=status.HTTP_201_CREATED)
        return _set_auth_cookies(response, refresh)


class TournamentParticipantsView(generics.ListAPIView):
    serializer_class   = ParticipantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tournament = get_object_or_404(Tournament, pk=self.kwargs["pk"])
        return TournamentParticipant.objects.filter(tournament=tournament).select_related("user")


class AddParticipantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)

        phone = request.data.get("phone", "").strip()
        if not phone:
            return Response({"detail": "Укажите номер телефона."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(phone=phone).first()
        temp_password = None
        created_user  = False

        if not user:
            name = request.data.get("name", "").strip() or f"Игрок {phone[-4:]}"
            temp_password = str(secrets.randbelow(900000) + 100000)
            try:
                rating_val = int(request.data.get("rating", 100))
            except (TypeError, ValueError):
                rating_val = 100
            user = User.objects.create_user(phone=phone, name=name, password=temp_password, rating=rating_val)
            created_user = True

        participant, joined = TournamentParticipant.objects.get_or_create(
            tournament=tournament, user=user
        )
        data = ParticipantSerializer(participant).data
        if created_user:
            data["created_user"] = True
            data["temp_password"] = temp_password
        return Response(data, status=status.HTTP_201_CREATED if joined else status.HTTP_200_OK)


class RemoveParticipantView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, participant_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        if tournament.status != Tournament.STATUS_OPEN:
            return Response(
                {"detail": "Нельзя удалить участника из уже начатого турнира."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        participant = get_object_or_404(TournamentParticipant, pk=participant_id, tournament=tournament)
        participant.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyTournamentsView(generics.ListAPIView):
    serializer_class   = TournamentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        joined_ids = TournamentParticipant.objects.filter(
            user=self.request.user
        ).values_list("tournament_id", flat=True)
        return Tournament.objects.filter(id__in=joined_ids).select_related('club')


# ─── Bracket ──────────────────────────────────────────────────────────────────

class StartTournamentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        if tournament.status != Tournament.STATUS_OPEN:
            return Response({"detail": "Турнир уже начат или завершён."}, status=status.HTTP_400_BAD_REQUEST)
        if tournament.participants.count() < 2:
            return Response({"detail": "Нужно минимум 2 участника."}, status=status.HTTP_400_BAD_REQUEST)

        if tournament.format == Tournament.FORMAT_GROUP:
            groups = generate_group_bracket(tournament)
            tournament.refresh_from_db()
            return Response({
                "tournament": TournamentSerializer(tournament).data,
                "groups": GroupSerializer(groups, many=True).data,
            })

        matches = generate_bracket(tournament)
        tournament.status = Tournament.STATUS_IN_PROGRESS
        tournament.save()

        return Response({
            "tournament": TournamentSerializer(tournament).data,
            "matches": MatchSerializer(matches, many=True).data,
        })


class MatchListView(generics.ListAPIView):
    serializer_class   = MatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tournament = get_object_or_404(Tournament, pk=self.kwargs["pk"])
        return (
            tournament.matches
            .select_related("player1", "player2", "winner")
            .order_by("round_number", "match_number")
        )


class AssignTableView(APIView):
    """
    PATCH /api/tournaments/<pk>/matches/<match_id>/table/
    Body: { table_number: int | null }
    Club admin assigns or clears a table. Also auto-starts the match.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, match_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)

        match = get_object_or_404(Match, pk=match_id, tournament=tournament)

        table_number = request.data.get("table_number")
        if table_number is not None:
            try:
                table_number = int(table_number)
                if table_number < 1:
                    raise ValueError
            except (TypeError, ValueError):
                return Response({"detail": "Номер стола должен быть положительным числом."}, status=400)

            # Validate table is not already occupied
            from .models import GroupMatch as GM
            table_busy_bracket = Match.objects.filter(
                tournament=tournament, table_number=table_number, status=Match.IN_PROGRESS,
            ).exclude(pk=match.pk).exists()
            table_busy_group = GM.objects.filter(
                group__tournament=tournament, table_number=table_number, status=GM.IN_PROGRESS,
            ).exists()
            if table_busy_bracket or table_busy_group:
                return Response(
                    {"detail": f"Стол {table_number} уже занят другим матчем."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        match.table_number = table_number
        # Starting match when table assigned, clearing when released
        if table_number is not None and match.status == Match.PENDING:
            match.status = Match.IN_PROGRESS
        elif table_number is None and match.status == Match.IN_PROGRESS:
            match.status = Match.PENDING
        match.save()
        return Response(MatchSerializer(match).data)


class TournamentTableListCreateView(APIView):
    """GET/POST /api/tournaments/<pk>/tables/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)
        tables = TournamentTable.objects.filter(tournament=tournament)
        return Response(TournamentTableSerializer(tables, many=True).data)

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        serializer = TournamentTableSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        table = serializer.save(tournament=tournament)
        return Response(TournamentTableSerializer(table).data, status=status.HTTP_201_CREATED)


class TournamentTableDetailView(APIView):
    """PATCH/DELETE /api/tournaments/<pk>/tables/<table_id>/"""
    permission_classes = [IsAuthenticated]

    def _get(self, pk, table_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        table = get_object_or_404(TournamentTable, pk=table_id, tournament=tournament)
        return tournament, table

    def patch(self, request, pk, table_id):
        tournament, table = self._get(pk, table_id)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        serializer = TournamentTableSerializer(table, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TournamentTableSerializer(table).data)

    def delete(self, request, pk, table_id):
        tournament, table = self._get(pk, table_id)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        table.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SubmitScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, match_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        match = get_object_or_404(Match, pk=match_id, tournament=tournament)

        # Permission: club admin or one of the two players
        if not _can_manage_tournament(request.user, tournament):
            if request.user != match.player1 and request.user != match.player2:
                return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)

        if match.status == Match.FINISHED:
            return Response({"detail": "Матч уже завершён."}, status=status.HTTP_400_BAD_REQUEST)
        if match.status != Match.IN_PROGRESS:
            return Response({"detail": "Матч ещё не начался."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            score1 = int(request.data["score1"])
            score2 = int(request.data["score2"])
        except (KeyError, TypeError, ValueError):
            return Response({"detail": "Укажите score1 и score2."}, status=status.HTTP_400_BAD_REQUEST)

        if score1 < 0 or score2 < 0:
            return Response({"detail": "Счёт не может быть отрицательным."}, status=400)
        if score1 == score2:
            return Response({"detail": "Ничья недопустима."}, status=400)

        match.score1  = score1
        match.score2  = score2
        match.winner  = match.player1 if score1 > score2 else match.player2
        match.status  = Match.FINISHED
        match.table_number = None
        match.save()

        loser = match.player1 if match.winner == match.player2 else match.player2
        advance_winner_and_loser(match, match.winner, loser)

        total_matches = tournament.matches.count()
        finished_matches = tournament.matches.filter(status=Match.FINISHED).count()
        if total_matches > 0 and total_matches == finished_matches:
            tournament.status = Tournament.STATUS_FINISHED
            tournament.save()

        return Response(MatchSerializer(match).data)


# ─── Group stage ─────────────────────────────────────────────────────────────

class GroupListView(generics.ListAPIView):
    """GET /api/tournaments/<pk>/groups/"""
    serializer_class   = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tournament = get_object_or_404(Tournament, pk=self.kwargs["pk"])
        return TournamentGroup.objects.filter(tournament=tournament).prefetch_related(
            'participants__user', 'matches__player1', 'matches__player2', 'matches__winner'
        )


class GroupMatchScoreView(APIView):
    """POST /api/tournaments/<pk>/groups/<group_id>/matches/<match_id>/score/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, group_id, match_id):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)

        group = get_object_or_404(TournamentGroup, pk=group_id, tournament=tournament)
        match = get_object_or_404(GroupMatch, pk=match_id, group=group)

        if match.status == GroupMatch.FINISHED:
            return Response({"detail": "Матч уже завершён."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            score1 = int(request.data["score1"])
            score2 = int(request.data["score2"])
        except (KeyError, TypeError, ValueError):
            return Response({"detail": "Укажите score1 и score2."}, status=status.HTTP_400_BAD_REQUEST)

        if score1 < 0 or score2 < 0:
            return Response({"detail": "Счёт не может быть отрицательным."}, status=400)
        if score1 == score2:
            return Response({"detail": "Ничья недопустима."}, status=400)

        match.score1 = score1
        match.score2 = score2
        match.winner = match.player1 if score1 > score2 else match.player2
        match.status = GroupMatch.FINISHED
        match.save()

        # Update GroupParticipant standings
        from .models import GroupParticipant as GP
        winner_user = match.winner
        loser_user = match.player2 if score1 > score2 else match.player1
        winner_score = max(score1, score2)
        loser_score  = min(score1, score2)

        try:
            gp_winner = GP.objects.get(group=group, user=winner_user)
            gp_winner.wins   += 1
            gp_winner.points += 3
            gp_winner.diff   += (winner_score - loser_score)
            gp_winner.save()
        except GP.DoesNotExist:
            pass

        try:
            gp_loser = GP.objects.get(group=group, user=loser_user)
            gp_loser.losses += 1
            gp_loser.diff   -= (winner_score - loser_score)
            gp_loser.save()
        except GP.DoesNotExist:
            pass

        return Response(GroupMatchSerializer(match).data)


class GroupMatchTableView(APIView):
    """PATCH /api/tournaments/<pk>/groups/<group_id>/matches/<match_id>/table/
    Body: { table_number: int | null }
    Assigns or clears a table on a group match. Also auto-starts/stops the match.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, group_id, match_id):
        from .models import TournamentGroup, GroupMatch
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        group = get_object_or_404(TournamentGroup, pk=group_id, tournament=tournament)
        match = get_object_or_404(GroupMatch, pk=match_id, group=group)

        table_number = request.data.get("table_number")
        if table_number is not None:
            try:
                table_number = int(table_number)
                if table_number < 1:
                    raise ValueError
            except (TypeError, ValueError):
                return Response({"detail": "Номер стола должен быть положительным числом."}, status=400)

            # Validate the table isn't already occupied by another in-progress match
            from .models import GroupMatch as GM
            table_busy_group = (
                GM.objects.filter(
                    group__tournament=tournament,
                    table_number=table_number,
                    status=GM.IN_PROGRESS,
                ).exclude(pk=match.pk).exists()
            )
            table_busy_bracket = Match.objects.filter(
                tournament=tournament,
                table_number=table_number,
                status=Match.IN_PROGRESS,
            ).exists()
            if table_busy_group or table_busy_bracket:
                return Response(
                    {"detail": f"Стол {table_number} уже занят другим матчем."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        match.table_number = table_number
        if table_number is not None and match.status == GroupMatch.PENDING:
            match.status = GroupMatch.IN_PROGRESS
        elif table_number is None and match.status == GroupMatch.IN_PROGRESS:
            match.status = GroupMatch.PENDING
        match.save()

        from .serializers import GroupMatchSerializer
        return Response(GroupMatchSerializer(match).data)


class StartPlayoffView(APIView):
    """POST /api/tournaments/<pk>/playoff/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament.objects.select_related('club'), pk=pk)
        if not _can_manage_tournament(request.user, tournament):
            return Response({"detail": "Нет прав."}, status=status.HTTP_403_FORBIDDEN)
        if tournament.format != Tournament.FORMAT_GROUP:
            return Response({"detail": "Плей-офф доступен только для группового формата."}, status=status.HTTP_400_BAD_REQUEST)

        # advance_count=None → advance ALL players from groups (розыгрыш всех мест)
        advance_count_raw = request.data.get("advance_count")
        advance_count = int(advance_count_raw) if advance_count_raw is not None else None
        matches = generate_playoff_from_groups(tournament, advance_count=advance_count)

        return Response({
            "tournament": TournamentSerializer(tournament).data,
            "matches": MatchSerializer(matches, many=True).data,
        })
