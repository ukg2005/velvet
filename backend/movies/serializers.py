from rest_framework import serializers
from .models import Movie, Person, Genre, CastMembership, CrewMembership

TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'


class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'tmdb_id', 'name']

class PersonListSerializer(serializers.ModelSerializer):
    profile_url = serializers.SerializerMethodField()

    def get_profile_url(self, obj):
        if not obj.profile_path:
            return None
        return f'{TMDB_IMAGE_BASE}/w185{obj.profile_path}'
    
    class Meta:
        model = Person
        fields = ['id', 'tmdb_id', 'name', 'profile_url']

class CastMemberSerializer(serializers.ModelSerializer):
    person = PersonListSerializer()

    class Meta:
        model = CastMembership
        fields = ['person', 'character', 'order']

class CrewMemberSerializer(serializers.ModelSerializer):
    person = PersonListSerializer()

    class Meta:
        model = CrewMembership
        fields = ['person', 'job', 'department']

class MovieListSerializer(serializers.ModelSerializer):
    poster_url = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()

    def get_poster_url(self, obj):
        if not obj.poster_path:
            return None
        return f'{TMDB_IMAGE_BASE}/w342{obj.poster_path}'
    
    def get_year(self, obj):
        if not obj.release_date:
            return None
        return obj.release_date.year
    
    class Meta:
        model = Movie
        fields = ['id', 'tmdb_id', 'title', 'poster_url', 'year', 'rating', 'vote_count']

class MovieDetailSerializer(serializers.ModelSerializer):
    poster_url = serializers.SerializerMethodField()
    backdrop_url = serializers.SerializerMethodField()
    year = serializers.SerializerMethodField()
    genres = GenreSerializer(many=True)
    cast = serializers.SerializerMethodField()
    crew = serializers.SerializerMethodField()
    directors = serializers.SerializerMethodField()

    def get_poster_url(self, obj):
        if not obj.poster_path:
            return None
        return f'{TMDB_IMAGE_BASE}/w500{obj.poster_path}'

    def get_backdrop_url(self, obj):
        if not obj.backdrop_path:
            return None
        return f'{TMDB_IMAGE_BASE}/w1200{obj.backdrop_path}'
    
    def get_year(self, obj):
        if not obj.release_date:
            return None
        return obj.release_date.year
    
    def get_cast(self, obj):
        memberships = CastMembership.objects.filter(movie=obj).select_related('person')
        return CastMemberSerializer(memberships, many=True).data

    def get_crew(self, obj):
        memberships = CrewMembership.objects.filter(movie=obj).select_related('person')
        return CrewMemberSerializer(memberships, many=True).data

    def get_directors(self, obj):
        memberships = CrewMembership.objects.filter(movie=obj, job='Director').select_related('person')
        directors = [membership.person for membership in memberships]
        if not directors:
            return []
        return PersonListSerializer(directors, many=True).data

    class Meta:
        model = Movie
        fields = ['id', 'tmdb_id', 'title', 'poster_url', 'backdrop_url', 'original_title', 'overview', 'tagline', 'year', 'release_date', 'runtime', 'original_language', 'rating', 'vote_count', 'genres', 'cast', 'crew', 'directors']

class PersonDetailSerializer(serializers.ModelSerializer):
    profile_url = serializers.SerializerMethodField()

    def get_profile_url(self, obj):
        if not obj.profile_path:
            return None
        return f'{TMDB_IMAGE_BASE}/w500{obj.profile_path}'

    class Meta:
        model = Person
        fields = ['id', 'tmdb_id', 'name', 'profile_url', 'date_of_birth', 'place_of_birth', 'bio']