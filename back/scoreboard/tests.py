from itertools import islice

from django.test import TestCase
from rest_framework.test import APIClient

from .models import Scoreboard
from .views import _stream

CLEAN = {
    "mode": "single",
    "match_label": "MT",
    "round_label": "R 16",
    "best_of": 5,
    "status_lang": "en",
    "status_override": None,
    "visible": True,
    "first_server": "",
    "left": {"name": "", "name2": "", "country": "", "games": 0, "points": 0,
             "timeout": False, "card": ""},
    "right": {"name": "", "name2": "", "country": "", "games": 0, "points": 0,
              "timeout": False, "card": ""},
    "team": {"left": 0, "right": 0, "left_name": "", "right_name": ""},
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
        self.assertEqual(response.data["mode"], "single")  # новая доска — одиночный разряд
        self.assertEqual(response.data["left"]["points"], 0)
        self.assertTrue(Scoreboard.objects.filter(key="main").exists())

    def test_put_stores_score_and_bumps_revision(self):
        self.client.get("/api/scoreboard/main/")
        response = self.client.put(
            "/api/scoreboard/main/",
            payload(0, left=dict(CLEAN["left"], name="Герасименко", country="kaz",
                                 games=1, points=9)),
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
            payload(0, best_of=3, left=dict(CLEAN["left"], name="x", country="KZ", points=500)),
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
            payload(0, left=dict(CLEAN["left"], name="A", country="KAZ", points=7)),
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


class ScoreboardServeAndCardsTests(TestCase):
    """Поля из замечаний федерации 22.08.2026: подача, пары, тайм-аут, карточки."""

    def setUp(self):
        self.client = APIClient()
        self.client.get("/api/scoreboard/main/")

    def test_stores_serve_pair_timeout_and_card(self):
        response = self.client.put(
            "/api/scoreboard/main/",
            payload(
                0,
                first_server="left2",
                left=dict(CLEAN["left"], name="Герасименко", name2="Колодяжный",
                          timeout=True, card="yellow"),
            ),
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["first_server"], "left2")
        self.assertEqual(response.data["left"]["name2"], "Колодяжный")
        self.assertTrue(response.data["left"]["timeout"])
        self.assertEqual(response.data["left"]["card"], "yellow")

    def test_stores_mode_and_team_names(self):
        """Командная встреча: разряд и названия команд для верхней строки плашки."""
        response = self.client.put(
            "/api/scoreboard/main/",
            payload(
                0,
                mode="team",
                team={"left": 3, "right": 2, "left_name": "SPAIN", "right_name": "GERMANY"},
            ),
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["mode"], "team")
        self.assertEqual(response.data["team"]["left"], 3)
        self.assertEqual(response.data["team"]["left_name"], "SPAIN")
        self.assertEqual(response.data["team"]["right_name"], "GERMANY")

    def test_unknown_card_server_and_mode_are_rejected(self):
        for field, body in (
            ("card", payload(0, left=dict(CLEAN["left"], card="blue"))),
            ("first_server", payload(0, first_server="left3")),
            ("mode", payload(0, mode="mixed")),
        ):
            response = self.client.put("/api/scoreboard/main/", body, format="json")
            self.assertEqual(response.status_code, 400, field)
