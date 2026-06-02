from .serializers import LogSerializer
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import generics
from movies.services import get_movie
from rest_framework.response import Response
from rest_framework import serializers
from .models import Log, Liked, Watchlist
from movies.serializers import MovieListSerializer
from movies.models import Movie


class LogCreateView(generics.ListCreateAPIView):
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        tmdb_id = serializer.validated_data.get('tmdb_id')
        movie = get_movie(tmdb_id)
        if not movie:
            raise serializers.ValidationError({'error': 'Movie not found.'})
        
        serializer.save(user=self.request.user, movie=movie)
    
    def get_queryset(self):
        return Log.objects.filter(user=self.request.user).select_related('movie').order_by('-id')

class LogUpdateView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LogSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        serializer.save()
    
    def get_queryset(self):
        return Log.objects.filter(user=self.request.user).select_related('movie')

class LikedListView(generics.ListAPIView):
    serializer_class = MovieListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Movie.objects.none()
        return Movie.objects.filter(liked__user=self.request.user)

class WatchlistView(generics.ListAPIView):
    serializer_class = MovieListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Movie.objects.none()
        return Movie.objects.filter(watchlist__user=self.request.user)

class ToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tmdb_id = request.data.get('tmdb_id')
        action = request.data.get('action')

        movie = get_movie(tmdb_id)
        if not movie:
            return Response({'error': 'Movie not found.'}, status=404)
        
        valid_actions = {'liked', 'watchlist'}
        if action not in valid_actions:
            return Response({'error': 'Invalid Action'}, status=400)
        model = Liked if action == 'liked' else Watchlist

        obj, created = model.objects.get_or_create(user=request.user, movie=movie)
        if not created:
            obj.delete()
            # Return explicit boolean so frontend can reliably know current state
            return Response({'liked': False, 'watchlist': False, action: False, 'added': False}, status=200)
        return Response({'liked': action == 'liked', 'watchlist': action == 'watchlist', action: True, 'added': True}, status=200)
