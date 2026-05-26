from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from users.serializers import RegisterSerializer, UserSerializer
from users.views import _set_auth_cookies

from .models import Tournament, TournamentParticipant
from .serializers import ParticipantSerializer, TournamentCreateSerializer, TournamentSerializer


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
