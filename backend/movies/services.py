import requests
from django.conf import settings
from .models import Movie, Genre, CastMembership, CrewMembership, Person
from datetime import date, timedelta
from django.utils import timezone

TMDB_BASE = 'https://api.themoviedb.org/3/'


def _parse_tmdb_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None

def _safe_str(value):
    return value or ''

def _get(endpoint, params={}):
    response = requests.get(
        f'{TMDB_BASE}{endpoint}',
        params={'api_key': settings.TMDB_API_KEY, **params}
    )
    response.raise_for_status()
    return response.json()

def search_movies(query, page=1, filters={}):
    data = _get('search/movie', {'query': query, 'page': page, **filters})
    results = []
    for item in data['results']:
        movie, _ = Movie.objects.get_or_create(
            tmdb_id = item['id'],
            defaults={
                'title': item['title'],
                'poster_path': _safe_str(item.get('poster_path')),
                'overview': _safe_str(item.get('overview')),
                'release_date': _parse_tmdb_date(item.get('release_date')),
                'rating': item.get('vote_average'),
                'vote_count': item.get('vote_count', 0),
                'original_language': _safe_str(item.get('original_language')),
            }
        )
        results.append(movie)
    return results, data['total_pages']

def get_movie(tmdb_id):
    try:
        movie = Movie.objects.get(tmdb_id=tmdb_id)
        stale = (
            not movie.is_fully_synced or
            movie.last_synced is None or
            timezone.now() - movie.last_synced > timedelta(days=30)
        )
        if not stale:
            return movie
    except Movie.DoesNotExist:
        movie = None
    
    data = _get(f'movie/{tmdb_id}', {'append_to_response': 'credits'})
    movie, _ = Movie.objects.get_or_create(
        tmdb_id=tmdb_id,
        defaults={
            "title": data["title"],
            "original_title": _safe_str(data.get("original_title")),
            "overview": _safe_str(data.get("overview")),
            "poster_path": _safe_str(data.get("poster_path")),
            "backdrop_path": _safe_str(data.get("backdrop_path")),
            "release_date": _parse_tmdb_date(data.get("release_date")),
            "runtime": data.get("runtime"),
            "tagline": _safe_str(data.get("tagline")),
            "original_language": _safe_str(data.get("original_language")),
            "rating": data.get("vote_average"),
            "vote_count": data.get("vote_count", 0),
            "is_fully_synced": True,
            "last_synced": timezone.now(),
        }
    )

    movie.genres.set([])
    for g in data.get('genres', []):
        genre, _ = Genre.objects.get_or_create(tmdb_id=g['id'], defaults={'name': g['name']})
        movie.genres.add(genre)
    
    CastMembership.objects.filter(movie=movie).delete()
    for member in data.get('credits', {}).get('cast', [])[:30]:
        person, _ = Person.objects.get_or_create(
            tmdb_id=member['id'],
            defaults={
                'name': member['name'],
                'profile_path': _safe_str(member.get('profile_path')),
            }
        )
        CastMembership.objects.create(
            person=person,
            movie=movie,
            character=member.get('character', ''),
            order=member.get('order', 0),
        )
    
    RELEVANT_JOBS = {
        "Director",
        "Co-Director",
        "Screenplay",
        "Writer",
        "Story",
        "Original Story",
        "Producer",
        "Executive Producer",
        "Co-Producer",
        "Director of Photography",
        "Editor",
        "Original Music Composer",
        "VFX Supervisor",
    }
    CrewMembership.objects.filter(movie=movie).delete()
    for member in data.get('credits', {}).get('crew', []):
        if member.get('job') not in RELEVANT_JOBS:
            continue
        person, _ = Person.objects.get_or_create(
            tmdb_id=member['id'],
            defaults={
                'name': member['name'],
                'profile_path': _safe_str(member.get('profile_path')),
            }
        )
        CrewMembership.objects.create(
            movie=movie,
            person=person,
            job=member.get('job', ''),
            department=member.get('department', ''),
        )

    return movie
    
def get_person(tmdb_id):
    try:
        person = Person.objects.get(tmdb_id=tmdb_id)
        stale = (
            person.last_synced is None or
            timezone.now() - person.last_synced > timedelta(days=30)
        )
        if not stale:
            return person, {}
    except Person.DoesNotExist:
        person = None
    
    data = _get(f'person/{tmdb_id}', {'append_to_response': 'movie_credits'})
    person, _ = Person.objects.update_or_create(
        tmdb_id=tmdb_id,
        defaults={
            "name": data["name"],
            "profile_path": _safe_str(data.get("profile_path")),
            "bio": _safe_str(data.get("biography")),
            "date_of_birth": _parse_tmdb_date(data.get("birthday")),
            "place_of_birth": _safe_str(data.get("place_of_birth")),
            "last_synced": timezone.now(),
        }
    )

    return person, data.get('movie_credits', {})

def get_trending():
    data = _get('trending/movie/week')
    return _bulk_upsert(data['results'])

def get_top_rated(page=1):
    data = _get('movie/top_rated', {'page': page})
    return _bulk_upsert(data['results']), data['total_pages']

def get_watch_providers(tmdb_id, country='IN'):
    data = _get(f'movie/{tmdb_id}/watch/providers')
    results = data.get('results', {})
    return results.get(country, {})

def _bulk_upsert(items):
    movies = []
    for item in items:
        movie, _ = Movie.objects.update_or_create(
            tmdb_id=item['id'],
            defaults={
                "title": item["title"],
                "poster_path": _safe_str(item.get("poster_path")),
                "overview": _safe_str(item.get("overview")),
                "release_date": _parse_tmdb_date(item.get("release_date")),
                "rating": item.get("vote_average"),
                "vote_count": item.get("vote_count", 0),
            }
        )
        movies.append(movie)
    return movies
