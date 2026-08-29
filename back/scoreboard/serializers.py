from rest_framework import serializers

from .models import (
    CARD_CHOICES,
    MAX_GAMES,
    MAX_POINTS,
    MODE_CHOICES,
    SERVER_CHOICES,
    Scoreboard,
)


class PlayerSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=40, allow_blank=True)
    # Второй игрок стороны; в эфир идёт, когда разряд парный.
    name2 = serializers.CharField(max_length=40, allow_blank=True)
    country = serializers.CharField(max_length=3, allow_blank=True)
    games = serializers.IntegerField(min_value=0, max_value=MAX_GAMES)
    points = serializers.IntegerField(min_value=0, max_value=MAX_POINTS)
    timeout = serializers.BooleanField()
    card = serializers.ChoiceField(choices=[value for value, _ in CARD_CHOICES])


class TeamSerializer(serializers.Serializer):
    """Счёт командной встречи и названия команд. Показывается при mode=team."""

    left = serializers.IntegerField(min_value=0, max_value=MAX_GAMES)
    right = serializers.IntegerField(min_value=0, max_value=MAX_GAMES)
    left_name = serializers.CharField(max_length=24, allow_blank=True)
    right_name = serializers.CharField(max_length=24, allow_blank=True)


class ScoreboardSerializer(serializers.Serializer):
    """Wire shape of a board. Players are nested so both sides share one type on
    the front; the columns are flat so they stay queryable and admin-readable.
    That mapping lives here and nowhere else."""

    key = serializers.SlugField(read_only=True)
    title = serializers.CharField(read_only=True)
    rev = serializers.IntegerField(read_only=True)

    # Разряд встречи: одиночный | парный | командный.
    mode = serializers.ChoiceField(choices=[value for value, _ in MODE_CHOICES])

    # Кто подавал первым в партии; текущий подающий выводится по счёту.
    first_server = serializers.ChoiceField(choices=[value for value, _ in SERVER_CHOICES])
    match_label = serializers.CharField(max_length=12, allow_blank=True)
    round_label = serializers.CharField(max_length=16, allow_blank=True)
    best_of = serializers.ChoiceField(choices=[5, 7])
    status_lang = serializers.ChoiceField(choices=["ru", "en"])
    # null — подпись считается по счёту, "" — оператор её убрал.
    status_override = serializers.CharField(max_length=24, allow_blank=True, allow_null=True)
    visible = serializers.BooleanField()

    left = PlayerSerializer()
    right = PlayerSerializer()
    team = TeamSerializer()

    def to_representation(self, board):
        return {
            "key": board.key,
            "title": board.title,
            "rev": board.rev,
            "mode": board.mode,
            "first_server": board.first_server,
            "match_label": board.match_label,
            "round_label": board.round_label,
            "best_of": board.best_of,
            "status_lang": board.status_lang,
            "status_override": board.status_override,
            "visible": board.visible,
            "left": {
                "name": board.left_name,
                "name2": board.left_name2,
                "country": board.left_country,
                "games": board.left_games,
                "points": board.left_points,
                "timeout": board.left_timeout,
                "card": board.left_card,
            },
            "right": {
                "name": board.right_name,
                "name2": board.right_name2,
                "country": board.right_country,
                "games": board.right_games,
                "points": board.right_points,
                "timeout": board.right_timeout,
                "card": board.right_card,
            },
            "team": {
                "left": board.team_left,
                "right": board.team_right,
                "left_name": board.team_left_name,
                "right_name": board.team_right_name,
            },
        }

    def update(self, board, validated):
        board.mode = validated["mode"]
        board.match_label = validated["match_label"]
        board.round_label = validated["round_label"]
        board.best_of = validated["best_of"]
        board.status_lang = validated["status_lang"]
        board.status_override = validated["status_override"]
        board.visible = validated["visible"]
        board.first_server = validated["first_server"]

        for side in ("left", "right"):
            player = validated[side]
            setattr(board, side + "_name", player["name"])
            setattr(board, side + "_name2", player["name2"])
            setattr(board, side + "_timeout", player["timeout"])
            setattr(board, side + "_card", player["card"])
            setattr(board, side + "_country", player["country"].upper())
            setattr(board, side + "_games", player["games"])
            setattr(board, side + "_points", player["points"])

        board.team_left = validated["team"]["left"]
        board.team_right = validated["team"]["right"]
        board.team_left_name = validated["team"]["left_name"]
        board.team_right_name = validated["team"]["right_name"]

        board.rev += 1
        board.save()
        return board


class ScoreboardListItemSerializer(serializers.ModelSerializer):
    """Short row for the panel's board picker — a tournament can stream several
    tables at once, each with its own board."""

    class Meta:
        model = Scoreboard
        fields = ["key", "title", "tournament", "table_number", "rev", "updated_at"]
        read_only_fields = fields
