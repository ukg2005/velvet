# Velvet - Quick Revision Notes

## 1. Project Snapshot

- Backend-only Django REST API project
- Main goal: movie discovery + personal movie tracking
- External data source: TMDB API
- Auth style: OTP + JWT

## 2. Stack (Remember These)

- Django 6
- Django REST Framework
- SimpleJWT (access + refresh)
- drf-spectacular (Swagger/ReDoc/OpenAPI)
- requests (TMDB HTTP calls)
- SQLite (dev database)

## 3. Core Apps and Responsibilities

### users
- Custom User model (email-based login identity)
- OTP generation + email send
- Register -> verify-email -> login -> login/verify -> me
- JWT issuance after OTP verification

### movies
- Models: Movie, Genre, Person, CastMembership, CrewMembership
- Search, detail, trending, top-rated, person details
- TMDB sync in service layer
- 30-day stale-check using last_synced
- recommendations + legacy similar_movies compatibility

### lists
- User-owned custom lists
- Through model ListEntry (movie, order, added_at)
- Add movie to list + reorder list
- Permission: owner write, others read public lists

### logs
- Log watched movie with rating/review/date
- Liked and Watchlist tables with unique(user, movie)
- Toggle endpoint for liked/watchlist

### stats
- Aggregated user stats from logs
- Overview, YoY comparison, top genres/actors/directors, decades, languages, rating distribution

## 4. Must-Know Django/DRF Concepts Used

- Custom AUTH_USER_MODEL
- ModelSerializer + Serializer
- SerializerMethodField for computed response data
- APIView for custom logic
- Generic views for CRUD speed
- Object-level permission class (IsOwnerOrReadOnly)
- Many-to-many through tables for rich relationships
- ORM aggregate/annotate for analytics
- Service layer pattern in movies/services.py

## 5. Data Relationship Memory Hook

- User -> Logs, Lists, Liked, Watchlist, OTP
- Movie <-> Genre (M2M)
- Movie <-> Person through CastMembership
- Movie <-> Person through CrewMembership
- List <-> Movie through ListEntry

## 6. Important Endpoint Groups

- /api/auth/
- /api/movies/
- /api/lists/
- /api/logs/
- /api/stats/
- /api/schema/, /api/docs/, /api/redoc/

## 7. Typical Request Flow (Short)

Auth flow:
- register/login request -> OTP email -> verify OTP -> JWT response

Movie detail flow:
- request by tmdb_id -> cache freshness check -> TMDB fetch if stale -> DB sync -> serialized response

Log flow:
- submit tmdb_id + metadata -> resolve/fetch movie -> create log -> optional liked/watchlist updates

## 8. Production Risks to Remember

- Reset endpoint is destructive
- CORS open to all origins (dev-safe, prod-risk)
- Test files are placeholders (low coverage)
- External API failure handling can be improved
- SQLite is okay for local dev, not ideal for production concurrency

## 9. Best “Next Improvements” in Order

1. Add tests for auth, movie sync, logs, lists, stats
2. Lock down reset endpoint to admin only
3. Restrict CORS origins in production
4. Add robust TMDB error handling and fallback responses
5. Add env validation for required secrets/settings

## 10. Fast Oral Explanation (30 seconds)

"I built a Django REST backend with five modular apps: users, movies, lists, logs, and stats. Users authenticate via OTP and receive JWT tokens. Movie data is integrated from TMDB through a dedicated service layer with caching and sync rules. Users can build lists, log watched movies, and manage liked/watchlist states. A stats endpoint computes analytics from logs using ORM aggregation. The architecture emphasizes modular apps, serializers, permissions, and through-model relationships."
