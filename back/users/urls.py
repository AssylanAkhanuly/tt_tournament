from django.urls import path
from .views import (
    CheckPhoneView,
    LoginView,
    LogoutView,
    MeView,
    RegisterView,
    TokenRefreshCookieView,
    UserSearchView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("token/refresh/", TokenRefreshCookieView.as_view(), name="auth-token-refresh"),
    path("check-phone/", CheckPhoneView.as_view(), name="auth-check-phone"),
    path("users/", UserSearchView.as_view(), name="auth-user-search"),
]
