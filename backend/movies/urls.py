
from django.urls import path
from . import views

urlpatterns = [
    path('search/', views.SearchView.as_view(), name='search_movies'),
    path('movie/<int:tmdb_id>/', views.MovieDetailView.as_view(), name='movie_details'),
    path('person/<int:tmdb_id>/', views.PersonDetailView.as_view(), name='person_details'),
    path('top_rated/', views.TopRatedView.as_view(), name='top_rated'),
    path('trending/', views.TrendingView.as_view(), name='trending'),
]