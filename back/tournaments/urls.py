from django.urls import path
from .views import (
    MatchListView,
    MyTournamentsView,
    RegisterAndJoinView,
    StartTournamentView,
    SubmitScoreView,
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
    path("<uuid:pk>/start/", StartTournamentView.as_view(), name="tournament-start"),
    path("<uuid:pk>/matches/", MatchListView.as_view(), name="tournament-matches"),
    path("<uuid:pk>/matches/<int:match_id>/score/", SubmitScoreView.as_view(), name="tournament-score"),
    path("join/<uuid:join_token>/", TournamentJoinView.as_view(), name="tournament-join"),
    path("join/<uuid:join_token>/register/", RegisterAndJoinView.as_view(), name="tournament-register-join"),
]
