from rest_framework import serializers

from .models import MAX_GAMES, MAX_POINTS, Scoreboard


class PlayerSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=40, allow_blank=True)
    country = serializers.CharField(max_length=3, allow_blank=True)
    games = serializers.IntegerField(min_value=0, max_value=MAX_GAMES)
    points = serializers.IntegerField(min_value=0, max_value=MAX_POINTS)


class TeamSerializer(serializers.Serializer):
    enabled = serializers.BooleanField()
    left = serializers.IntegerField(min_value=0, max_value=MAX_GAMES)
    right = serializers.IntegerField(min_value=0, max_value=MAX_GAMES)


class ScoreboardSerializer(serializers.Serializer):
    """Wire shape of a board. Players are nested so both sides share one type on
    the front; the columns are flat so they stay queryable and admin-readable.
    That mapping lives here and nowhere else."""

    key = serializers.SlugField(read_only=True)
    title = serializers.CharField(read_only=True)
    rev = serializers.IntegerField(read_only=True)

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
            "match_label": board.match_label,
            "round_label": board.round_label,
            "best_of": board.best_of,
            "status_lang": board.status_lang,
            "status_override": board.status_override,
            "visible": board.visible,
            "left": {
                "name": board.left_name,
                "country": board.left_country,
                "games": board.left_games,
                "points": board.left_points,
            },
            "right": {
                "name": board.right_name,
                "country": board.right_country,
                "games": board.right_games,
                "points": board.right_points,
            },
            "team": {
                "enabled": board.team_enabled,
                "left": board.team_left,
                "right": board.team_right,
            },
        }

    def update(self, board, validated):
        board.match_label = validated["match_label"]
        board.round_label = validated["round_label"]
        board.best_of = validated["best_of"]
        board.status_lang = validated["status_lang"]
        board.status_override = validated["status_override"]
        board.visible = validated["visible"]

        for side in ("left", "right"):
            player = validated[side]
            setattr(board, side + "_name", player["name"])
            setattr(board, side + "_country", player["country"].upper())
            setattr(board, side + "_games", player["games"])
            setattr(board, side + "_points", player["points"])

        board.team_enabled = validated["team"]["enabled"]
        board.team_left = validated["team"]["left"]
        board.team_right = validated["team"]["right"]

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
