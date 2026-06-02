from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from users.models import OTP

User = get_user_model()

class UserAuthTests(APITestCase):
    def setUp(self):
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.verify_login_url = "/api/auth/login/verify/"
        self.me_url = "/api/auth/me/"

        self.user_data = {
            "email": "testuser@example.com",
            "username": "testuser"
        }

    def test_user_registration(self):
        """Test that a user can register successfully."""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().email, "testuser@example.com")
        self.assertFalse(User.objects.get().is_active)  # Inactive until OTP verification

    def test_user_login_flow(self):
        """Test login request and OTP verification."""
        # Setup active user
        user = User.objects.create_user(email="login@example.com", username="loginuser")
        user.is_active = True
        user.save()

        # Step 1: Request login OTP
        response = self.client.post(self.login_url, {"email": "login@example.com"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check OTP created
        otp_obj = OTP.objects.get(user=user)
        self.assertIsNotNone(otp_obj.code)

        # Step 2: Verify login OTP
        response = self.client.post(self.verify_login_url, {
            "email": "login@example.com",
            "otp": otp_obj.code
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_me_endpoint_unauthenticated(self):
        """Test accessing /me without token."""
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data)

    def test_me_endpoint_authenticated(self):
        """Test accessing /me with token."""
        user = User.objects.create_user(email="me@example.com", username="meuser")
        user.is_active = True
        user.save()
        
        otp = OTP.generate_for(user)
        login_response = self.client.post(self.verify_login_url, {
            "email": user.email,
            "otp": otp.code
        })
        
        token = login_response.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "me@example.com")
        self.assertEqual(response.data["username"], "meuser")
