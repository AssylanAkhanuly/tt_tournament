from django.urls import path

from .views import (
    RatingAppealDecisionView,
    RatingAppealsView,
    RatingCardView,
    RatingCorrectionView,
    RatingEditionDraftView,
    RatingEditionsView,
    RatingJournalView,
    RatingListView,
    RatingMergeView,
    RatingNoShowView,
    RatingParamsView,
    RatingPreviewView,
)

urlpatterns = [
    path("", RatingListView.as_view(), name="rating-list"),
    path("params/", RatingParamsView.as_view(), name="rating-params"),
    path("preview/", RatingPreviewView.as_view(), name="rating-preview"),
    path("no-show/", RatingNoShowView.as_view(), name="rating-no-show"),
    path("correction/", RatingCorrectionView.as_view(), name="rating-correction"),
    path("merge/", RatingMergeView.as_view(), name="rating-merge"),
    path("editions/", RatingEditionsView.as_view(), name="rating-editions"),
    path("editions/draft/", RatingEditionDraftView.as_view(), name="rating-edition-draft"),
    path("journal/", RatingJournalView.as_view(), name="rating-journal"),
    path("appeals/", RatingAppealsView.as_view(), name="rating-appeals"),
    path("appeals/<int:pk>/decision/", RatingAppealDecisionView.as_view(), name="rating-appeal-decision"),
    path("<uuid:user_id>/", RatingCardView.as_view(), name="rating-card"),
]
