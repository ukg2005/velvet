from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from lists.models import List, ListEntry
from movies.models import Movie

User = get_user_model()

class ListAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="user1@example.com", username="user1")
        self.user2 = User.objects.create_user(email="user2@example.com", username="user2")
        
        # We need a movie in the DB for some tests
        self.movie1 = Movie.objects.create(tmdb_id=101, title="Test Movie 1")
        self.movie2 = Movie.objects.create(tmdb_id=102, title="Test Movie 2")
        self.movie3 = Movie.objects.create(tmdb_id=103, title="Test Movie 3")

        self.list1 = List.objects.create(user=self.user1, title="User 1 List", is_public=True)
        self.list2 = List.objects.create(user=self.user2, title="User 2 List", is_public=False)
        
        self.list_url = "/api/lists/"
        self.list_detail_url = lambda pk: f"/api/lists/{pk}/"
        self.list_add_url = lambda pk: f"/api/lists/{pk}/add/"
        self.list_reorder_url = lambda pk: f"/api/lists/{pk}/reorder/"

    def authenticate(self, user):
        # DRF APITestCase shortcut for authentication
        self.client.force_authenticate(user=user)

    def test_create_list(self):
        """Test creating a list as an authenticated user."""
        self.authenticate(self.user1)
        data = {"title": "My Favorite Action Movies", "desc": "Boom", "is_public": True}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(List.objects.filter(user=self.user1).count(), 2)

    def test_create_list_unauthenticated(self):
        """Test creating a list fails if not authenticated."""
        data = {"title": "Secret List", "is_public": False}
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_list_owner(self):
        """Test deleting a list as its owner."""
        self.authenticate(self.user1)
        response = self.client.delete(self.list_detail_url(self.list1.pk))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(List.objects.filter(pk=self.list1.pk).exists())

    def test_delete_list_not_owner(self):
        """Test deleting another user's list fails."""
        self.authenticate(self.user2)
        response = self.client.delete(self.list_detail_url(self.list1.pk))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("lists.views.get_movie")
    def test_add_movie_to_list(self, mock_get_movie):
        """Test adding a movie to a list."""
        self.authenticate(self.user1)
        # Mock get_movie to return movie1 without calling TMDB
        mock_get_movie.return_value = self.movie1
        
        response = self.client.post(self.list_add_url(self.list1.pk), {"tmdb_id": 101}, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify it was added
        self.assertTrue(ListEntry.objects.filter(list=self.list1, movie=self.movie1).exists())
        mock_get_movie.assert_called_once_with(tmdb_id=101)

    def test_reorder_list(self):
        """Test the list reordering endpoint."""
        self.authenticate(self.user1)
        
        # Add 3 movies to list1
        entry1 = ListEntry.objects.create(list=self.list1, movie=self.movie1, order=0)
        entry2 = ListEntry.objects.create(list=self.list1, movie=self.movie2, order=1)
        entry3 = ListEntry.objects.create(list=self.list1, movie=self.movie3, order=2)
        
        # New order: entry3 -> 0, entry1 -> 1, entry2 -> 2
        payload = [
            {"id": entry3.id, "order": 0},
            {"id": entry1.id, "order": 1},
            {"id": entry2.id, "order": 2},
        ]
        
        response = self.client.post(self.list_reorder_url(self.list1.pk), payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify changes in DB
        entry1.refresh_from_db()
        entry2.refresh_from_db()
        entry3.refresh_from_db()
        
        self.assertEqual(entry3.order, 0)
        self.assertEqual(entry1.order, 1)
        self.assertEqual(entry2.order, 2)
