from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from logs.models import Log, Liked, Watchlist
from movies.models import Movie
from datetime import date

User = get_user_model()

class LogAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="loguser@example.com", username="loguser")
        self.movie1 = Movie.objects.create(tmdb_id=201, title="Log Movie 1")
        
        self.log_url = "/api/logs/"
        self.log_detail_url = lambda pk: f"/api/logs/{pk}/"
        self.toggle_url = "/api/logs/toggle/"

    def authenticate(self, user):
        self.client.force_authenticate(user=user)

    @patch("logs.views.get_movie")
    def test_create_log(self, mock_get_movie):
        """Test logging a movie."""
        self.authenticate(self.user1)
        mock_get_movie.return_value = self.movie1
        
        data = {
            "tmdb_id": 201,
            "rating": 4.5,
            "review": "Great movie!",
            "is_liked": True,
            "on_watchlist": False
        }
        
        response = self.client.post(self.log_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Log.objects.filter(user=self.user1).count(), 1)
        
        log = Log.objects.get(user=self.user1)
        self.assertEqual(log.movie, self.movie1)
        self.assertEqual(log.rating, 4.5)
        self.assertTrue(Liked.objects.filter(user=self.user1, movie=self.movie1).exists())
        self.assertFalse(Watchlist.objects.filter(user=self.user1, movie=self.movie1).exists())

    def test_update_log(self):
        """Test updating an existing log."""
        self.authenticate(self.user1)
        log = Log.objects.create(user=self.user1, movie=self.movie1, rating=3.0, logged_at=date.today())
        
        data = {"rating": 5.0, "review": "Changed my mind"}
        response = self.client.patch(self.log_detail_url(log.pk), data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        log.refresh_from_db()
        self.assertEqual(log.rating, 5.0)
        self.assertEqual(log.review, "Changed my mind")

    @patch("logs.views.get_movie")
    def test_toggle_liked(self, mock_get_movie):
        """Test toggling the 'liked' field."""
        self.authenticate(self.user1)
        mock_get_movie.return_value = self.movie1
        
        # It should create a log with liked=True if it doesn't exist
        response = self.client.post(self.toggle_url, {"tmdb_id": 201, "action": "liked"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertTrue(Liked.objects.filter(user=self.user1, movie=self.movie1).exists())
        
        # Toggling again should set it to False
        response = self.client.post(self.toggle_url, {"tmdb_id": 201, "action": "liked"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Liked.objects.filter(user=self.user1, movie=self.movie1).exists())

    @patch("logs.views.get_movie")
    def test_toggle_watchlist(self, mock_get_movie):
        """Test toggling the 'watchlist' field."""
        self.authenticate(self.user1)
        mock_get_movie.return_value = self.movie1
        
        # Initial toggle
        response = self.client.post(self.toggle_url, {"tmdb_id": 201, "action": "watchlist"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertTrue(Watchlist.objects.filter(user=self.user1, movie=self.movie1).exists())
        
        # Second toggle
        response = self.client.post(self.toggle_url, {"tmdb_id": 201, "action": "watchlist"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Watchlist.objects.filter(user=self.user1, movie=self.movie1).exists())
