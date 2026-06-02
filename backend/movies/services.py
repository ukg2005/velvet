import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from django.conf import settings
from .models import Movie, Genre, CastMembership, CrewMembership, Person
from datetime import date, timedelta
from django.utils import timezone
from django.db import transaction
from requests.exceptions import RequestException

TMDB_BASE = 'https://api.themoviedb.org/3/'

session = requests.Session()
retry = Retry(connect=3, backoff_factor=0.5)
adapter = HTTPAdapter(max_retries=retry)
session.mount('http://', adapter)
session.mount('https://', adapter)

def _parse_tmdb_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None

def _safe_str(value):
    return value or ''

def _get(endpoint, params=None, timeout=5):
    params = params or {}
    response = session.get(
        f'{TMDB_BASE}{endpoint}',
        params={'api_key': settings.TMDB_API_KEY, **params},
        timeout=timeout,
    )
    response.raise_for_status()
    return response.json()

def search_movies(query, page=1, filters=None):
    filters = filters or {}
    try:
        data = _get('search/multi', {'query': query, 'page': page, **filters})      
    except RequestException:
        return {'movies': [], 'people': []}, 1
        
    results = data.get('results', [])
    movies = [r for r in results if r.get('media_type') == 'movie']
    people = [r for r in results if r.get('media_type') == 'person']
    
    saved_movies = _bulk_upsert(movies)
    return {'movies': saved_movies, 'people': people}, data.get('total_pages', 1)

def discover_movies(page=1, filters=None):
    filters = filters or {}
    try:
        data = _get('discover/movie', {'page': page, **filters})
    except RequestException:
        return [], 1
        
    results = _bulk_upsert(data.get('results', []))
    return results, data.get('total_pages', 1)

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
    movie, _ = Movie.objects.update_or_create(
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
    cast_memberships = []
    for member in data.get('credits', {}).get('cast', [])[:30]:
        person, _ = Person.objects.get_or_create(
            tmdb_id=member['id'],
            defaults={
                'name': member['name'],
                'profile_path': _safe_str(member.get('profile_path')),
            }
        )
        cast_memberships.append(CastMembership(
            person=person,
            movie=movie,
            character=member.get('character', ''),
            order=member.get('order', 0),
        ))
    if cast_memberships:
        CastMembership.objects.bulk_create(cast_memberships)
    
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
    crew_memberships = []
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
        crew_memberships.append(CrewMembership(
            movie=movie,
            person=person,
            job=member.get('job', ''),
            department=member.get('department', ''),
        ))
    if crew_memberships:
        CrewMembership.objects.bulk_create(crew_memberships)

    return movie
    
def get_person(tmdb_id):
    data = _get(f'person/{tmdb_id}', {'append_to_response': 'movie_credits'})
    
    try:
        person = Person.objects.get(tmdb_id=tmdb_id)
        stale = (
            person.last_synced is None or
            timezone.now() - person.last_synced > timedelta(days=30)
        )
    except Person.DoesNotExist:
        person = None
        stale = True
        
    if stale:
        person, _ = Person.objects.update_or_create(
            tmdb_id=tmdb_id,
            defaults={
                "name": data.get("name", ""),
                "known_for_department": _safe_str(data.get("known_for_department")),
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

def get_recommendations(tmdb_id, limit=6):
    try:
        data = _get(f'movie/{tmdb_id}/recommendations')
    except RequestException:
        return []
    movies = _bulk_upsert(data.get('results', []))
    return movies[:limit]


def get_similar_movies(tmdb_id, limit=6):
    try:
        data = _get(f'movie/{tmdb_id}/similar')
    except RequestException:
        return []
    movies = _bulk_upsert(data.get('results', []))
    return movies[:limit]

def get_omdb_ratings(tmdb_id):
    if not settings.OMDB_API_KEY:
        return {}
    
    try:
        data = _get(f'movie/{tmdb_id}/external_ids')
        imdb_id = data.get('imdb_id')
        if not imdb_id:
            return {}
            
        omdb_res = session.get(
            'https://www.omdbapi.com/',
            params={'apikey': settings.OMDB_API_KEY, 'i': imdb_id},
            timeout=5
        )
        if omdb_res.status_code == 200:
            omdb_data = omdb_res.json()
            if omdb_data.get('Response') == 'True':
                ratings = {}
                for rating in omdb_data.get('Ratings', []):
                    ratings[rating['Source']] = rating['Value']
                return {
                    'imdbRating': omdb_data.get('imdbRating'),
                    'Metascore': omdb_data.get('Metascore'),
                    'Ratings': ratings,
                }
        return {}
    except Exception:
        return {}

@transaction.atomic
def _bulk_upsert(items):
    unique_items = []
    seen = set()
    for item in items:
        if item.get('id') and item['id'] not in seen:
            seen.add(item['id'])
            unique_items.append(item)
    items = unique_items

    tmdb_ids = [item['id'] for item in items]
    existing_movies = {m.tmdb_id: m for m in Movie.objects.filter(tmdb_id__in=tmdb_ids)}
    
    to_create = []
    to_update = []
    
    for item in items:
        defaults = {
            "title": item["title"],
            "poster_path": _safe_str(item.get("poster_path")),
            "overview": _safe_str(item.get("overview")),
            "release_date": _parse_tmdb_date(item.get("release_date")),
            "rating": item.get("vote_average"),
            "vote_count": item.get("vote_count", 0),
            "original_language": _safe_str(item.get("original_language")),
        }
        
        if item['id'] in existing_movies:
            movie = existing_movies[item['id']]
            for key, value in defaults.items():
                setattr(movie, key, value)
            to_update.append(movie)
        else:
            movie = Movie(tmdb_id=item['id'], **defaults)
            to_create.append(movie)
            
    if to_create:
        Movie.objects.bulk_create(to_create)
    if to_update:
        Movie.objects.bulk_update(to_update, ['title', 'poster_path', 'overview', 'release_date', 'rating', 'vote_count', 'original_language'])
        
    result_map = {m.tmdb_id: m for m in existing_movies.values()}
    for m in to_create:
        result_map[m.tmdb_id] = m
        
    return [result_map[item['id']] for item in items if item['id'] in result_map]

@transaction.atomic
def hard_reset_data():
    Movie.objects.all().delete()
    Genre.objects.all().delete()
    CastMembership.objects.all().delete()
    CrewMembership.objects.all().delete()
    Person.objects.all().delete()
