from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/tournaments/", include("tournaments.urls")),
    path("api/clubs/", include("clubs.urls")),
    path("api/notifications/", include("notifications.urls")),
    path("api/scoreboard/", include("scoreboard.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
