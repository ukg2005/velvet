from rest_framework.views import APIView
from .services import search_movies, get_movie, get_person, get_top_rated, get_trending, hard_reset_data, get_recommendations
from .serializers import MovieListSerializer, MovieDetailSerializer, PersonDetailSerializer
from rest_framework.response import Response


class SearchView(APIView):
    serializer_class = MovieListSerializer

    def get(self, request):
        query_data = request.query_params
        query = query_data.get('query') or query_data.get('q')
        if not query:
            return Response({'error': 'Query Required'}, status=400)
        page = int(query_data.get('page', 1))
        filters = query_data.get('filters') or {}
        data, _ = search_movies(query, page, filters)
        response = MovieListSerializer(data, many=True)
        return Response(response.data)

class MovieDetailView(APIView):
    serializer_class = MovieDetailSerializer

    def get(self, request, tmdb_id):
        movie = get_movie(tmdb_id)
        if not movie:
            return Response({'error': 'Movie not found'}, status=404)
        recommendations = get_recommendations(tmdb_id)
        response = MovieDetailSerializer(movie, context={
            'recommendations': recommendations,
            'similar_movies': recommendations,
        })
        return Response(response.data)

class PersonDetailView(APIView):
    serializer_class = PersonDetailSerializer

    def get(self, request, tmdb_id):
        person, credits = get_person(tmdb_id)
        if not person:
            return Response({'error': 'Person not found'}, status=404)
        response = dict(PersonDetailSerializer(person).data)
        return Response(response | credits)
        
class TopRatedView(APIView):
    serializer_class = MovieListSerializer

    def get(self, request):
        movies, total_pages = get_top_rated(int(request.query_params.get('page', 1)))
        response = MovieListSerializer(movies, many=True)
        return Response({
            'movies': response.data,
            'total_pages': total_pages
        })

class TrendingView(APIView):
    serializer_class = MovieListSerializer

    def get(self, request):
        movies = get_trending()
        response = MovieListSerializer(movies, many=True)
        return Response(response.data)

class ResetView(APIView):
    def post(self, request):
        hard_reset_data()
        return Response({'message': 'Data has been reset'})