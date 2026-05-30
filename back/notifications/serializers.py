from rest_framework import serializers

from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id", "type", "title", "body",
            "tournament", "match_kind", "match_id", "table_number",
            "is_read", "created_at",
        ]
        read_only_fields = fields
