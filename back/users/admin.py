from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Role, User


class RoleInline(admin.TabularInline):
    """Роли пользователя прямо в его карточке: экрана выдачи ролей пока нет."""

    model = Role
    fk_name = "user"
    extra = 0
    fields = ["kind", "scope", "scope_id", "granted_by", "created_at"]
    readonly_fields = ["created_at"]


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ["user", "kind", "scope", "created_at"]
    list_filter = ["kind", "scope"]
    search_fields = ["user__name", "user__phone", "user__email"]


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-created_at"]
    list_display = ["phone", "name", "email", "is_staff", "is_active", "created_at"]
    list_filter = ["is_staff", "is_active", "roles__kind"]
    search_fields = ["phone", "name", "email"]
    inlines = [RoleInline]

    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Личные данные", {"fields": ("name", "email")}),
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
