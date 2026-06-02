from django.db import models
from users.models import User

class UserStats(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stats')
    year = models.IntegerField(null=True, blank=True, help_text="Null means All-Time stats")
    
    total_movies = models.IntegerField(default=0)
    total_runtime = models.IntegerField(default=0)
    avg_rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    
    # Stored as JSON to avoid recalculating on read
    top_actors = models.JSONField(default=list)
    top_directors = models.JSONField(default=list)
    top_genres = models.JSONField(default=list)
    decades = models.JSONField(default=dict)
    languages = models.JSONField(default=list)
    rating_distribution = models.JSONField(default=list)
    
    # Metadata
    last_calculated = models.DateTimeField(auto_now=True)
    is_stale = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'year')

    def __str__(self):
        return f"Stats for {self.user.username} - {'All-Time' if not self.year else self.year}"
