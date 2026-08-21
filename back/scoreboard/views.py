import json
import time

from django.db import transaction
from django.http import StreamingHttpResponse
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Scoreboard
from .serializers import ScoreboardListItemSerializer, ScoreboardSerializer

SSE_TICK_SECONDS = 0.3  # с такой задержкой счёт появляется в эфире
# Пинг нужен не только против прокси. Под WSGI поток занят, пока соединение
# живо, а закрытую вкладку сервер замечает лишь когда пробует в неё написать.
# С редким пингом брошенные соединения держали потоки минутами и новые запросы
# вставали в очередь — поэтому пингуем часто и дёшево.
SSE_HEARTBEAT_SECONDS = 3
# И сверху ограничение по времени: поток обрывается сам, поток gunicorn и
# соединение с базой возвращаются в оборот. EventSource переподключится через
# четверть секунды (retry ниже), в эфире это незаметно.
SSE_MAX_SECONDS = 300


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

    GET answers 304 while the revision has not moved. The overlay lives on the
    stream below, but this stays the snapshot for page load and for the fallback
    when a stream cannot be held open.
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


def _stream(key):
    """Поток изменений одной доски.

    Клиент держит одно соединение вместо череды запросов. За счётом следит
    сервер: наружу уходит только то, что действительно изменилось.

    Почему слежение за строкой, а не рассылка от пишущего: gunicorn поднимает
    два процесса, общей памяти у них нет, и запись в одном не видна потоку в
    другом. Общая у них — база, поэтому смотрим на неё. Redis понадобится,
    когда таких соединений станут сотни; на табло у стола их единицы.

    Каждое открытое соединение занимает поток gunicorn на всё время жизни —
    число потоков в `nixpacks.toml` поднято с учётом этого.
    """
    last_rev = None
    last_sent = time.monotonic()
    started = time.monotonic()

    yield "retry: 250\n\n"  # после обрыва переподключаться почти сразу

    while time.monotonic() - started < SSE_MAX_SECONDS:
        # Сначала одна лишь ревизия: число по уникальному ключу. Полную строку и
        # сериализацию тратим, только когда счёт правда поменялся.
        rev = Scoreboard.objects.filter(key=key).values_list("rev", flat=True).first()
        if rev is None:
            Scoreboard.objects.get_or_create(key=key)
            continue

        if rev != last_rev:
            last_rev = rev
            board = Scoreboard.objects.get(key=key)
            payload = json.dumps(ScoreboardSerializer(board).data, ensure_ascii=False)
            yield "data: {}\n\n".format(payload)
            last_sent = time.monotonic()
        elif time.monotonic() - last_sent > SSE_HEARTBEAT_SECONDS:
            yield ": ping\n\n"
            last_sent = time.monotonic()

        time.sleep(SSE_TICK_SECONDS)

    # Вышли по сроку: соединение с базой не должно висеть вечно, а EventSource
    # переподключится сам, без участия страницы.


def scoreboard_stream(request, key):
    """GET /api/scoreboard/<key>/stream/ — поток изменений счёта (SSE).

    Обычная джанговская вьюха, а не APIView: DRF согласует типы ответа и на
    `Accept: text/event-stream` — а именно его шлёт EventSource — отвечает 406,
    не доходя до тела. Ни один рендерер DRF поток событий не отдаёт.

    Открыт так же, как чтение: браузер OBS не умеет логиниться."""
    response = StreamingHttpResponse(
        _stream(key), content_type="text/event-stream; charset=utf-8"
    )
    response["Cache-Control"] = "no-cache, no-transform"
    response["X-Accel-Buffering"] = "no"  # не буферизовать поток на прокси
    return response
