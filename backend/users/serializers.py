from typing import cast
from rest_framework import serializers
from .models import User, OTP, UserManager


class RegisterSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "username", "display_name"]

    def validate_username(self, value):
        if not value.replace("_", "").isalnum():
            raise serializers.ValidationError("Username can only contain letters, numbers, and underscores")
        return value.lower()

    def validate_email(self, value):
        return value.lower()

    def create(self, validated_data):
        user_manager = cast(UserManager, User.objects)
        user = user_manager.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            display_name=validated_data.get("display_name") or validated_data["username"],
        )
        return user

class VerifyEmailOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)

    def validate(self, data):
        try:
            user = User.objects.get(email=data["email"].lower())
        except User.DoesNotExist:
            raise serializers.ValidationError("No account with this email")

        try:
            otp = OTP.objects.get(user=user)
        except OTP.DoesNotExist:
            raise serializers.ValidationError("No OTP requested")

        if otp.is_expired():
            otp.delete()
            raise serializers.ValidationError("OTP expired, request a new one")

        if otp.code != data["otp"]:
            raise serializers.ValidationError("Invalid OTP")

        data["user"] = user
        data["otp"] = otp
        return data

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate(self, data):
        email = data["email"].lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("No account with this email")
        if not user.is_active:
            raise serializers.ValidationError("Account not verified")
        data["email"] = email
        data["user"] = user
        return data

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "username", "display_name",
            "bio", "avatar",
            "location", "is_private", "joined_at"
        ]
        read_only_fields = ["id", "email", "joined_at"]