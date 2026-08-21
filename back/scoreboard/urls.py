from django.urls import path

from .views import ScoreboardListView, ScoreboardView

urlpatterns = [
    path("", ScoreboardListView.as_view(), name="scoreboard-list"),
    path("<slug:key>/", ScoreboardView.as_view(), name="scoreboard-detail"),
]
