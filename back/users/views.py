from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, UserSerializer

User = get_user_model()


def _set_auth_cookies(response, refresh_token: RefreshToken):
    """Attach access + refresh JWT cookies to a response."""
    jwt = settings.SIMPLE_JWT
    access_token = refresh_token.access_token

    response.set_cookie(
        key=jwt["AUTH_COOKIE"],
        value=str(access_token),
        max_age=int(jwt["ACCESS_TOKEN_LIFETIME"].total_seconds()),
        httponly=jwt["AUTH_COOKIE_HTTP_ONLY"],
        samesite=jwt["AUTH_COOKIE_SAMESITE"],
        secure=jwt["AUTH_COOKIE_SECURE"],
    )
    response.set_cookie(
        key=jwt["AUTH_COOKIE_REFRESH"],
        value=str(refresh_token),
        max_age=int(jwt["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        httponly=jwt["AUTH_COOKIE_HTTP_ONLY"],
        samesite=jwt["AUTH_COOKIE_SAMESITE"],
        secure=jwt["AUTH_COOKIE_SECURE"],
    )
    return response


class CheckPhoneView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone", "").strip()
        exists = User.objects.filter(phone=phone).exists()
        return Response({"exists": exists})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        response = Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return _set_auth_cookies(response, refresh)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get("phone", "").strip()
        password = request.data.get("password", "")
        user = authenticate(request, username=phone, password=password)
        if user is None:
            return Response(
                {"detail": "Неверный номер телефона или пароль."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        refresh = RefreshToken.for_user(user)
        response = Response(UserSerializer(user).data)
        return _set_auth_cookies(response, refresh)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        jwt = settings.SIMPLE_JWT
        response = Response({"detail": "Выход выполнен."})
        response.delete_cookie(jwt["AUTH_COOKIE"])
        response.delete_cookie(jwt["AUTH_COOKIE_REFRESH"])
        return response


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserSearchView(APIView):
    """
    GET /api/auth/users/          → 20 most-recently-created non-staff users
    GET /api/auth/users/?q=query  → filter by phone or name (any length, up to 20)
    Admin-only.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Allow club admins to search too
        is_club_admin = request.user.club_admin_roles.exists()
        if not request.user.is_staff and not is_club_admin:
            return Response({"detail": "Только администраторы."}, status=status.HTTP_403_FORBIDDEN)
        q = request.query_params.get("q", "").strip()
        qs = User.objects.filter(is_staff=False)
        if q:
            qs = qs.filter(Q(phone__icontains=q) | Q(name__icontains=q))
        qs = qs.order_by("-created_at")[:20]
        return Response(UserSerializer(qs, many=True).data)


class TokenRefreshCookieView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        jwt = settings.SIMPLE_JWT
        raw_refresh = request.COOKIES.get(jwt["AUTH_COOKIE_REFRESH"])
        if not raw_refresh:
            return Response(
                {"detail": "Refresh-токен отсутствует."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            refresh = RefreshToken(raw_refresh)
            response = Response({"detail": "Токен обновлён."})
            return _set_auth_cookies(response, refresh)
        except Exception:
            return Response(
                {"detail": "Недействительный или истёкший refresh-токен."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
