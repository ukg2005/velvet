from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListCreateView.as_view(), name='list'),
    path('<int:pk>/', views.ListDetailView.as_view(), name='list_detail'),
    path('<int:pk>/add/', views.AddMovieToListView.as_view(), name='add_movie_to_list'),
    path('<int:pk>/reorder/', views.ListReorderView.as_view(), name='list_reorder'),
]
