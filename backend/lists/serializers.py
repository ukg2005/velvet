from rest_framework import serializers
from .models import List, ListEntry
from movies.serializers import MovieListSerializer

class ListEntrySerializer(serializers.ModelSerializer):
    movie = MovieListSerializer()

    class Meta:
        model = ListEntry
        fields = ['id', 'movie', 'added_at', 'order']
        read_only_fields = ['added_at', 'order']

class ListSerializer(serializers.ModelSerializer):
    entries = ListEntrySerializer(many=True, read_only=True)
    count = serializers.SerializerMethodField()

    class Meta:
        model = List
        fields = ['id', 'title', 'desc', 'is_public', 'updated_at', 'user', 'created_at', 'entries', 'count']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def get_count(self, obj):
        return obj.movies.count()

class ListCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = List
        fields = ['id', 'user', 'is_public', 'title', 'desc']
        read_only_fields = ['user', 'id']
