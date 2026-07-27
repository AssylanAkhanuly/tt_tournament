from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
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
