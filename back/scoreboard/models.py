from django.core.validators import MaxValueValidator
from django.db import models

MAX_GAMES = 9
MAX_POINTS = 99

CARD_NONE = ""
CARD_YELLOW = "yellow"
CARD_RED = "red"
CARD_CHOICES = [(CARD_NONE, "Нет"), (CARD_YELLOW, "Жёлтая"), (CARD_RED, "Красная")]

# Разряд встречи. Его выбирают таббаром на пульте, и от него зависит, что видно
# в эфире: вторая фамилия стороны (пара) или счёт команд сверху (командная).
MODE_SINGLE = "single"
MODE_DOUBLES = "doubles"
MODE_TEAM = "team"
MODE_CHOICES = [
    (MODE_SINGLE, "Одиночный"),
    (MODE_DOUBLES, "Парный"),
    (MODE_TEAM, "Командный"),
]

# Кто подавал первым в текущей партии. Текущий подающий из этого выводится по
# счёту, поэтому оператору не нужно щёлкать подачу каждые два очка.
SERVER_CHOICES = [
    ("", "Не задан"),
    ("left1", "Слева, первый"),
    ("left2", "Слева, второй"),
    ("right1", "Справа, первый"),
    ("right2", "Справа, второй"),
]


class Scoreboard(models.Model):
    """Live score of one streamed table: the operator's control panel writes it,
    the OBS overlay reads it. The row is the only thing both sides share, since
    gunicorn serves them from separate worker processes with separate memory.

    One row per board, addressed by `key` — that is what lets a tournament stream
    several tables at once: every table gets its own row, its own overlay URL and
    its own control panel, and writes to one never touch another (the write locks
    a single row).

    `tournament` + `table_number` bind a board to a real table so names can be
    pulled from the draw instead of typed by hand; both stay optional, because a
    board is also used for friendlies that live in no tournament.

    `mode` is the discipline of the match — single, doubles or a team tie. It is
    what the panel's top tab bar sets, and it decides what goes on air: the
    side's second name in doubles, the teams' overall score on top in a team tie.

    `rev` grows on every write. A panel sends back the rev it started from, so a
    second panel that wrote in between is answered with 409 instead of being
    silently overwritten."""

    key = models.SlugField(
        max_length=40,
        unique=True,
        help_text="Адрес плашки: /scoreboard/overlay?board=<key>",
    )
    title = models.CharField(max_length=60, blank=True, default="", help_text="Например «Стол 3»")

    tournament = models.ForeignKey(
        "tournaments.Tournament",
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name="scoreboards",
    )
    table_number = models.PositiveSmallIntegerField(null=True, blank=True)

    rev = models.PositiveIntegerField(default=0)

    mode = models.CharField(max_length=8, choices=MODE_CHOICES, default=MODE_SINGLE)

    first_server = models.CharField(
        max_length=6, choices=SERVER_CHOICES, blank=True, default=""
    )

    match_label = models.CharField(max_length=12, blank=True, default="MT")
    round_label = models.CharField(max_length=16, blank=True, default="R 16")
    best_of = models.PositiveSmallIntegerField(
        choices=[(5, "До 3 побед"), (7, "До 4 побед")], default=5
    )
    status_lang = models.CharField(
        max_length=2, choices=[("ru", "Русский"), ("en", "English")], default="en"
    )
    # Three states, hence null: None — caption is computed from the score,
    # "" — operator cleared it on purpose, text — operator typed their own.
    status_override = models.CharField(max_length=24, blank=True, null=True, default=None)
    visible = models.BooleanField(default=True)

    left_name = models.CharField(max_length=40, blank=True, default="")
    # Второй игрок стороны; показывается, когда разряд парный (`mode`).
    left_name2 = models.CharField(max_length=40, blank=True, default="")
    left_country = models.CharField(max_length=3, blank=True, default="")
    left_games = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(MAX_GAMES)]
    )
    left_points = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(MAX_POINTS)]
    )
    left_timeout = models.BooleanField(default=False)  # тайм-аут взят
    left_card = models.CharField(max_length=6, choices=CARD_CHOICES, blank=True, default=CARD_NONE)

    right_name = models.CharField(max_length=40, blank=True, default="")
    # Второй игрок стороны; показывается, когда разряд парный (`mode`).
    right_name2 = models.CharField(max_length=40, blank=True, default="")
    right_country = models.CharField(max_length=3, blank=True, default="")
    right_games = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(MAX_GAMES)]
    )
    right_points = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(MAX_POINTS)]
    )
    right_timeout = models.BooleanField(default=False)  # тайм-аут взят
    right_card = models.CharField(max_length=6, choices=CARD_CHOICES, blank=True, default=CARD_NONE)

    # Счёт всей командной встречи — верхняя строка плашки в режиме `team`.
    # Названия команд: пусто — в эфире остаётся код страны стороны.
    team_left_name = models.CharField(max_length=24, blank=True, default="")
    team_right_name = models.CharField(max_length=24, blank=True, default="")
    team_left = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(MAX_GAMES)]
    )
    team_right = models.PositiveSmallIntegerField(
        default=0, validators=[MaxValueValidator(MAX_GAMES)]
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]
        indexes = [
            models.Index(fields=["tournament", "table_number"]),
        ]
        constraints = [
            # Один стол турнира — одна плашка. На плашки без турнира не влияет.
            models.UniqueConstraint(
                fields=["tournament", "table_number"],
                condition=models.Q(tournament__isnull=False, table_number__isnull=False),
                name="uniq_scoreboard_per_tournament_table",
            ),
        ]

    def __str__(self):
        return self.title or self.key
