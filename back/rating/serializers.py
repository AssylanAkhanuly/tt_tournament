"""Представление рейтинга наружу.

Числа отдаются строками (`DecimalField` DRF по умолчанию), чтобы два знака
после запятой не потерялись в плавающей точке на стороне клиента: рейтинг
показывается как 40,15, а не 40.14999999999999 (п. 6.4 Положения).
"""
from rest_framework import serializers

from . import engine
from .models import RatingEntry, RatingParams, RatingProfile


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


class RatingParamsSerializer(serializers.ModelSerializer):
    """Коэффициенты расчёта плюс происхождение каждого числа.

    `sources` — не украшение: шесть значений Положение называет, но не задаёт,
    и экран обязан показывать, что стоит за числом — документ или наше
    допущение. Без этого пилотные числа выдаются за норму.
    """

    sources = serializers.SerializerMethodField()

    class Meta:
        model = RatingParams
        fields = [
            "id", "name", "is_active",
            "d", "k_standard", "k_transition", "transition_matches",
            "max_delta", "cap_in_transition",
            "c_top", "c_republic", "c_region", "c_amateur",
            "p_first", "p_second", "p_third",
            "prize_mode", "baseline", "min_rating",
            "ittf_r_max", "ittf_k",
            "updated_at", "sources",
        ]
        read_only_fields = ["id", "updated_at", "sources"]

    def get_sources(self, obj):
        """{поле: {fixed, clause}} — где fixed = «задано Положением»."""
        out = {}
        # Коэффициенты уровня и места разложены по полям, а в движке это словари.
        alias = {
            "c_top": "level_c", "c_republic": "level_c", "c_region": "level_c",
            "c_amateur": "level_c", "p_first": "prize_p", "p_second": "prize_p",
            "p_third": "prize_p",
        }
        for name in self.Meta.fields:
            key = alias.get(name, name)
            if key in engine.PARAM_SOURCES:
                fixed, clause = engine.PARAM_SOURCES[key]
                out[name] = {"fixed": fixed, "clause": clause}
        return out


# ── Предпросчёт (калибровка) ────────────────────────────────────────


class PreviewPlayerSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField(required=False, allow_blank=True)
    origin = serializers.ChoiceField(
        choices=[engine.ORIGIN_NEW, engine.ORIGIN_LEGACY, engine.ORIGIN_ITTF],
        required=False,
    )
    start = serializers.FloatField(required=False, default=1)
    played = serializers.IntegerField(required=False, default=0, min_value=0)
    ittf_position = serializers.IntegerField(required=False, allow_null=True, min_value=1)


class PreviewTournamentSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField(required=False, allow_blank=True)
    level = serializers.ChoiceField(choices=list(engine.LEVELS), required=False)
    places = serializers.DictField(child=serializers.IntegerField(min_value=1), required=False)
    no_third_place_match = serializers.BooleanField(required=False, default=False)


class PreviewMatchSerializer(serializers.Serializer):
    id = serializers.CharField()
    tournament = serializers.CharField()
    a = serializers.CharField()
    b = serializers.CharField()
    games = serializers.ListField(
        child=serializers.IntegerField(min_value=0), min_length=2, max_length=2
    )


class PreviewRequestSerializer(serializers.Serializer):
    """Вход предпросчёта: он ничего не сохраняет, поэтому и участники здесь
    произвольные — это площадка калибровки, а не боевой протокол."""

    players = PreviewPlayerSerializer(many=True)
    tournaments = PreviewTournamentSerializer(many=True)
    matches = PreviewMatchSerializer(many=True)
    params = serializers.DictField(required=False)
