# Velvet

Velvet is a full-stack movie tracking application featuring a modern Next.js frontend and a robust Django REST Framework backend. It allows users to manage movie data, log films, track watchlists, and view statistics.

## Directory Structure

```
velvet/
├── backend/              # Django REST Framework backend
│   ├── movies/           # Main Django app for movie logic
│   ├── velvet/           # Django project settings
│   ├── manage.py         # Django CLI
│   └── requirements.txt  # Python dependencies
└── frontend/             # Next.js React frontend
    ├── app/              # Next.js App Router pages
    ├── components/       # Reusable React components
    ├── lib/              # Utility functions and API services
    └── package.json      # Node.js dependencies
```

## Running the Application

Both the frontend and backend need to be running simultaneously for the application to work.

### 1. Backend (Django)

Open a terminal, navigate to the backend directory, and start the development server:

```bash
cd backend
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`.

### 2. Frontend (Next.js)

Open a second terminal, navigate to the frontend directory, and start the development server:

```bash
cd frontend
npm run dev
```

The frontend application will be available at `http://localhost:3000`.

## Key Features

✅ **TMDB Sync** - Automatic data synchronization with The Movie Database
✅ **Caching** - Smart caching to minimize API calls and ensure snappy UI performance
✅ **Rich Data** - Complete movie information including cast, crew, and genres
✅ **Search** - Full-text search for movies and actors
✅ **Recommendations** - Get similar and recommended movies based on your logs
✅ **Watchlist & Logs** - Track your viewing history and maintain watchlists
✅ **Stats** - Beautiful, dynamic charts illustrating your viewing habits

## Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API endpoint documentation
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Implementation details, models, and services
- [PROJECT_LEARNING_GUIDE.md](PROJECT_LEARNING_GUIDE.md) - Guide for developers learning the codebase
- [PROJECT_REVISION_NOTES.md](PROJECT_REVISION_NOTES.md) - Historical revision notes
