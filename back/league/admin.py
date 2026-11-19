from django.contrib import admin

from .models import LeagueDivision, LeagueRules, LeagueSeason, LeagueTour, Team, TeamMatch, TeamMember


@admin.register(LeagueRules)
class LeagueRulesAdmin(admin.ModelAdmin):
    """Правила лиги ✳ — допущения ТЗ §4.10, правятся здесь или `PATCH /api/league/rules/`."""

    list_display = ["order", "wins_needed", "points_win", "points_loss", "points_no_show", "squad_max"]


admin.site.register([LeagueSeason, LeagueDivision, Team, TeamMember, LeagueTour, TeamMatch])
