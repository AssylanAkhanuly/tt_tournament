from rest_framework import serializers
from . import admission, places
from .admission import applicants as admission_applicants, templates as admission_templates
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
    template          = serializers.SerializerMethodField()
    can_apply_as      = serializers.SerializerMethodField()
    admission_locked  = serializers.SerializerMethodField()

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
            "ends_at", "region", "city", "venue", "age_min", "age_max",
            "level", "games_to_win", "is_rating",
            "template", "category", "applicant_kinds", "participant_limit", "region_quota", "can_apply_as",
            "admission_locked",
        ]
        read_only_fields = [
            "id", "join_token", "created_by", "created_at", "participant_count", "status", "is_registered",
            "referee_recruitment_open", "referee_recruitment_until",
            "player_recruitment_open", "player_recruitment_until",
        ]

    def get_template(self, obj):
        """Вид соревнования — значок на карточке ✳ (19.11.2026)."""
        t = obj.template
        return {"code": t.code, "name": t.name} if t else None

    def get_can_apply_as(self, obj):
        """В каком качестве текущий пользователь может подать заявку (`admission`).
        Роли человека проверяются один раз на запрос, а не на каждый турнир списка."""
        request = self.context.get("request")
        user = request.user if request else None
        acting = self.context.setdefault("_acting_applicants", {})
        if "kinds" not in acting:
            acting["kinds"] = set(admission.acting_kinds(user))
        return [k for k in obj.applicant_kinds if k in acting["kinds"]]

    def get_admission_locked(self, obj):
        """Условия допуска заморожены первой заявкой — экран настроек их не даёт править."""
        # В списке число участников уже посчитано аннотацией — без запроса на турнир.
        anno = getattr(obj, "participant_count_anno", None)
        if anno is not None:
            return obj.status != Tournament.STATUS_OPEN or anno > 0
        return admission.locked(obj)

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
    # Вид соревнования ✳ (19.11.2026): код шаблона; засевает условия допуска.
    template = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = Tournament
        # Окончание ✳ (03.11.2026): «Новый турнир» спрашивает даты диапазоном.
        fields = ["name", "description", "starts_at", "ends_at", "club_id", "format", "group_size", "template"]

    def validate_template(self, code):
        if not code:
            return None
        try:
            return admission_templates.find(code)
        except admission.AdmissionError as e:
            raise serializers.ValidationError(e.detail)

    def validate(self, attrs):
        from django.utils import timezone

        starts, ends = attrs.get("starts_at"), attrs.get("ends_at")
        if starts and ends and ends < timezone.localdate(starts):
            raise serializers.ValidationError({"ends_at": "Окончание — не раньше начала."})
        return attrs

    def create(self, validated_data):
        club_id = validated_data.pop('club_id', None)
        template = validated_data.pop("template", None)
        validated_data["created_by"] = self.context["request"].user
        if club_id:
            from clubs.models import Club
            validated_data["club"] = Club.objects.get(pk=club_id)
        tournament = Tournament(**validated_data)
        if template:
            admission_templates.seed(tournament, template)
        tournament.save()
        return tournament


class TournamentUpdateSerializer(serializers.ModelSerializer):
    """Сведения о турнире ✳ (29.10.2026): раздел «Сведения» на странице турнира."""

    # Границы возраста — разумные, а не из документа федерации (наше значение).
    AGE_LIMITS = (1, 99)
    GAMES_TO_WIN = (2, 3, 4, 5)

    class Meta:
        model  = Tournament
        fields = [
            "name", "description", "starts_at", "ends_at", "region", "city", "venue", "age_min", "age_max",
            "format", "group_size", "games_to_win", "level", "is_rating",
            "applicant_kinds", "participant_limit", "region_quota",
        ]

    # Условия допуска ✳ (19.11.2026): первая заявка их замораживает.
    ADMISSION_FIELDS = ("applicant_kinds", "participant_limit", "region_quota")

    def validate_applicant_kinds(self, v):
        try:
            return admission_applicants.clean_kinds(v)
        except admission.AdmissionError as e:
            raise serializers.ValidationError(e.detail)

    def validate_participant_limit(self, v):
        if v is not None and v < 1:
            raise serializers.ValidationError("Предел — хотя бы один участник.")
        return v

    def validate_region_quota(self, v):
        if v is not None and v < 1:
            raise serializers.ValidationError("Квота — хотя бы один спортсмен.")
        return v

    def _admission(self, attrs):
        t = self.instance
        if t is None:
            return
        changed = [f for f in self.ADMISSION_FIELDS if f in attrs and attrs[f] != getattr(t, f)]
        if changed and admission.locked(t):
            raise serializers.ValidationError({changed[0]: admission.LOCKED})

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
        self._place(attrs)
        self._admission(attrs)
        return attrs

    def _place(self, attrs):
        """Регион и город — по справочнику. Проверяем только изменённое: город,
        записанный строкой до справочника, не мешает править остальные сведения."""
        if "region" not in attrs and "city" not in attrs:
            return
        t = self.instance
        region, city = attrs.get("region", ""), attrs.get("city", t.city if t else "")
        if t and city == t.city and region == t.region:
            return
        place = places.clean(region, city)
        if place is None:
            raise serializers.ValidationError({"city": "Город и регион — из справочника."})
        attrs["region"], attrs["city"] = place


class ParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model  = TournamentParticipant
        fields = ["id", "user", "joined_at", "is_absent", "rating_before", "rating_change", "entered_as"]


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
