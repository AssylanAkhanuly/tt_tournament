from django.db import transaction
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Scoreboard
from .serializers import ScoreboardListItemSerializer, ScoreboardSerializer


def etag_for(board):
    """Board state is fully identified by its revision — no need to hash a body."""
    return 'W/"{}-{}"'.format(board.key, board.rev)


class ScoreboardListView(APIView):
    """GET /api/scoreboard/ — boards that exist, for the panel's picker."""

    permission_classes = [AllowAny]

    def get(self, request):
        boards = Scoreboard.objects.all()
        tournament = request.query_params.get("tournament")
        if tournament:
            boards = boards.filter(tournament_id=tournament)
        return Response({"boards": ScoreboardListItemSerializer(boards, many=True).data})


class ScoreboardView(APIView):
    """GET /api/scoreboard/<key>/ — current score of one table.
    PUT /api/scoreboard/<key>/ — store a new state.

    Open on purpose: the OBS browser source cannot log in, and the score is on
    air anyway. Writes still need a gate before this is published to the
    internet — see README, «Что закрыть перед публикацией».

    The overlay polls this a few times a second, so GET answers 304 while the
    revision has not moved: no serialization, no body, just a header.
    """

    permission_classes = [AllowAny]

    def get(self, request, key):
        board, _ = Scoreboard.objects.get_or_create(key=key)
        etag = etag_for(board)
        if request.headers.get("If-None-Match") == etag:
            response = Response(status=status.HTTP_304_NOT_MODIFIED)
            response["ETag"] = etag
            return response

        response = Response(ScoreboardSerializer(board).data)
        response["ETag"] = etag
        return response

    def put(self, request, key):
        with transaction.atomic():
            Scoreboard.objects.get_or_create(key=key)
            # Lock this row only: boards of other tables keep writing meanwhile.
            board = Scoreboard.objects.select_for_update().get(key=key)

            # The panel sends the revision it started from. A mismatch means
            # another panel wrote in between — give it the current state back
            # instead of dropping that write.
            if request.data.get("rev") != board.rev:
                return Response(
                    ScoreboardSerializer(board).data,
                    status=status.HTTP_409_CONFLICT,
                )

            serializer = ScoreboardSerializer(board, data=request.data)
            serializer.is_valid(raise_exception=True)
            board = serializer.save()

        response = Response(ScoreboardSerializer(board).data)
        response["ETag"] = etag_for(board)
        return response
