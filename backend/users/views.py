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
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = cast(dict[str, Any], serializer.validated_data)
        user = cast(User, validated_data["user"])
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
            return Response({"detail": "Account not verified"}, status=status.HTTP_400_BAD_REQUEST)
        otp.delete()
        return _auth_response(user)

class MeView(APIView):
    permission_classes = [AllowAny]
    serializer_class = UserSerializer

    def get(self, request):
        if request.user.is_authenticated:
            return Response(UserSerializer(request.user).data)
        return Response(None)

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
