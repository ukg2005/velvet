from django.contrib import admin
from .models import Person, Movie, CastMembership, CrewMembership, Genre


admin.site.register(Person)
admin.site.register(Movie)
admin.site.register(CastMembership)
admin.site.register(CrewMembership)
admin.site.register(Genre)
