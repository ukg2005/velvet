from rest_framework.views import APIView
from .services import search_movies, get_movie, get_person, get_top_rated, get_trending, hard_reset_data, get_similar_movies, get_watch_providers, get_omdb_ratings, discover_movies
from .serializers import MovieListSerializer, MovieDetailSerializer, PersonDetailSerializer
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page


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
        movies_data = MovieListSerializer(data['movies'], many=True).data
        return Response({
            'movies': movies_data,
            'people': data['people']
        })

class MovieDetailView(APIView):
    serializer_class = MovieDetailSerializer

    def get(self, request, tmdb_id):
        movie = get_movie(tmdb_id)
        if not movie:
            return Response({'error': 'Movie not found'}, status=404)
        
        similar = get_similar_movies(tmdb_id)
        response = MovieDetailSerializer(movie, context={
            'recommendations': similar,
            'similar_movies': similar,
        })
        
        res_data = response.data
        
        watch_options = get_watch_providers(tmdb_id, 'US')
        tmdb_link = watch_options.get('link', '')
        options = []
        for ptype in ['flatrate', 'rent', 'buy']:
            for provider in watch_options.get(ptype, []):
                options.append({
                    'provider': provider['provider_name'],
                    'type': 'stream' if ptype == 'flatrate' else ptype,
                    'logo': f"https://image.tmdb.org/t/p/w200{provider['logo_path']}" if provider.get('logo_path') else '',
                    'link': tmdb_link,
                })
        
        res_data['watch_options'] = options
        res_data['omdb_ratings'] = get_omdb_ratings(tmdb_id)
        
        return Response(res_data)

class PersonDetailView(APIView):
    serializer_class = PersonDetailSerializer

    def get(self, request, tmdb_id):
        person, credits = get_person(tmdb_id)
        if not person:
            return Response({'error': 'Person not found'}, status=404)
        response = dict(PersonDetailSerializer(person).data)
        return Response(response | credits)
        
@method_decorator(cache_page(60 * 30), name='dispatch')
class TopRatedView(APIView):
    serializer_class = MovieListSerializer

    def get(self, request):
        movies, total_pages = get_top_rated(int(request.query_params.get('page', 1)))
        response = MovieListSerializer(movies, many=True)
        return Response({
            'movies': response.data,
            'total_pages': total_pages
        })

@method_decorator(cache_page(60 * 30), name='dispatch')
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

@method_decorator(cache_page(60 * 15), name='dispatch')
class DiscoverView(APIView):
    serializer_class = MovieListSerializer

    def get(self, request):
        query_data = request.query_params
        page = int(query_data.get('page', 1))
        filters = {k: v for k, v in query_data.items() if k != 'page'}
        
        movies, total_pages = discover_movies(page, filters)
        response = MovieListSerializer(movies, many=True)
        return Response({
            'movies': response.data,
            'total_pages': total_pages
        })