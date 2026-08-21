from django.urls import path

from .views import ScoreboardListView, ScoreboardStreamView, ScoreboardView

urlpatterns = [
    path("", ScoreboardListView.as_view(), name="scoreboard-list"),
    path("<slug:key>/", ScoreboardView.as_view(), name="scoreboard-detail"),
    path("<slug:key>/stream/", ScoreboardStreamView.as_view(), name="scoreboard-stream"),
]
