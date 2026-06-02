from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from logs.models import Log
from stats.models import UserStats
from stats.services import calculate_user_stats

class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        year_str = request.query_params.get('year')
        year = int(year_str) if year_str and year_str.isdigit() else None
        
        # Check if we have pre-calculated stats
        try:
            stats = UserStats.objects.get(user=user, year=year)
        except UserStats.DoesNotExist:
            # First time for this user/year, calculate it synchronously once
            calculate_user_stats(user.id, year)
            try:
                stats = UserStats.objects.get(user=user, year=year)
            except UserStats.DoesNotExist:
                # If they have 0 logs, it might not create anything. Return empty defaults.
                return Response({
                    'overview': {
                        'total_movies': 0,
                        'total_mins': 0,
                        'total_hours': 0,
                        'avg_rating': 0.0,
                    },
                    'comparison': {'this_year': 0, 'last_year': 0, 'growth': 0},
                    'top_genres': [],
                    'top_actors': [],
                    'top_directors': [],
                    'decades': {},
                    'languages': [],
                    'rating_distribution': []
                })

        # Calculate YoY comparison (always based on all-time data regardless of year filter)
        current_year = timezone.now().year
        this_year_count = Log.objects.filter(user=user, logged_at__year=current_year).count()
        last_year_count = Log.objects.filter(user=user, logged_at__year=current_year - 1).count()

        return Response({
            'overview': {
                'total_movies': stats.total_movies,
                'total_mins': stats.total_runtime,
                'total_hours': round(stats.total_runtime / 60, 1),
                'avg_rating': float(stats.avg_rating),
            },
            'comparison': {
                'this_year': this_year_count,
                'last_year': last_year_count,
                'growth': this_year_count - last_year_count
            },
            'top_genres': stats.top_genres,
            'top_actors': stats.top_actors,
            'top_directors': stats.top_directors,
            'decades': stats.decades,
            'languages': stats.languages,
            'rating_distribution': stats.rating_distribution
        })