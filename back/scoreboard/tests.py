from itertools import islice

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Scoreboard
from .views import _stream

CLEAN = {
    "match_label": "MT",
    "round_label": "R 16",
    "best_of": 5,
    "status_lang": "en",
    "status_override": None,
    "visible": True,
    "left": {"name": "", "country": "", "games": 0, "points": 0},
    "right": {"name": "", "country": "", "games": 0, "points": 0},
    "team": {"enabled": False, "left": 0, "right": 0},
}


def payload(rev, **changes):
    body = dict(CLEAN, rev=rev)
    body.update(changes)
    return body


class ScoreboardApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_creates_board_with_defaults(self):
        response = self.client.get("/api/scoreboard/main/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["rev"], 0)
        self.assertEqual(response.data["left"]["points"], 0)
        self.assertTrue(Scoreboard.objects.filter(key="main").exists())

    def test_put_stores_score_and_bumps_revision(self):
        self.client.get("/api/scoreboard/main/")
        response = self.client.put(
            "/api/scoreboard/main/",
            payload(0, left={"name": "Герасименко", "country": "kaz", "games": 1, "points": 9}),
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["rev"], 1)
        self.assertEqual(response.data["left"]["points"], 9)
        # Код страны приводим к верхнему регистру: он идёт в эфир как есть.
        self.assertEqual(response.data["left"]["country"], "KAZ")

    def test_stale_revision_is_rejected_with_current_state(self):
        """Второй пульт записал первым — наш ответ не должен затирать его счёт."""
        self.client.get("/api/scoreboard/main/")
        self.client.put("/api/scoreboard/main/", payload(0, visible=False), format="json")

        response = self.client.put("/api/scoreboard/main/", payload(0), format="json")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["rev"], 1)
        self.assertFalse(response.data["visible"])  # чужая запись уцелела

    def test_invalid_values_are_rejected(self):
        self.client.get("/api/scoreboard/main/")
        response = self.client.put(
            "/api/scoreboard/main/",
            payload(0, best_of=3, left={"name": "x", "country": "KZ", "games": 0, "points": 500}),
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("best_of", response.data)
        self.assertIn("points", response.data["left"])

    def test_unchanged_board_answers_304(self):
        """Оверлей опрашивает счёт несколько раз в секунду — пока ревизия не
        сдвинулась, ответ должен быть без тела."""
        first = self.client.get("/api/scoreboard/main/")
        etag = first["ETag"]

        again = self.client.get("/api/scoreboard/main/", HTTP_IF_NONE_MATCH=etag)
        self.assertEqual(again.status_code, 304)

        self.client.put("/api/scoreboard/main/", payload(0), format="json")
        after_write = self.client.get("/api/scoreboard/main/", HTTP_IF_NONE_MATCH=etag)
        self.assertEqual(after_write.status_code, 200)

    def test_boards_are_independent(self):
        """Турнир транслирует несколько столов сразу: запись в один стол не
        должна трогать другой."""
        self.client.get("/api/scoreboard/table-1/")
        self.client.get("/api/scoreboard/table-2/")

        self.client.put(
            "/api/scoreboard/table-1/",
            payload(0, left={"name": "A", "country": "KAZ", "games": 0, "points": 7}),
            format="json",
        )

        first = self.client.get("/api/scoreboard/table-1/")
        second = self.client.get("/api/scoreboard/table-2/")
        self.assertEqual(first.data["left"]["points"], 7)
        self.assertEqual(second.data["left"]["points"], 0)
        self.assertEqual(second.data["rev"], 0)

    def test_list_shows_boards(self):
        self.client.get("/api/scoreboard/table-1/")
        self.client.get("/api/scoreboard/table-2/")

        response = self.client.get("/api/scoreboard/")
        keys = [board["key"] for board in response.data["boards"]]
        self.assertEqual(keys, ["table-1", "table-2"])


class ScoreboardStreamTests(TestCase):
    """Поток проверяем на самом генераторе, а не через клиент: у клиента он
    крутился бы до таймаута, а нам нужны первые кадры."""

    def test_stream_opens_with_current_score(self):
        Scoreboard.objects.create(key="main", left_points=7)

        frames = list(islice(_stream("main"), 2))

        self.assertEqual(frames[0], "retry: 250\n\n")  # интервал переподключения
        self.assertTrue(frames[1].startswith("data: "))
        self.assertIn('"points": 7', frames[1])

    def test_stream_sends_frame_only_after_score_changes(self):
        board = Scoreboard.objects.create(key="main")
        stream = _stream("main")
        list(islice(stream, 2))  # retry + снимок

        board.left_points = 3
        board.rev += 1
        board.save()

        frame = next(stream)
        self.assertIn('"points": 3', frame)

    def test_stream_accepts_event_stream_header(self):
        """EventSource шлёт `Accept: text/event-stream`. Под DRF это давало 406:
        согласование типов отвергало запрос, не доходя до тела."""
        client = APIClient()
        response = client.get("/api/scoreboard/main/stream/", HTTP_ACCEPT="text/event-stream")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "text/event-stream; charset=utf-8")
        response.close()  # не вычитываем поток: он крутится до таймаута
