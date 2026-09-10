from django.urls import path

from .views import (
    RatingCardView,
    RatingCorrectionView,
    RatingEditionDraftView,
    RatingEditionsView,
    RatingListView,
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
    path("editions/", RatingEditionsView.as_view(), name="rating-editions"),
    path("editions/draft/", RatingEditionDraftView.as_view(), name="rating-edition-draft"),
    path("<uuid:user_id>/", RatingCardView.as_view(), name="rating-card"),
]
