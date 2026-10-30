from rest_framework import serializers
from .models import Match, Tournament, TournamentParticipant, TournamentTable, TournamentGroup, GroupParticipant, GroupMatch, ScoreLog
from users.serializers import UserSerializer


class TournamentSerializer(serializers.ModelSerializer):
    created_by        = UserSerializer(read_only=True)
    participant_count = serializers.SerializerMethodField()
    club_id           = serializers.SerializerMethodField()
    club_name         = serializers.SerializerMethodField()
    is_registered     = serializers.SerializerMethodField()
    referee_recruitment_active = serializers.SerializerMethodField()
    player_recruitment_active = serializers.SerializerMethodField()

    class Meta:
        model  = Tournament
        fields = [
            "id", "name", "description", "join_token",
            "created_by", "created_at", "starts_at",
            "participant_count", "status",
            "club_id", "club_name",
            "format", "group_size",
            "is_registered",
            "referee_recruitment_open", "referee_recruitment_until", "referee_recruitment_active",
            "player_recruitment_open", "player_recruitment_until", "player_recruitment_active",
            "ends_at", "city", "venue", "age_min", "age_max",
            "level", "games_to_win", "is_rating",
        ]
        read_only_fields = [
            "id", "join_token", "created_by", "created_at", "participant_count", "status", "is_registered",
            "referee_recruitment_open", "referee_recruitment_until",
            "player_recruitment_open", "player_recruitment_until",
        ]

    def get_referee_recruitment_active(self, obj):
        """Приём заявок судей идёт сегодня: переключатель и срок (`recruitment.py`)."""
        return obj.referee_recruitment_active()

    def get_player_recruitment_active(self, obj):
        """Приём заявок игроков идёт сегодня: переключатель и срок."""
        return obj.player_recruitment_active()

    def get_participant_count(self, obj):
        # List views annotate this to avoid an N+1 COUNT per tournament; single-
        # object views fall back to a direct count.
        anno = getattr(obj, "participant_count_anno", None)
        return anno if anno is not None else obj.participants.count()

    def get_club_id(self, obj):
        return str(obj.club_id) if obj.club_id else None

    def get_club_name(self, obj):
        return obj.club.name if obj.club else None

    def get_is_registered(self, obj):
        """Whether the requesting user is already a participant. Lets the
        tournament list/detail render a 'registered' state instead of a join
        button. The list view pre-loads ``joined_tournament_ids`` into context
        to avoid an N+1 query."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        joined = self.context.get("joined_tournament_ids")
        if joined is not None:
            return obj.id in joined
        return obj.participants.filter(user=request.user).exists()


class TournamentCreateSerializer(serializers.ModelSerializer):
    club_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model  = Tournament
        fields = ["name", "description", "starts_at", "club_id", "format", "group_size"]

    def create(self, validated_data):
        club_id = validated_data.pop('club_id', None)
        validated_data["created_by"] = self.context["request"].user
        if club_id:
            from clubs.models import Club
            validated_data["club"] = Club.objects.get(pk=club_id)
        return super().create(validated_data)


class TournamentUpdateSerializer(serializers.ModelSerializer):
    """Сведения о турнире ✳ (29.10.2026): раздел «Сведения» на странице турнира."""

    # Границы возраста — разумные, а не из документа федерации (наше значение).
    AGE_LIMITS = (1, 99)
    GAMES_TO_WIN = (2, 3, 4, 5)

    class Meta:
        model  = Tournament
        fields = [
            "name", "description", "starts_at", "ends_at", "city", "venue", "age_min", "age_max",
            "format", "group_size", "games_to_win", "level", "is_rating",
        ]

    def _value(self, attrs, name):
        return attrs[name] if name in attrs else getattr(self.instance, name, None)

    def validate_age_min(self, v):
        return self._age(v)

    def validate_age_max(self, v):
        return self._age(v)

    def _age(self, v):
        lo, hi = self.AGE_LIMITS
        if v is not None and not lo <= v <= hi:
            raise serializers.ValidationError(f"Возраст — от {lo} до {hi} лет.")
        return v

    def validate_games_to_win(self, v):
        if v not in self.GAMES_TO_WIN:
            raise serializers.ValidationError("Матч — до 2, 3, 4 или 5 побед.")
        return v

    def validate_group_size(self, v):
        if v < 2:
            raise serializers.ValidationError("В группе — хотя бы двое.")
        return v

    def validate_format(self, v):
        t = self.instance
        if t and v != t.format:
            if v == Tournament.FORMAT_MANUAL or t.format == Tournament.FORMAT_MANUAL:
                raise serializers.ValidationError("Протокол вручную заводится и ведётся в рейтинге.")
            if t.status != Tournament.STATUS_OPEN or t.matches.exists() or t.groups.exists():
                raise serializers.ValidationError("Турнир уже начат — формат не меняется.")
        return v

    def validate(self, attrs):
        from django.utils import timezone

        starts, ends = self._value(attrs, "starts_at"), self._value(attrs, "ends_at")
        if starts and ends and ends < timezone.localdate(starts):
            raise serializers.ValidationError({"ends_at": "Окончание — не раньше начала."})
        lo, hi = self._value(attrs, "age_min"), self._value(attrs, "age_max")
        if lo is not None and hi is not None and lo > hi:
            raise serializers.ValidationError({"age_max": "Возраст «до» — не меньше «от»."})
        return attrs


class ParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model  = TournamentParticipant
        fields = ["id", "user", "joined_at", "is_absent", "rating_before", "rating_change"]


class TournamentTableSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model  = TournamentTable
        fields = ['id', 'number', 'name', 'display_name', 'is_active']


class MatchSerializer(serializers.ModelSerializer):
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    winner  = UserSerializer(read_only=True)
    proposed_by     = UserSerializer(read_only=True)
    proposed_winner = UserSerializer(read_only=True)

    class Meta:
        model  = Match
        fields = [
            "id", "round_number", "match_number",
            "player1", "player2",
            "score1", "score2",
            "winner", "status", "table_number",
            "is_consolation", "is_walkover",
            "winner_next_id", "loser_next_id",
            "place_lo", "place_hi",
            "proposed_score1", "proposed_score2",
            "proposed_winner", "proposed_by", "proposed_at",
        ]


class GroupMatchSerializer(serializers.ModelSerializer):
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    winner  = UserSerializer(read_only=True)
    proposed_by     = UserSerializer(read_only=True)
    proposed_winner = UserSerializer(read_only=True)

    class Meta:
        model  = GroupMatch
        fields = [
            "id", "match_number", "player1", "player2", "score1", "score2",
            "winner", "status", "table_number", "is_walkover",
            "proposed_score1", "proposed_score2",
            "proposed_winner", "proposed_by", "proposed_at",
        ]


class GroupParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    # Injected by GroupSerializer.get_participants.
    place = serializers.IntegerField(read_only=True)      # standings rank (1 = top)
    is_absent = serializers.BooleanField(read_only=True)  # no-show flag

    class Meta:
        model  = GroupParticipant
        fields = ["id", "user", "seed", "points", "wins", "losses", "diff", "place", "is_absent"]


class GroupSerializer(serializers.ModelSerializer):
    participants = serializers.SerializerMethodField()
    matches      = GroupMatchSerializer(many=True, read_only=True)

    class Meta:
        model  = TournamentGroup
        fields = ["id", "name", "order", "participants", "matches"]

    def get_participants(self, group):
        # Rank by standings (the model's default ordering), then return rows in
        # fixed `seed` order so the UI keeps players in place and only the
        # `place` number moves.
        from .standings import absent_user_ids
        absent = absent_user_ids(group.tournament_id)
        parts = list(group.participants.all())
        for rank, gp in enumerate(parts, start=1):
            gp.place = rank
            gp.is_absent = gp.user_id in absent
        parts.sort(key=lambda gp: (gp.seed, gp.id))
        return GroupParticipantSerializer(parts, many=True).data


class ScoreLogSerializer(serializers.ModelSerializer):
    tournament_name = serializers.CharField(source="tournament.name", read_only=True)

    class Meta:
        model  = ScoreLog
        fields = [
            "id", "tournament", "tournament_name", "kind", "match_label",
            "player1_name", "player2_name", "score1", "score2",
            "winner_name", "entered_by_name", "action", "created_at",
        ]
