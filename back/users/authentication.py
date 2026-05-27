from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """Read JWT from an HttpOnly cookie instead of the Authorization header."""

    def authenticate(self, request):
        cookie_name = settings.SIMPLE_JWT.get("AUTH_COOKIE", "access_token")
        raw_token = request.COOKIES.get(cookie_name)
        if raw_token is None:
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError):
            # Expired or malformed token — treat as anonymous so that
            # AllowAny endpoints (register, login, check-phone, etc.)
            # still work when the browser holds a stale cookie.
            # Endpoints that require authentication will return 401
            # through the normal permission-check path.
            return None
        return self.get_user(validated_token), validated_token
