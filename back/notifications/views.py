from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification, PushSubscription
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    """GET /api/notifications/?unread=1 — current user's notifications + unread count."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user)
        unread_count = qs.filter(is_read=False).count()
        if request.query_params.get("unread") in ("1", "true"):
            qs = qs.filter(is_read=False)
        qs = qs[:50]
        return Response({
            "notifications": NotificationSerializer(qs, many=True).data,
            "unread_count": unread_count,
        })


class MarkReadView(APIView):
    """POST /api/notifications/read/  body: {ids: [..]} or {all: true}."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        qs = Notification.objects.filter(user=request.user, is_read=False)
        if not request.data.get("all"):
            ids = request.data.get("ids") or []
            qs = qs.filter(id__in=ids)
        updated = qs.update(is_read=True)
        return Response({"marked": updated})


class PushSubscribeView(APIView):
    """POST /api/notifications/subscribe/ — register a Web Push subscription.
    Body: {endpoint, keys: {p256dh, auth}}."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = (request.data.get("endpoint") or "").strip()
        keys = request.data.get("keys") or {}
        p256dh = (keys.get("p256dh") or "").strip()
        auth = (keys.get("auth") or "").strip()
        if not endpoint or not p256dh or not auth:
            return Response({"detail": "endpoint и keys обязательны."}, status=status.HTTP_400_BAD_REQUEST)

        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={"user": request.user, "p256dh": p256dh, "auth": auth},
        )
        return Response({"detail": "ok"}, status=status.HTTP_201_CREATED)


class PushUnsubscribeView(APIView):
    """POST /api/notifications/unsubscribe/  body: {endpoint}."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = (request.data.get("endpoint") or "").strip()
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return Response({"detail": "ok"})


class VapidPublicKeyView(APIView):
    """GET /api/notifications/vapid-public-key/ — public key for the browser to subscribe."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"public_key": getattr(settings, "VAPID_PUBLIC_KEY", "")})
