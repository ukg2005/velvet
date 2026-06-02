from django.db import models


class Genre(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Person(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=50)
    known_for_department = models.CharField(max_length=100, blank=True)
    profile_path = models.CharField(max_length=200, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    place_of_birth = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True)
    last_synced = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return self.name

class Movie(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    title = models.CharField(max_length=200)
    original_title = models.CharField(max_length=200, blank=True)
    runtime = models.IntegerField(null=True, blank=True)
    poster_path = models.CharField(max_length=200)
    backdrop_path = models.CharField(max_length=200)
    overview = models.TextField(blank=True)
    tagline = models.CharField(max_length=200, blank=True)
    release_date = models.DateField(null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    original_language = models.CharField(max_length=100, blank=True)
    vote_count = models.IntegerField(default=0)
    genres = models.ManyToManyField(
        Genre,
        blank=True
    )
    cast = models.ManyToManyField(
        Person,
        through='CastMembership',
        related_name='movies_as_cast',
        blank=True
    )
    crew = models.ManyToManyField(
        Person,
        through='CrewMembership',
        related_name='movies_as_crew',
        blank=True
    )
    is_fully_synced = models.BooleanField(default=False)
    last_synced = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return self.title

class CastMembership(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    character = models.CharField(max_length=200, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

class CrewMembership(models.Model):
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    job = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['department']