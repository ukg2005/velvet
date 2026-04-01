from django.contrib import admin
from .models import Log, Watchlist, Liked

admin.site.register(Log)
admin.site.register(Watchlist)
admin.site.register(Liked)
