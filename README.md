# Movies App

A Django REST Framework application that manages movie data, including films, genres, cast, and crew information with TMDB API integration.

## Overview

The **movies** app provides a complete movie management solution with the following features:

- **Movie Database:** Store and manage movie metadata (title, release date, ratings, etc.)
- **TMDB Integration:** Sync data with The Movie Database (TMDB) API for comprehensive movie information
- **Cast & Crew Management:** Track actors and crew members with their roles and relationships to movies
- **Advanced Search:** Search movies by query with pagination support
- **Smart Caching:** Automatically cache movie data for 30 days to reduce API calls
- **Recommendations:** Fetch recommended and similar movies
- **Genre Classification:** Organize movies by genre

## Quick Start

### Installation

1. Ensure the app is installed in your Django project:
   ```python
   # settings.py
   INSTALLED_APPS = [
       ...
       'movies',
   ]
   ```

2. Set up TMDB API key:
   ```python
   # settings.py
   TMDB_API_KEY = 'your_api_key_here'
   ```

3. Run migrations:
   ```bash
   python manage.py migrate
   ```

### Basic Usage

```bash
# Search for movies
GET /api/movies/search/?query=fight%20club

# Get movie details
GET /api/movies/movie/550/

# Get trending movies
GET /api/movies/trending/

# Get top-rated movies
GET /api/movies/top_rated/
```

## Directory Structure

```
movies/
├── __init__.py
├── admin.py              # Django admin configuration
├── apps.py               # App configuration
├── models.py             # Database models (Movie, Genre, Person, etc.)
├── serializers.py        # DRF serializers for API responses
├── services.py           # Business logic and TMDB API integration
├── tests.py              # Unit tests
├── urls.py               # URL routing
├── views.py              # API view handlers
└── migrations/           # Database migrations
```

## API Endpoints

All endpoints are prefixed with `/api/movies/`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search/` | Search movies by query |
| GET | `/movie/<tmdb_id>/` | Get full movie details |
| GET | `/person/<tmdb_id>/` | Get person details and filmography |
| GET | `/top_rated/` | Get top-rated movies |
| GET | `/trending/` | Get currently trending movies |
| POST | `/reset/` | Reset all movie data |

For detailed API documentation, see [API.md](API.md).

## Data Models

The app manages the following entities:

- **Movie:** Film metadata and relationships
- **Genre:** Movie categories
- **Person:** Actors and crew members
- **CastMembership:** Relationship between movies and cast
- **CrewMembership:** Relationship between movies and crew

For detailed model documentation, see [IMPLEMENTATION.md](IMPLEMENTATION.md).

## Configuration

### Required Settings

```python
TMDB_API_KEY = 'your_tmdb_api_key_here'
```

Get an API key from: https://www.themoviedb.org/settings/api

### Image URLs

Images are served through TMDB CDN:
- Base: `https://image.tmdb.org/t/p`
- Common sizes: `w185`, `w342`, `w500`, `w1200`

For implementation details, see [IMPLEMENTATION.md](IMPLEMENTATION.md).

## Testing

```bash
python manage.py test movies
```

## Key Features

✅ **TMDB Sync** - Automatic data synchronization with The Movie Database
✅ **Caching** - Smart 30-day caching to minimize API calls
✅ **Rich Data** - Complete movie information including cast, crew, and genres
✅ **Search** - Full-text search with pagination
✅ **Recommendations** - Get similar and recommended movies
✅ **Flexible Queries** - RESTful API with clean endpoints

## Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API endpoint documentation
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Implementation details, models, and services
