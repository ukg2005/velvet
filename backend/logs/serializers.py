from rest_framework import serializers
from .models import Log, Liked, Watchlist
from movies.services import get_movie
from movies.serializers import MovieListSerializer
from django.core.exceptions import ValidationError
from datetime import date


class LogSerializer(serializers.ModelSerializer):
    tmdb_id = serializers.IntegerField(write_only=True)
    is_liked = serializers.BooleanField(write_only=True, default=False)
    on_watchlist = serializers.BooleanField(write_only=True, default=False)
    logged_at = serializers.DateField(default=date.today)
    movie = MovieListSerializer(read_only=True)

    class Meta:
        model = Log
        fields = ['tmdb_id', 'logged_at', 'rating', 'review', 'is_liked', 'on_watchlist', 'movie']
    
    def create(self, data):
        tmdb_id = data.pop('tmdb_id')
        is_liked = data.pop('is_liked', False)
        on_watchlist = data.pop('on_watchlist', False)
        user = data.pop('user')
        movie = data.pop('movie')

        if is_liked:
            Liked.objects.get_or_create(user=user, movie=movie)
        if on_watchlist:
            Watchlist.objects.get_or_create(user=user, movie=movie)
        
        log = Log.objects.create(user=user, movie=movie, **data)
        return log
    