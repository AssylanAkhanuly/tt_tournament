from django.urls import path

from .views import ScoreboardListView, ScoreboardView, scoreboard_stream

urlpatterns = [
    path("", ScoreboardListView.as_view(), name="scoreboard-list"),
    path("<slug:key>/", ScoreboardView.as_view(), name="scoreboard-detail"),
    path("<slug:key>/stream/", scoreboard_stream, name="scoreboard-stream"),
]
