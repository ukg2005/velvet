from typing import Any, cast
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from .models import User, OTP
from .serializers import (
    RegisterSerializer, VerifyEmailOTPSerializer,
    LoginSerializer, UserSerializer
)
from .emails import send_otp_email


class RegisterView(APIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _send_otp(user)
        return Response({"detail": "OTP sent to your email"}, status=status.HTTP_201_CREATED)

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    serializer_class = VerifyEmailOTPSerializer

    def post(self, request):
        serializer = VerifyEmailOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = cast(dict[str, Any], serializer.validated_data)
        user = cast(User, validated_data["user"])
        otp = cast(OTP, validated_data["otp"])
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])
        otp.delete()
        return _auth_response(user)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower()
        if not email:
            return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            import re
            base_username = re.sub(r'[^a-zA-Z0-9_]', '', email.split('@')[0])
            if not base_username:
                base_username = "user"
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            user = User.objects.create_user(email=email, username=username)

        _send_otp(user)
        return Response({"detail": "OTP sent to your email"})

class LoginVerifyView(APIView):
    permission_classes = [AllowAny]
    serializer_class = VerifyEmailOTPSerializer

    def post(self, request):
        serializer = VerifyEmailOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = cast(dict[str, Any], serializer.validated_data)
        user = cast(User, validated_data["user"])
        otp = cast(OTP, validated_data["otp"])
        if not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])
        otp.delete()
        return _auth_response(user)

class MeView(APIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def get(self, request):
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        return Response(None)

    def patch(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

def _auth_response(user):
    refresh = RefreshToken.for_user(user)
    return Response({
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data
    })

def _send_otp(user):
    otp = OTP.generate_for(user)
    send_otp_email(user.email, otp.code)
