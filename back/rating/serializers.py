"""Представление рейтинга наружу.

Числа отдаются строками (`DecimalField` DRF по умолчанию), чтобы два знака
после запятой не потерялись в плавающей точке на стороне клиента: рейтинг
показывается как 40,15, а не 40.14999999999999 (п. 6.4 Положения).
"""
from rest_framework import serializers

from . import engine
from .models import RatingEntry, RatingProfile


class RatingProfileSerializer(serializers.ModelSerializer):
    """Строка рейтинг-листа и шапка карточки — поля таблицы п. 19 Положения."""

    user_id = serializers.CharField(source="user.id", read_only=True)
    name = serializers.CharField(source="user.name", read_only=True)
    age_category = serializers.CharField(read_only=True)
    origin_label = serializers.CharField(source="get_origin_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = RatingProfile
        fields = [
            "user_id", "name", "value", "origin", "origin_label", "start_value",
            "ittf_position", "matches_played", "wins", "losses", "no_shows",
            "last_match_at", "status", "status_label", "sex", "birth_year",
            "age_category", "region", "updated_at",
        ]
        read_only_fields = fields


class RatingEntrySerializer(serializers.ModelSerializer):
    """Строка истории — колонки таблицы п. 20 плюс слагаемые изменения.

    Слагаемые отдаются всегда: п. 4.6 требует, чтобы каждое изменение было
    объяснимо, а «+0,35» без E, K, C и P ничем не проверяемо.
    """

    opponent_name = serializers.CharField(source="opponent.name", read_only=True, default=None)
    tournament_name = serializers.CharField(source="tournament.name", read_only=True, default=None)
    kind_label = serializers.CharField(source="get_kind_display", read_only=True)

    class Meta:
        model = RatingEntry
        fields = [
            "id", "kind", "kind_label", "occurred_at", "tournament", "tournament_name",
            "opponent", "opponent_name", "score", "won",
            "before", "delta", "after",
            "expected", "d", "k", "c", "p", "capped", "transition",
            "reason", "is_reverted", "created_at",
        ]
        read_only_fields = fields


class RatingCardSerializer(serializers.Serializer):
    """Карточка спортсмена целиком: шапка плюс история изменений."""

    profile = RatingProfileSerializer(read_only=True)
    history = RatingEntrySerializer(many=True, read_only=True)
    place = serializers.IntegerField(read_only=True)
    of = serializers.IntegerField(read_only=True)
