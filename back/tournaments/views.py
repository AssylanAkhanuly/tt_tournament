from django.db.models import Max
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from users.serializers import RegisterSerializer, UserSerializer
from users.views import _set_auth_cookies

from .bracket import advance_winner, generate_bracket
from .models import Match, Tournament, TournamentParticipant
from .serializers import (
    MatchSerializer,
    ParticipantSerializer,
    TournamentCreateSerializer,
    TournamentSerializer,
)


class TournamentListCreateView(generics.ListCreateAPIView):
    queryset = Tournament.objects.all()
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TournamentCreateSerializer
        return TournamentSerializer

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response(
                {"detail": "Только администраторы могут создавать турниры."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TournamentCreateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        tournament = serializer.save()
        return Response(TournamentSerializer(tournament).data, status=status.HTTP_201_CREATED)


class TournamentDetailView(generics.RetrieveAPIView):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer
    permission_classes = [AllowAny]


class TournamentJoinView(APIView):
    """
    GET  /api/tournaments/join/<join_token>/  → fetch tournament info (public)
    POST /api/tournaments/join/<join_token>/  → join tournament (authenticated)
    """

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
            tournament=tournament,
            user=request.user,
        )
        return Response(
            ParticipantSerializer(participant).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class RegisterAndJoinView(APIView):
    """
    POST /api/tournaments/join/<join_token>/register/
    Register a new user and immediately join the tournament — single request.
    """
    permission_classes = [AllowAny]

    def post(self, request, join_token):
        tournament = get_object_or_404(Tournament, join_token=join_token)

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        participant = TournamentParticipant.objects.create(
            tournament=tournament,
            user=user,
        )

        refresh = RefreshToken.for_user(user)
        data = {
            "user": UserSerializer(user).data,
            "participant": ParticipantSerializer(participant).data,
        }
        response = Response(data, status=status.HTTP_201_CREATED)
        return _set_auth_cookies(response, refresh)


class TournamentParticipantsView(generics.ListAPIView):
    serializer_class = ParticipantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tournament = get_object_or_404(Tournament, pk=self.kwargs["pk"])
        return TournamentParticipant.objects.filter(tournament=tournament).select_related("user")


class MyTournamentsView(generics.ListAPIView):
    serializer_class = TournamentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        joined_ids = TournamentParticipant.objects.filter(
            user=self.request.user
        ).values_list("tournament_id", flat=True)
        return Tournament.objects.filter(id__in=joined_ids)


# ─── Bracket: start, list matches, submit score ───────────────────────────────

class StartTournamentView(APIView):
    """
    POST /api/tournaments/<pk>/start/
    Admin-only: generate the single-elimination bracket and flip status to in_progress.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        tournament = get_object_or_404(Tournament, pk=pk)

        if not request.user.is_staff:
            return Response(
                {"detail": "Только администраторы могут начинать турниры."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if tournament.status != Tournament.STATUS_OPEN:
            return Response(
                {"detail": "Турнир уже начат или завершён."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if tournament.participants.count() < 2:
            return Response(
                {"detail": "Нужно минимум 2 участника для начала турнира."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        matches = generate_bracket(tournament)
        tournament.status = Tournament.STATUS_IN_PROGRESS
        tournament.save()

        return Response({
            "tournament": TournamentSerializer(tournament).data,
            "matches": MatchSerializer(matches, many=True).data,
        })


class MatchListView(generics.ListAPIView):
    """GET /api/tournaments/<pk>/matches/"""
    serializer_class = MatchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        tournament = get_object_or_404(Tournament, pk=self.kwargs["pk"])
        return (
            tournament.matches
            .select_related("player1", "player2", "winner")
            .order_by("round_number", "match_number")
        )


class SubmitScoreView(APIView):
    """
    POST /api/tournaments/<pk>/matches/<match_id>/score/
    Body: { score1: int, score2: int }
    Allowed for: admins, or the two players in the match.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, match_id):
        tournament = get_object_or_404(Tournament, pk=pk)
        match = get_object_or_404(Match, pk=match_id, tournament=tournament)

        # Permission check
        if not request.user.is_staff:
            if request.user != match.player1 and request.user != match.player2:
                return Response(
                    {"detail": "Вы не являетесь участником этого матча."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        if match.status == Match.FINISHED:
            return Response(
                {"detail": "Матч уже завершён."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if match.status != Match.IN_PROGRESS:
            return Response(
                {"detail": "Матч ещё не начался."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate scores
        try:
            score1 = int(request.data["score1"])
            score2 = int(request.data["score2"])
        except (KeyError, TypeError, ValueError):
            return Response(
                {"detail": "Укажите целочисленный счёт для обоих игроков (score1, score2)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if score1 < 0 or score2 < 0:
            return Response({"detail": "Счёт не может быть отрицательным."}, status=status.HTTP_400_BAD_REQUEST)

        if score1 == score2:
            return Response(
                {"detail": "Ничья недопустима — один из игроков должен победить."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Record result
        match.score1 = score1
        match.score2 = score2
        match.winner = match.player1 if score1 > score2 else match.player2
        match.status = Match.FINISHED
        match.save()

        # Advance winner to next round
        advance_winner(tournament, match.round_number, match.match_number, match.winner)

        # Check if the tournament is over (final match done)
        max_round = tournament.matches.aggregate(mx=Max("round_number"))["mx"]
        if max_round:
            final = tournament.matches.filter(round_number=max_round).first()
            if final and final.status == Match.FINISHED:
                tournament.status = Tournament.STATUS_FINISHED
                tournament.save()

        return Response(MatchSerializer(match).data)
