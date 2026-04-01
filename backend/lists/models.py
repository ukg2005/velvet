from django.db import models
from users.models import User
from movies.models import Movie

class List(models.Model):
    title = models.CharField(max_length=200)
    desc = models.TextField(blank=True)
    is_public = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    movies = models.ManyToManyField(Movie, through='ListEntry', related_name='lists')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.title[:50]} - {self.user.username}'

class ListEntry(models.Model):
    list = models.ForeignKey(List, on_delete=models.CASCADE, related_name='entries')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', '-added_at']
        constraints = [
            models.UniqueConstraint(fields=['list', 'movie'], name='unique_list_movie')
        ]
    
    def __str__(self):
        return f'{self.list.title[:40]} - {self.movie.title[:20]}'