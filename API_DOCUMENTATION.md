# API Documentation

## Authentication & Users (`/api/auth/`)

| Endpoint | Method | Auth Required | Description | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/auth/register/` | **POST** | No | Registers a new user. | `email`, `username`, `password` | `201 Created` - Details about OTP being sent. |
| `/api/auth/verify-email/` | **POST** | No | Verifies email via OTP to activate account. | `email`, `otp` | `200 OK` - Returns access & refresh tokens, and user data. |
| `/api/auth/login/` | **POST** | No | Initiates login and sends OTP to email. | `email`, `password` | `200 OK` - Details about OTP being sent. |
| `/api/auth/login/verify/` | **POST** | No | Verifies login OTP. | `email`, `otp` | `200 OK` - Returns access & refresh tokens, and user data. `400` if unverified. |
| `/api/auth/logout/` | **POST** | No | Blacklists the refresh token. (Requires Token) | `refresh` | `200 OK` |
| `/api/auth/token/refresh/` | **POST** | No | Obtains a new access token. (Requires Refresh Token) | `refresh` | `200 OK` - Returns new access token. |
| `/api/auth/me/` | **GET** | Yes | Retrieves authenticated user profile. | None | `200 OK` - User object. |

---

## Movies (`/api/movies/`)

| Endpoint | Method | Auth Required | Description | Query Parameters | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/movies/search/` | **GET** | No | Search for movies. | `query` (required), `page` (optional), `filters` (optional) | Array of Movie objects. |
| `/api/movies/movie/<tmdb_id>/` | **GET** | No | Returns detailed info about a specific movie. | None | Detailed Movie object with `recommendations` (and legacy `similar_movies`). |
| `/api/movies/person/<tmdb_id>/` | **GET** | No | Returns actor/director info, along with their movie credits. | None | Person details and credits. |
| `/api/movies/top_rated/` | **GET** | No | Fetches top-rated movies. | `page` (optional, default 1) | `{"movies": [...], "total_pages": ...}` |
| `/api/movies/trending/` | **GET** | No | Fetches currently trending movies. | None | Array of Movie objects. |

---

## Lists (`/api/lists/`)

| Endpoint | Method | Auth Required | Description | Request Payload / Params | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/lists/` | **GET** | Yes | Get users' own lists + public lists. | None | Array of Lists (including nested entries). |
| `/api/lists/` | **POST** | Yes | Create a new list. | `name`, `description`, `is_public` | Created List object. |
| `/api/lists/<pk>/` | **GET**, **PUT/PATCH**, **DELETE** | Yes | Retrieve, update, or completely delete a specific list. | Updating requires valid List fields. | `200 OK` or `204 No Content`. Requires list ownership for modifying. |
| `/api/lists/<pk>/add/` | **POST** | Yes | Adds a movie to a list. | `{"list_id": <int>, "tmdb_id": <int>}` | `201 Created` or `200 Warning` if it exists. |
| `/api/lists/<pk>/reorder/`| **POST** | Yes | Reorders items within a list. | Array: `[{"id": <entry_id>, "order": <new_order>}, ...]` | `200 OK` on success. |

---

## Logs (`/api/logs/`)

| Endpoint | Method | Auth Required | Description | Request Payload / Params | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/logs/` | **GET** | Yes | Gets all logged movies for the user. | None | Array of Log objects. |
| `/api/logs/` | **POST** | Yes | Logs a new movie watch. | `tmdb_id`, `rating`, `review`, `liked`, etc. | The created Log object. |
| `/api/logs/<pk>/` | **GET**, **PUT/PATCH**, **DELETE**| Yes | Retrieve, update, or delete a specific movie log entry. | Standard Log fields for mutation | Updated Log object. |
| `/api/logs/liked/` | **GET** | Yes | Returns all movies liked by the user. | None | Array of Movie objects. |
| `/api/logs/watchlist/` | **GET** | Yes | Returns user's watchlist items. | None | Array of Movie objects. |
| `/api/logs/<pk>/toggle/` | **POST**| Yes | Used to rapidly add/remove a movie from Liked or Watchlist sets. | `{"tmdb_id": <int>, "action": "liked" \| "watchlist"}` | `200 OK` `{"success": "Added to/Removed from <action>"}` |

---

## Stats (`/api/stats/`)

| Endpoint | Method | Auth Required | Description | Response Data |
| :--- | :--- | :--- | :--- | :--- |
| `/api/stats/` | **GET** | Yes | Fetches a rich diagnostic of all user stats based on logged instances. | `overview`, `comparison`, `top_genres`, `top_actors`, `top_directors`, `decades`, `languages`, and `rating_distribution`. |

---

## OpenAPI Auto-generated documentation (Swagger/ReDoc)

The project also comes with auto-generated documentation via `drf-spectacular` out of the box.

*   Schema download: `/api/schema/`
*   Swagger documentation UI: `/api/docs/`
*   ReDoc documentation UI: `/api/redoc/`
