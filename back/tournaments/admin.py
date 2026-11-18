from django.contrib import admin
from .models import Tournament, TournamentParticipant, TournamentTemplate


class ParticipantInline(admin.TabularInline):
    model = TournamentParticipant
    extra = 0
    readonly_fields = ["user", "joined_at"]


@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ["name", "created_by", "starts_at", "participant_count", "created_at"]
    list_filter = ["starts_at"]
    search_fields = ["name", "created_by__name", "created_by__phone"]
    readonly_fields = ["id", "join_token", "created_at"]
    inlines = [ParticipantInline]

    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = "Участников"


@admin.register(TournamentParticipant)
class TournamentParticipantAdmin(admin.ModelAdmin):
    list_display = ["user", "tournament", "joined_at"]
    list_filter = ["tournament"]
    search_fields = ["user__name", "user__phone", "tournament__name"]


@admin.register(TournamentTemplate)
class TournamentTemplateAdmin(admin.ModelAdmin):
    """Виды соревнований ✳ (19.11.2026): правит администратор федерации. Правка
    вида меняет только турниры, заведённые после неё (ADMISSION.md). Ключи
    заявителей проверяет `TournamentTemplate.clean`."""

    list_display = ["name", "code", "category", "is_team", "applicant_kinds", "region_quota", "participant_limit"]
    ordering = ["order"]
