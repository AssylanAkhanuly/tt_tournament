from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    club_ids_admin = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ["id", "phone", "name", "rating", "is_staff", "club_ids_admin"]
        read_only_fields = ["id", "phone", "name", "rating", "is_staff", "club_ids_admin"]

    def get_club_ids_admin(self, obj):
        # Returns list of Club UUIDs where this user is a ClubAdmin
        return [str(r.club_id) for r in obj.club_admin_roles.all()]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["phone", "name", "password", "confirm_password"]

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Пароли не совпадают."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        return User.objects.create_user(**validated_data)
