"""Админка рейтинга — для федерации и разбора спорных начислений.

Журнал только на чтение: строки не правятся руками, а появляются расчётом или
через API (неявка, исправление). Иначе «прозрачность» п. 4.6 держится на слове.
"""
from django.contrib import admin

from .models import RatingEntry, RatingParams, RatingProfile


@admin.register(RatingParams)
class RatingParamsAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "d", "k_standard", "k_transition", "max_delta", "updated_at")
    list_filter = ("is_active",)


@admin.register(RatingProfile)
class RatingProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "value", "origin", "status", "matches_played", "wins", "losses", "last_match_at")
    list_filter = ("status", "origin", "sex", "region")
    search_fields = ("user__name", "user__phone", "region")
    readonly_fields = ("value", "matches_played", "wins", "losses", "last_match_at", "status")


@admin.register(RatingEntry)
class RatingEntryAdmin(admin.ModelAdmin):
    list_display = ("occurred_at", "profile", "kind", "before", "delta", "after", "is_reverted")
    list_filter = ("kind", "is_reverted")
    search_fields = ("profile__user__name", "reason")
    # Журнал не редактируется: п. 21.6 требует сохранности записей.
    readonly_fields = [f.name for f in RatingEntry._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
