from rest_framework import serializers
from .models import Club, ClubAdmin, ClubTable
from users.serializers import UserSerializer


class ClubTableSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model  = ClubTable
        fields = ['id', 'number', 'name', 'display_name', 'is_active']


class ClubAdminSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model  = ClubAdmin
        fields = ['id', 'user', 'added_at']


class ClubSerializer(serializers.ModelSerializer):
    table_count      = serializers.SerializerMethodField()
    tournament_count = serializers.SerializerMethodField()
    admin_count      = serializers.SerializerMethodField()
    is_admin         = serializers.SerializerMethodField()

    class Meta:
        model  = Club
        fields = [
            'id', 'name', 'description', 'created_at',
            'table_count', 'tournament_count', 'admin_count', 'is_admin',
        ]
        read_only_fields = ['id', 'created_at']

    def get_table_count(self, obj):
        return obj.tables.filter(is_active=True).count()

    def get_tournament_count(self, obj):
        return obj.tournaments.count()

    def get_admin_count(self, obj):
        return obj.admin_memberships.count()

    def get_is_admin(self, obj):
        request = self.context.get('request')
        if not request:
            return False
        return obj.is_admin(request.user)
