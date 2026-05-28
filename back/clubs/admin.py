from django.contrib import admin
from .models import Club, ClubAdmin, ClubTable


class ClubAdminInline(admin.TabularInline):
    model = ClubAdmin
    extra = 0
    raw_id_fields = ['user', 'added_by']


class ClubTableInline(admin.TabularInline):
    model = ClubTable
    extra = 0


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    inlines = [ClubAdminInline, ClubTableInline]


@admin.register(ClubTable)
class ClubTableAdmin(admin.ModelAdmin):
    list_display = ['club', 'number', 'name', 'is_active']
    list_filter = ['club', 'is_active']
