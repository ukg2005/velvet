from django.urls import path
from . import views

urlpatterns = [
    path('', views.LogCreateView.as_view(), name='log'),
    path('<int:pk>/', views.LogUpdateView.as_view(), name='log_update'),
    path('liked/', views.LikedListView.as_view(), name='liked'),
    path('watchlist/', views.WatchlistView.as_view(), name='watchlist'),
    path('<int:pk>/toggle/', views.ToggleView.as_view(), name='toggle'),
]
