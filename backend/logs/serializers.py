from rest_framework import serializers
from .models import Log, Liked, Watchlist
from movies.services import get_movie
from django.core.exceptions import ValidationError


class LogSerializer(serializers.ModelSerializer):
    tmdb_id = serializers.IntegerField(write_only=True)
    is_liked = serializers.BooleanField(write_only=True, default=False)
    on_watchlist = serializers.BooleanField(write_only=True, default=False)

    class Meta:
        model = Log
        fields = ['tmdb_id', 'logged_at', 'rating', 'review', 'is_liked', 'on_watchlist']
    
    def create(self, data):
        tmdb_id = data.pop('tmdb_id')
        is_liked = data.pop('is_liked')
        on_watchlist = data.pop('on_watchlist')
        user = self.context['request'].user

        movie = get_movie(tmdb_id=tmdb_id)
        if not movie:
            return ValidationError(f'Movie with tmdb id {tmdb_id} not found.')
        if is_liked:
            Liked.objects.get_or_create(user=user, movie=movie)
        if on_watchlist:
            Watchlist.objects.get_or_create(user=user, movie=movie)
        
        return Log(user=user, movie=movie, **data)
    

    