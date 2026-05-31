from rest_framework import serializers
from .models import Match, Tournament, TournamentParticipant, TournamentTable, TournamentGroup, GroupParticipant, GroupMatch, ScoreLog
from users.serializers import UserSerializer


class TournamentSerializer(serializers.ModelSerializer):
    created_by        = UserSerializer(read_only=True)
    participant_count = serializers.SerializerMethodField()
    club_id           = serializers.SerializerMethodField()
    club_name         = serializers.SerializerMethodField()
    is_registered     = serializers.SerializerMethodField()

    class Meta:
        model  = Tournament
        fields = [
            "id", "name", "description", "join_token",
            "created_by", "created_at", "starts_at",
            "participant_count", "status",
            "club_id", "club_name",
            "format", "group_size",
            "is_registered",
        ]
        read_only_fields = ["id", "join_token", "created_by", "created_at", "participant_count", "status", "is_registered"]

    def get_participant_count(self, obj):
        return obj.participants.count()

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
    class Meta:
        model  = Tournament
        fields = ["name", "description", "starts_at"]


class ParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model  = TournamentParticipant
        fields = ["id", "user", "joined_at", "rating_before", "rating_change"]


class TournamentTableSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model  = TournamentTable
        fields = ['id', 'number', 'name', 'display_name', 'is_active']


class MatchSerializer(serializers.ModelSerializer):
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    winner  = UserSerializer(read_only=True)

    class Meta:
        model  = Match
        fields = [
            "id", "round_number", "match_number",
            "player1", "player2",
            "score1", "score2",
            "winner", "status", "table_number",
            "is_consolation",
            "winner_next_id", "loser_next_id",
            "place_lo", "place_hi",
        ]


class GroupMatchSerializer(serializers.ModelSerializer):
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    winner  = UserSerializer(read_only=True)

    class Meta:
        model  = GroupMatch
        fields = ["id", "match_number", "player1", "player2", "score1", "score2", "winner", "status", "table_number"]


class GroupParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model  = GroupParticipant
        fields = ["id", "user", "points", "wins", "losses", "diff"]


class GroupSerializer(serializers.ModelSerializer):
    participants = GroupParticipantSerializer(many=True, read_only=True)
    matches      = GroupMatchSerializer(many=True, read_only=True)

    class Meta:
        model  = TournamentGroup
        fields = ["id", "name", "order", "participants", "matches"]


class ScoreLogSerializer(serializers.ModelSerializer):
    tournament_name = serializers.CharField(source="tournament.name", read_only=True)

    class Meta:
        model  = ScoreLog
        fields = [
            "id", "tournament", "tournament_name", "kind", "match_label",
            "player1_name", "player2_name", "score1", "score2",
            "winner_name", "entered_by_name", "action", "created_at",
        ]
