from django.db.models import Sum, Count, Avg, Max, Min, Q
from django.db.models.functions import Coalesce, ExtractYear, ExtractMonth
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from logs.models import Log

class UserStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_logs = Log.objects.filter(user=user)
        current_year = timezone.now().year

        # 1. High-Level Overview & Extremes
        # Max/Min runtime gives you the Longest/Shortest films
        overview = user_logs.aggregate(
            total_movies=Count('id'),
            total_mins=Coalesce(Sum('movie__runtime'), 0),
            avg_rating=Coalesce(Avg('rating'), 0),
            longest_runtime=Max('movie__runtime'),
            shortest_runtime=Min('movie__runtime')
        )

        # 2. Top Actors (Fixed Path: Log -> Movie -> CastMembership -> Person -> Name)
        top_actors = user_logs.values('movie__castmembership__person__name') \
            .annotate(count=Count('movie__castmembership__person__name')) \
            .exclude(movie__castmembership__person__name__isnull=True) \
            .order_by('-count')[:5]

        # 3. Top Directors (Fixed Path for consistency)
        top_directors = user_logs.filter(movie__crewmembership__job='Director') \
            .values('movie__crewmembership__person__name') \
            .annotate(count=Count('movie__crewmembership__person__name')) \
            .order_by('-count')[:5]

        # 4. Decades Breakdown (Grouping by release_date)
        # Logic: (Year // 10) * 10 gives the decade (e.g., 1994 -> 1990)
        # We use ExtractYear to get the integer from the DateField
        decades_stats = user_logs.annotate(year=ExtractYear('movie__release_date')) \
            .values('year') \
            .annotate(count=Count('id')) \
            .order_by('year')
        
        # We'll bucket these in Python for the cleanest response
        decades_bucket = {}
        for entry in decades_stats:
            if entry['year']:
                decade = (entry['year'] // 10) * 10
                label = f"{decade}s"
                decades_bucket[label] = decades_bucket.get(label, 0) + entry['count']

        # 5. Internationalization (By Language)
        languages = user_logs.values('movie__original_language') \
            .annotate(count=Count('id')) \
            .order_by('-count')[:5]

        # 6. Year-Over-Year Comparison
        this_year_count = user_logs.filter(logged_at__year=current_year).count()
        last_year_count = user_logs.filter(logged_at__year=current_year - 1).count()

        # 7. Most Watched Month (Current Year Only)
        monthly_activity = user_logs.filter(logged_at__year=current_year) \
            .values('logged_at__month') \
            .annotate(count=Count('id')) \
            .order_by('-count')
        
        most_active_month = monthly_activity[0] if monthly_activity else None

        return Response({
            'overview': {
                **overview,
                'total_hours': round(overview['total_mins'] / 60, 1),
                'most_active_month_this_year': most_active_month,
            },
            'comparison': {
                'this_year': this_year_count,
                'last_year': last_year_count,
                'growth': this_year_count - last_year_count
            },
            'top_genres': list(user_logs.values('movie__genres__name').annotate(c=Count('movie__genres__name')).order_by('-c')[:5]),
            'top_actors': list(top_actors),
            'top_directors': list(top_directors),
            'decades': decades_bucket,
            'languages': list(languages),
            'rating_distribution': list(user_logs.exclude(rating__isnull=True).values('rating').annotate(count=Count('id')).order_by('rating'))
        })