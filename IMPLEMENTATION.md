# Movies App - Implementation Details

## Database Models

### Overview

The movies app uses five main models with relationships between them:

```
Movie ←→ Genre (ManyToMany)
Movie ←→ Person (ManyToMany through CastMembership)
Movie ←→ Person (ManyToMany through CrewMembership)
Person (standalone)
```

### 1. Movie Model

The main model representing a film with metadata from TMDB.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `tmdb_id` | IntegerField, unique | Unique identifier from TMDB |
| `title` | CharField(200) | Movie title |
| `original_title` | CharField(200) | Original title in original language |
| `runtime` | IntegerField, nullable | Duration in minutes |
| `poster_path` | CharField(200) | Path to poster image on TMDB CDN |
| `backdrop_path` | CharField(200) | Path to backdrop/banner image |
| `overview` | TextField | Plot summary |
| `tagline` | CharField(200) | Movie tagline/slogan |
| `release_date` | DateField, nullable | Official release date |
| `rating` | DecimalField(3, 1) | Average rating (0.0-10.0) |
| `original_language` | CharField(100) | Language code (e.g., 'en', 'fr') |
| `vote_count` | IntegerField, default=0 | Number of votes received |
| `is_fully_synced` | BooleanField, default=False | Whether all details are from TMDB |
| `last_synced` | DateTimeField, nullable | Timestamp of last update |
| `genres` | ManyToManyField | Related genres (blank allowed) |
| `cast` | ManyToManyField through `CastMembership` | Cast members (blank allowed) |
| `crew` | ManyToManyField through `CrewMembership` | Crew members (blank allowed) |

**Methods:**
- `__str__()` - Returns movie title

---

### 2. Genre Model

Movie genres/categories.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `tmdb_id` | IntegerField, unique | TMDB genre ID |
| `name` | CharField(100) | Genre name (e.g., 'Action', 'Drama') |

**Methods:**
- `__str__()` - Returns genre name

---

### 3. Person Model

Represents an actor, director, writer, or other crew member.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `tmdb_id` | IntegerField, unique | TMDB person ID |
| `name` | CharField(50) | Full name |
| `profile_path` | CharField(200), nullable | Path to profile photo on TMDB CDN |
| `date_of_birth` | DateField, nullable | Birth date |
| `place_of_birth` | CharField(200), nullable | Birthplace |
| `bio` | TextField, nullable | Biography/description |
| `last_synced` | DateTimeField, nullable | Last update timestamp |

**Methods:**
- `__str__()` - Returns person's name

---

### 4. CastMembership Model

Intermediate model linking movies to cast members with role information.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `person` | ForeignKey(Person) | Reference to Person |
| `movie` | ForeignKey(Movie) | Reference to Movie |
| `character` | CharField(200), nullable | Character name played |
| `order` | IntegerField, default=0 | Billing order (lower = more prominent) |

**Meta:**
- `ordering = ['order']` - Results ordered by billing position

---

### 5. CrewMembership Model

Intermediate model linking movies to crew members with job information.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `person` | ForeignKey(Person) | Reference to Person |
| `movie` | ForeignKey(Movie) | Reference to Movie |
| `job` | CharField(100), nullable | Job title (e.g., 'Director', 'Writer', 'Cinematographer') |
| `department` | CharField(200), nullable | Department (e.g., 'Directing', 'Writing', 'Camera') |

**Meta:**
- `ordering = ['department']` - Results ordered by department

---

## Serializers

Serializers handle data serialization for API responses and use DRF's `ModelSerializer` base class.

### GenreSerializer

Simple serializer for genre objects.

**Fields:** `id`, `tmdb_id`, `name`

```python
class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'tmdb_id', 'name']
```

---

### PersonListSerializer

Serializes person objects with computed profile image URL.

**Fields:** `id`, `tmdb_id`, `name`, `profile_url`

**Custom Methods:**
- `get_profile_url(obj)` - Generates TMDB CDN URL (w185 width) from `profile_path`

```python
class PersonListSerializer(serializers.ModelSerializer):
    profile_url = serializers.SerializerMethodField()

    def get_profile_url(self, obj):
        if not obj.profile_path:
            return None
        return f'{TMDB_IMAGE_BASE}/w185{obj.profile_path}'
```

---

### CastMemberSerializer

Serializes cast membership with nested Person data.

**Fields:** `person`, `character`, `order`

**Nested Objects:**
- `person` - PersonListSerializer (nested)

---

### CrewMemberSerializer

Serializes crew membership with nested Person data.

**Fields:** `person`, `job`, `department`

**Nested Objects:**
- `person` - PersonListSerializer (nested)

---

### MovieListSerializer

Compact movie serializer for list views and search results.

**Fields:** `id`, `tmdb_id`, `title`, `poster_url`, `year`, `rating`, `vote_count`

**Custom Methods:**
- `get_poster_url(obj)` - Generates TMDB CDN URL (w342 width)
- `get_year(obj)` - Extracts year from `release_date`

Used in:
- Search results
- Top-rated list
- Trending list
- Nested in recommendations

---

### MovieDetailSerializer

Complete movie serializer with all relationships and details.

**Base:** Extends MovieListSerializer

**Additional Fields:**
- `poster_url`, `backdrop_url` (computed, w500 and w1200 widths)
- `overview`, `tagline`, `runtime`, `original_language`, `rating`
- `genres` - GenreSerializer (many=True, nested)
- `cast` - CastMemberSerializer (many=True, computed)
- `crew` - CrewMemberSerializer (many=True, computed)
- `directors` - PersonListSerializer (many=True, computed)
- `recommendations` - MovieListSerializer (many=True, from context)
- `similar_movies` - MovieListSerializer (many=True, from context)

**Custom Methods:**
- `get_cast(obj)` - Filters CastMembership by movie with select_related optimization
- `get_crew(obj)` - Filters CrewMembership by movie with select_related optimization
- `get_directors(obj)` - Filters crew with job='Director'
- `get_recommendations(obj)` - Retrieves from context passed by view

---

## Services

Business logic and TMDB API integration in `services.py`.

### Constants

```python
TMDB_BASE = 'https://api.themoviedb.org/3/'
```

### Helper Functions

#### `_parse_tmdb_date(value)`
Safely converts ISO date string to Python `date` object.

```python
def _parse_tmdb_date(value):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None
```

---

#### `_safe_str(value)`
Returns string or empty string if None.

```python
def _safe_str(value):
    return value or ''
```

---

#### `_get(endpoint, params=None, timeout=5)`
Internal helper for authenticated TMDB API requests.

**Parameters:**
- `endpoint` (string): TMDB API endpoint (e.g., 'search/movie', 'movie/550')
- `params` (dict, optional): Query parameters
- `timeout` (int, default=5): Request timeout in seconds

**Behavior:**
- Automatically includes API key from settings
- Raises HTTP exception on non-2xx responses

**Returns:** Parsed JSON response

```python
def _get(endpoint, params=None, timeout=5):
    params = params or {}
    response = requests.get(
        f'{TMDB_BASE}{endpoint}',
        params={'api_key': settings.TMDB_API_KEY, **params},
        timeout=timeout,
    )
    response.raise_for_status()
    return response.json()
```

---

### Core Service Functions

#### `search_movies(query, page=1, filters=None)`

Search for movies on TMDB and create/update local records.

**Parameters:**
- `query` (string): Search query string
- `page` (int, default=1): Page number for pagination
- `filters` (dict, optional): Additional TMDB filter parameters

**Returns:** Tuple of `(movies_list, total_pages)`

**Behavior:**
1. Calls TMDB search endpoint with query and filters
2. For each result, creates or gets Movie object
3. Sets basic fields from TMDB response
4. Returns list of Movie objects and total pages

**Database Operations:** Uses `get_or_create()` for idempotency

---

#### `get_movie(tmdb_id)`

Fetch full movie details from TMDB including cast, crew, and genres. Updates local database.

**Parameters:**
- `tmdb_id` (int): TMDB movie ID

**Returns:** Movie object or None

**Caching Strategy:**
- Returns cached movie if both conditions met:
  1. `is_fully_synced == True`
  2. `last_synced` is less than 30 days old
- Always fetches fresh if not fully synced or stale
- Uses `timedelta(days=30)` for cache duration

**Behavior:**
1. Checks cache; returns if valid
2. Calls TMDB movie endpoint with `append_to_response='credits'`
3. Updates or creates Movie object with full details
4. Syncs genres: clears existing, adds new ones from TMDB
5. Syncs cast: deletes old memberships, creates up to 30 new ones
6. Syncs crew: deletes old memberships, creates new ones
7. Sets `is_fully_synced=True` and `last_synced=now()`

**Database Operations:** Uses `update_or_create()`, deletes old relationships, creates new ones

---

#### `get_person(tmdb_id)`

Fetch person details and their filmography.

**Parameters:**
- `tmdb_id` (int): TMDB person ID

**Returns:** Tuple of `(person_object, credits_dict)` or `(None, {})`

**Behavior:**
1. Gets or creates Person object
2. Fetches credits (cast and crew appearances)
3. Returns person and formatted credits dict

---

#### `get_top_rated(page=1)`

Fetch top-rated movies from TMDB and update local records.

**Parameters:**
- `page` (int, default=1): Page number

**Returns:** Tuple of `(movies_list, total_pages)`

**Behavior:**
1. Calls TMDB top-rated endpoint
2. Creates/updates Movie objects
3. Returns paginated results

---

#### `get_trending()`

Fetch currently trending movies from TMDB.

**Returns:** List of Movie objects

**Behavior:**
1. Calls TMDB trending endpoint
2. Creates/updates Movie objects
3. Returns list of trending movies

---

#### `get_recommendations(tmdb_id)`

Fetch recommended movies based on a specific movie.

**Parameters:**
- `tmdb_id` (int): TMDB movie ID

**Returns:** List of Movie objects

**Behavior:**
1. Calls TMDB recommendations endpoint
2. Creates/updates Movie objects
3. Returns recommendations

---

#### `hard_reset_data()`

Delete all movies, genres, persons, and membership records from the database.

**⚠️ Warning:** This is destructive and cannot be undone.

**Behavior:**
1. Deletes all Movie, Genre, Person objects
2. CascadeDelete removes all related memberships

Used by the `/reset/` endpoint for testing/debugging purposes.

---

## Configuration

### Required Settings

Add to `settings.py`:

```python
TMDB_API_KEY = 'your_tmdb_api_key_here'
```

**Get API Key:**
1. Visit https://www.themoviedb.org/settings/api
2. Register for an account if needed
3. Request an API key
4. Copy your API key to settings

### Image URLs

TMDB provides images through a CDN with various widths:

**Base URL:** `https://image.tmdb.org/t/p`

**Common Widths Used:**
- `w185` - Profile photos and small avatars (185px)
- `w342` - Movie posters for lists (342px)
- `w500` - Movie posters for details (500px)
- `w1200` - Movie backdrops (1200px, full width)

**Example URLs:**
```
https://image.tmdb.org/t/p/w500/abc123def456.jpg  (poster)
https://image.tmdb.org/t/p/w185/xyz789abc.jpg     (profile)
```

---

## Performance Considerations

### 1. Caching Strategy

Movies are cached for 30 days to minimize TMDB API calls:

```python
# Cache valid if:
# - is_fully_synced = True AND
# - (now - last_synced) < 30 days
```

To force refresh:
```python
movie.last_synced = None
movie.save()
# Next call to get_movie() will fetch fresh data
```

---

### 2. Cast Limit

Only the top **30 cast members** are stored:

```python
for member in data.get('credits', {}).get('cast', [])[:30]:
    # Create CastMembership
```

This limits database growth while keeping the most important cast.

---

### 3. Query Optimization

Serializers use `select_related()` to reduce N+1 queries:

```python
# In get_cast():
memberships = CastMembership.objects.filter(movie=obj).select_related('person')

# In get_crew():
memberships = CrewMembership.objects.filter(movie=obj).select_related('person')
```

---

### 4. TMDB Rate Limiting

Default request timeout is **5 seconds**. Consider implementing:
- Distributed caching (Redis)
- Rate limiting middleware
- Request batching for bulk operations

---

## Testing

### Run All Tests

```bash
python manage.py test movies
```

### Run Specific Test

```bash
python manage.py test movies.tests.YourTestClass
```

### Test Coverage

```bash
coverage run --source='movies' manage.py test
coverage report
```

Tests are defined in `tests.py` and should cover:
- Model creation and relationships
- Serializer output formats
- API endpoint responses
- Service functions and TMDB integration
- Error handling

---

## Troubleshooting

### Problem: API Key Error

**Solution:** Verify `TMDB_API_KEY` is set in settings and valid.

### Problem: Timeout Errors

**Solution:** Increase timeout in `_get()` function or check network connectivity.

### Problem: Stale Movie Data

**Solution:** Reset `last_synced` to None for the movie and call `get_movie()` again.

### Problem: Cast Count Inconsistency

**Note:** Only 30 cast members are synced. This is intentional for performance.

---

## Future Enhancements

- [ ] Implement pagination for cast/crew lists (currently limited to 30)
- [ ] Add full-text search indexing
- [ ] Implement Redis caching for frequently accessed movies
- [ ] Add user ratings and reviews
- [ ] Implement watchlist/favorites functionality
- [ ] Add advanced filters (by genre, year, rating range)
- [ ] Implement GraphQL API for flexible queries
- [ ] Add bulk import functionality
- [ ] Implement webhook notifications for trending changes
