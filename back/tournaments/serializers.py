from rest_framework import serializers
from .models import Tournament, TournamentParticipant
from users.serializers import UserSerializer


class TournamentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    participant_count = serializers.SerializerMethodField()

    class Meta:
        model = Tournament
        fields = [
            "id", "name", "description", "join_token",
            "created_by", "created_at", "starts_at", "participant_count",
        ]
        read_only_fields = ["id", "join_token", "created_by", "created_at", "participant_count"]

    def get_participant_count(self, obj):
        return obj.participants.count()


class TournamentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ["name", "description", "starts_at"]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class ParticipantSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = TournamentParticipant
        fields = ["id", "user", "joined_at"]
