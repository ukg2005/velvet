from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework import generics
from .serializers import ListSerializer, ListEntrySerializer, ListCreateSerializer
from rest_framework.permissions import IsAuthenticated
from .models import List, ListEntry
from django.db.models import Q
from rest_framework.response import Response
from movies.services import get_movie
from .permissions import IsOwnerOrReadOnly


class ListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return List.objects.filter(Q(user=self.request.user) | Q(is_public=True)).distinct().prefetch_related('entries__movie')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ListCreateSerializer
        else:
            return ListSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ListDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]
    serializer_class = ListSerializer

    def get_queryset(self):
        return List.objects.filter(Q(user=self.request.user) | Q(is_public=True)).distinct().prefetch_related('entries__movie')

class AddMovieToListView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ListSerializer

    def post(self, request, pk):
        list_id = pk
        tmdb_id = request.data.get('tmdb_id')
        list = List.objects.filter(pk=list_id, user=request.user).first()
        if not list:
            return Response({'error': f'List with id {list_id} not found.'}, status=404)
        
        movie = get_movie(tmdb_id=tmdb_id)
        if not movie:
            return Response({'error': f'Movie with id {tmdb_id} not found.'}, status=404)
        
        entry, created = ListEntry.objects.get_or_create(list=list, movie=movie)
        if created:
            entry.order=ListEntry.objects.filter(list=list).count()
            entry.save()
            return Response({'success': 'Movie Successfully added to List', 'entry_id': entry.id}, status=201)
        return Response({'warning': 'Movie already exists in the list', 'entry_id': entry.id}, status=200)

class ListReorderView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ListSerializer

    def post(self, request, pk):
        list = List.objects.filter(pk=pk, user=request.user).first()
        if not list:
            return Response({'error': 'List  not found or unauthorized.'}, status=404)
        
        incoming_ids = [item['id'] for item in request.data]
        valid_entries = ListEntry.objects.filter(
            list_id=pk,
            id__in=incoming_ids
        )
        if valid_entries.count() != len(incoming_ids):
            return Response({'error': 'One or more Entry IDs are invalid for this list.'}, status=400)
        
        valid_entries = {entry.pk: entry for entry in valid_entries}
        for item in request.data:
            entry = valid_entries[item['id']]
            entry.order = item['order']
        ListEntry.objects.bulk_update(valid_entries.values(), ['order'])
        return Response({'success': 'List reordered successfully'}, status=200)
        



