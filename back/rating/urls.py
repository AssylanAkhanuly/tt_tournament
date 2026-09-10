from django.urls import path

from .views import (
    RatingAthletesView,
    RatingCardView,
    RatingCorrectionView,
    RatingListView,
    RatingMergeView,
    RatingNoShowView,
    RatingProtocolMatchesView,
    RatingProtocolMatchView,
    RatingProtocolParticipantsView,
    RatingProtocolParticipantView,
    RatingProtocolPreviewView,
    RatingProtocolReworkView,
    RatingProtocolsView,
    RatingProtocolView,
)

urlpatterns = [
    path("", RatingListView.as_view(), name="rating-list"),
    path("athletes/", RatingAthletesView.as_view(), name="rating-athletes"),
    path("no-show/", RatingNoShowView.as_view(), name="rating-no-show"),
    path("correction/", RatingCorrectionView.as_view(), name="rating-correction"),
    path("merge/", RatingMergeView.as_view(), name="rating-merge"),
    path("protocols/", RatingProtocolsView.as_view(), name="rating-protocols"),
    path("protocols/<str:pk>/", RatingProtocolView.as_view(), name="rating-protocol"),
    path("protocols/<str:pk>/preview/", RatingProtocolPreviewView.as_view(), name="rating-protocol-preview"),
    path("protocols/<str:pk>/rework/", RatingProtocolReworkView.as_view(), name="rating-protocol-rework"),
    path("protocols/<str:pk>/participants/", RatingProtocolParticipantsView.as_view(), name="rating-protocol-participants"),
    path(
        "protocols/<str:pk>/participants/<uuid:user_id>/",
        RatingProtocolParticipantView.as_view(),
        name="rating-protocol-participant",
    ),
    path("protocols/<str:pk>/matches/", RatingProtocolMatchesView.as_view(), name="rating-protocol-matches"),
    path("protocols/<str:pk>/matches/<str:mid>/", RatingProtocolMatchView.as_view(), name="rating-protocol-match"),
    path("<uuid:user_id>/", RatingCardView.as_view(), name="rating-card"),
]
