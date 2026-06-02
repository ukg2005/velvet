from django.db.models import Sum, Count, Avg, Max, Min, IntegerField, DecimalField
from django.db.models.functions import Coalesce, ExtractYear
from users.models import User
from logs.models import Log
from stats.models import UserStats

def calculate_user_stats(user_id, year=None):
    try:
        user = User.objects.get(id=user_id)
        logs = Log.objects.filter(user=user)
        
        if year:
            logs = logs.filter(logged_at__year=year)
            
        overview = logs.aggregate(
            total_movies=Count('id'),
            total_mins=Coalesce(Sum('movie__runtime'), 0, output_field=IntegerField()),
            avg_rating=Coalesce(Avg('rating'), 0.0, output_field=DecimalField())
        )
        
        total_movies = overview['total_movies']
        total_runtime = overview['total_mins']
        avg_rating = overview['avg_rating']
        
        # 2. Top Actors
        top_actors = list(logs.values('movie__castmembership__person__name') \
            .annotate(count=Count('movie__castmembership__person__name')) \
            .exclude(movie__castmembership__person__name__isnull=True) \
            .order_by('-count')[:20])

        # 3. Top Directors
        top_directors = list(logs.filter(movie__crewmembership__job='Director') \
            .values('movie__crewmembership__person__name') \
            .annotate(count=Count('movie__crewmembership__person__name')) \
            .order_by('-count')[:20])
            
        # Genres
        top_genres = list(logs.values('movie__genres__name').annotate(c=Count('movie__genres__name')).order_by('-c')[:20])
        
        # Decades
        decades_stats = logs.annotate(release_year=ExtractYear('movie__release_date')) \
            .values('release_year') \
            .annotate(count=Count('id')) \
            .order_by('release_year')
        
        decades_bucket = {}
        for entry in decades_stats:
            if entry['release_year']:
                decade = (int(entry['release_year']) // 10) * 10
                label = f"{decade}s"
                decades_bucket[label] = decades_bucket.get(label, 0) + entry['count']
                
        # Languages
        languages = list(logs.values('movie__original_language') \
            .annotate(count=Count('id')) \
            .order_by('-count')[:20])
            
        # Rating Distribution
        rating_dist = list(logs.exclude(rating__isnull=True).values('rating').annotate(count=Count('id')).order_by('rating'))
        # convert Decimal to float for JSON serialization
        for r in rating_dist:
            r['rating'] = float(r['rating'])
            
        # Save to UserStats
        UserStats.objects.update_or_create(
            user=user,
            year=year,
            defaults={
                'total_movies': total_movies,
                'total_runtime': total_runtime,
                'avg_rating': avg_rating,
                'top_actors': top_actors,
                'top_directors': top_directors,
                'top_genres': top_genres,
                'decades': decades_bucket,
                'languages': languages,
                'rating_distribution': rating_dist,
                'is_stale': False
            }
        )
    except Exception as e:
        print(f"Failed to calculate stats for user {user_id}: {e}")
