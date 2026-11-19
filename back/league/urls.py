from django.urls import path

from . import views

urlpatterns = [
    path("rules/", views.RulesView.as_view(), name="league-rules"),
    path("seasons/", views.SeasonsView.as_view(), name="league-seasons"),
    path("seasons/<uuid:pk>/", views.SeasonView.as_view(), name="league-season"),
    path("divisions/", views.DivisionsView.as_view(), name="league-divisions"),
    path("divisions/<uuid:pk>/", views.DivisionView.as_view(), name="league-division"),
    path("divisions/<uuid:pk>/teams/", views.DivisionTeamsView.as_view(), name="league-division-teams"),
    path("divisions/<uuid:pk>/tours/", views.DivisionToursView.as_view(), name="league-division-tours"),
    path("my/", views.MyLeagueView.as_view(), name="league-my"),
    path("teams/<uuid:pk>/", views.TeamView.as_view(), name="league-team"),
    path("teams/<uuid:pk>/decide/", views.TeamDecideView.as_view(), name="league-team-decide"),
    path("teams/<uuid:pk>/resubmit/", views.TeamResubmitView.as_view(), name="league-team-resubmit"),
    path("teams/<uuid:pk>/members/", views.TeamMembersView.as_view(), name="league-team-members"),
    path("teams/<uuid:pk>/members/<uuid:user_id>/", views.TeamMemberView.as_view(), name="league-team-member"),
    path("teams/<uuid:pk>/candidates/", views.TeamCandidatesView.as_view(), name="league-team-candidates"),
    path("tours/<uuid:pk>/", views.TourView.as_view(), name="league-tour"),
    path("team-matches/<int:pk>/", views.TeamMatchView.as_view(), name="league-team-match"),
    path("team-matches/<int:pk>/result/", views.TeamMatchResultView.as_view(), name="league-team-match-result"),
    path("team-matches/<int:pk>/no-show/", views.TeamMatchNoShowView.as_view(), name="league-team-match-no-show"),
]
