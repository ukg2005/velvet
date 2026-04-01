from django.db import models
from movies.models import Movie
from users.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    logged_at = models.DateField(blank=True)
    rating = models.DecimalField(
        blank=True, decimal_places=1, max_digits=2, null=True,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    review = models.TextField(blank=True)

    def __str__(self):
        return f'{self.user.username} logged {self.movie.title}'

class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'movie'], name='unique_watchlist_entry')
        ]

    def __str__(self):
        return f'{self.user.username} watchlisted {self.movie.title}'
    
class Liked(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'movie'], name='unique_liked_entry')
        ]

    def __str__(self):
        return f'{self.user.username} likes {self.movie.title}'