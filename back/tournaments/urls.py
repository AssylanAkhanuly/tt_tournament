from django.urls import path
from .views import (
    MyTournamentsView,
    RegisterAndJoinView,
    TournamentDetailView,
    TournamentJoinView,
    TournamentListCreateView,
    TournamentParticipantsView,
)

urlpatterns = [
    path("", TournamentListCreateView.as_view(), name="tournament-list-create"),
    path("my/", MyTournamentsView.as_view(), name="tournament-my"),
    path("<uuid:pk>/", TournamentDetailView.as_view(), name="tournament-detail"),
    path("<uuid:pk>/participants/", TournamentParticipantsView.as_view(), name="tournament-participants"),
    path("join/<uuid:join_token>/", TournamentJoinView.as_view(), name="tournament-join"),
    path("join/<uuid:join_token>/register/", RegisterAndJoinView.as_view(), name="tournament-register-join"),
]
