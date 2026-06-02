# Velvet Project Learning Guide

This file is your personal, end-to-end project tracker.

It documents:
- what the project is,
- what you implemented in each app,
- how data flows through the system,
- the Django and DRF concepts you used,
- and what to improve next.

## 1. Project in One Sentence

Velvet is a Django REST API for movie discovery and personal tracking: users authenticate with OTP, browse TMDB-powered movie data, save movies to custom lists, log watched titles, and view aggregate stats.

## 2. Tech Stack and Why It Matters

- Django 6 + Django REST Framework:
  - Backend framework + API tooling
- SimpleJWT:
  - Token-based authentication (access + refresh)
- drf-spectacular:
  - Auto-generated OpenAPI schema and Swagger/ReDoc docs
- requests:
  - Server-side TMDB API integration
- SQLite:
  - Local database for development
- corsheaders:
  - Cross-origin API access for frontend clients

Main configuration files:
- backend/backend/settings.py
- backend/backend/urls.py

## 3. App-by-App Breakdown (What You Built)

### 3.1 users app
Purpose: account creation and OTP-based login flow.

Key files:
- backend/users/models.py
- backend/users/serializers.py
- backend/users/views.py
- backend/users/urls.py
- backend/users/emails.py

What you implemented:
- Custom user model (email as login identity)
- OTP model with 10-minute expiry window
- Register endpoint that creates inactive user + sends OTP
- Verify-email endpoint that activates user + returns JWT tokens
- Login endpoint that sends OTP to existing account
- Login verify endpoint that validates OTP + returns tokens
- Me endpoint for current user profile payload

Core concept you used:
- Custom auth model via AUTH_USER_MODEL
- OTP as second-step verification
- Stateless JWT auth for API clients

### 3.2 movies app
Purpose: movie catalog/search/details sourced from TMDB and cached locally.

Key files:
- backend/movies/models.py
- backend/movies/serializers.py
- backend/movies/services.py
- backend/movies/views.py
- backend/movies/urls.py

What you implemented:
- Movie, Genre, Person models
- CastMembership and CrewMembership through tables
- Search endpoint
- Movie detail endpoint with cast, crew, directors, recommendations
- Person detail endpoint with profile + credits
- Trending and top-rated endpoints
- Reset endpoint to wipe movie-related data
- Service layer for TMDB API calls and sync logic

Core concepts you used:
- Many-to-many with through models for richer relationships
- Service layer pattern (business logic outside views)
- Stale cache check using last_synced + 30-day threshold
- SerializerMethodField for computed URLs and derived values

### 3.3 lists app
Purpose: user-created movie collections.

Key files:
- backend/lists/models.py
- backend/lists/serializers.py
- backend/lists/permissions.py
- backend/lists/views.py
- backend/lists/urls.py

What you implemented:
- List model (title, desc, visibility, owner)
- ListEntry join model with order + added_at
- Create/list endpoint for user lists and public lists
- Detail/update/delete endpoint
- Add-movie endpoint
- Reorder endpoint for list entries
- Owner-only write permissions

Core concepts you used:
- Object-level permissions (owner vs read-only)
- Through table to store per-relation metadata (order)
- Generic class-based DRF views for CRUD speed

### 3.4 logs app
Purpose: watch logging + liked/watchlist behavior.

Key files:
- backend/logs/models.py
- backend/logs/serializers.py
- backend/logs/views.py
- backend/logs/urls.py

What you implemented:
- Log model for watched movie entries (date, rating, review)
- Liked and Watchlist models with unique user-movie constraints
- Log list/create endpoint
- Log retrieve/update/delete endpoint
- Liked and watchlist retrieval endpoints
- Toggle endpoint for liked/watchlist add/remove behavior

Core concepts you used:
- Data integrity with unique constraints
- Write-only serializer fields for command-style payload inputs
- Idempotent-style toggle endpoint behavior

### 3.5 stats app
Purpose: analytics computed from user logs.

Key files:
- backend/stats/views.py
- backend/stats/urls.py

What you implemented:
- Single authenticated stats endpoint returning:
  - overview metrics
  - year-over-year comparison
  - top genres, actors, directors
  - decade distribution
  - language distribution
  - rating distribution

Core concepts you used:
- Aggregation with Count/Sum/Avg/Max/Min
- Grouping and annotation in Django ORM
- Combining DB aggregation with Python-side post-processing (decade buckets)

## 4. Data Model Relationships (Mental Map)

User-related:
- User -> many Log
- User -> many List
- User -> many Liked
- User -> many Watchlist
- User -> one OTP

Movie-related:
- Movie <-> Genre (many-to-many)
- Movie <-> Person via CastMembership (many-to-many through)
- Movie <-> Person via CrewMembership (many-to-many through)
- Movie -> many Log
- Movie -> many ListEntry
- Movie -> many Liked
- Movie -> many Watchlist

Collection-related:
- List belongs to User
- List <-> Movie via ListEntry
- ListEntry stores added_at + order

## 5. API Surface Summary

Root route grouping from backend/backend/urls.py:
- /api/auth/
- /api/movies/
- /api/logs/
- /api/lists/
- /api/stats/
- /api/schema/
- /api/docs/
- /api/redoc/

Detailed API references:
- API_DOCUMENTATION.md
- backend/movies/API.md

## 6. Core Request Lifecycles (Important to Remember)

### 6.1 Register/Login lifecycle
1. Client submits email/username to register or email to login
2. Server validates user state
3. Server generates OTP and sends via email
4. Client submits OTP
5. Server verifies OTP, activates account if needed, returns JWT pair

### 6.2 Movie detail lifecycle
1. Client requests movie by tmdb_id
2. Service checks if local movie record is fresh
3. If stale/missing, fetches from TMDB and syncs DB
4. Serializer returns rich payload with cast/crew and image URLs
5. Recommendations are fetched and included in response context

### 6.3 Log creation lifecycle
1. Client posts tmdb_id and optional rating/review flags
2. Serializer/view resolves or fetches movie via service layer
3. Log entry is created for authenticated user
4. Optional liked/watchlist relations are created

### 6.4 Stats lifecycle
1. Client requests stats
2. Server filters logs by user
3. ORM aggregates metrics and top groups
4. Response combines aggregate blocks into one payload

## 7. Concepts You Practiced (Teaching Notes)

### 7.1 Django app modular architecture
You split domain areas into separate apps (users, movies, lists, logs, stats). This keeps models, views, and routing organized by responsibility.

### 7.2 DRF serializers
Serializers convert model instances to JSON and validate incoming data.

You used:
- ModelSerializer for model-driven fields
- Serializer for custom non-model validation flows (OTP verify)
- write_only fields for command-style inputs
- SerializerMethodField for computed output

### 7.3 APIView vs generic views
- APIView: better for custom logic and multi-step actions
- GenericAPIView descendants: faster for standard CRUD

Your code uses both patterns correctly where they fit.

### 7.4 Through models
A normal many-to-many relation cannot store extra fields directly. Through models solve this by representing the relationship as a first-class table.

Examples:
- CastMembership adds character and order
- CrewMembership adds job and department
- ListEntry adds order and added_at

### 7.5 Authentication vs permissions
- Authentication answers: who are you?
- Permissions answer: are you allowed to do this?

You used JWT for identity and custom permissions for object ownership.

### 7.6 ORM aggregation
You used annotate/aggregate to compute analytics efficiently in SQL rather than loading everything into Python first.

### 7.7 Service layer
You isolated external API logic (TMDB) in backend/movies/services.py.

Benefits:
- cleaner views
- reusable business logic
- easier future testing/mocking

### 7.8 Caching strategy
Movie/person sync uses freshness windows (30 days) to reduce API calls while keeping data reasonably current.

## 8. What You Have Achieved (Portfolio View)

You built a complete backend with:
- custom user auth flow,
- external API integration,
- personal collection and logging features,
- analytics endpoint,
- generated schema/docs,
- modular app architecture.

This is already a solid multi-domain backend project.

## 9. Known Gaps and Risks (Current State)

Based on current code:
- Tests are placeholders in all apps (no real automated coverage yet)
- CORS is open to all origins (fine for dev, risky for prod)
- Reset endpoint is public and destructive
- TMDB error handling is not uniform across all service calls
- Some docs may drift from implementation over time

## 10. Suggested Next Steps (Learning + Project Quality)

1. Add tests first for critical flows:
   - OTP register/login
   - movie detail sync
   - list add/reorder
   - log create/toggle
   - stats output shape
2. Protect destructive endpoints:
   - require admin/staff auth for reset
3. Production hardening:
   - restricted CORS origins
   - env validation for TMDB/email settings
   - structured error handling around external calls
4. Improve observability:
   - request logging and integration error logs

## 11. Quick Revision Checklist

When you revisit this project, confirm:
- auth flow still OTP-driven
- TMDB sync and caching still work
- list/log permissions still enforce ownership
- stats endpoint still returns expected blocks
- docs and code are still in sync

## 12. Key Files Index

Project-level:
- API_DOCUMENTATION.md
- backend/manage.py
- backend/backend/settings.py
- backend/backend/urls.py

Users:
- backend/users/models.py
- backend/users/serializers.py
- backend/users/views.py
- backend/users/urls.py
- backend/users/emails.py

Movies:
- backend/movies/models.py
- backend/movies/serializers.py
- backend/movies/services.py
- backend/movies/views.py
- backend/movies/urls.py
- backend/movies/README.md
- backend/movies/API.md
- backend/movies/IMPLEMENTATION.md

Lists:
- backend/lists/models.py
- backend/lists/serializers.py
- backend/lists/permissions.py
- backend/lists/views.py
- backend/lists/urls.py

Logs:
- backend/logs/models.py
- backend/logs/serializers.py
- backend/logs/views.py
- backend/logs/urls.py

Stats:
- backend/stats/views.py
- backend/stats/urls.py
