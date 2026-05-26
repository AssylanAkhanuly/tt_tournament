from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-created_at"]
    list_display = ["phone", "name", "is_staff", "is_active", "created_at"]
    list_filter = ["is_staff", "is_active"]
    search_fields = ["phone", "name"]

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Личные данные", {"fields": ("name",)}),
        ("Права доступа", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Даты", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("phone", "name", "password1", "password2", "is_staff"),
        }),
    )
    readonly_fields = ["created_at"]
