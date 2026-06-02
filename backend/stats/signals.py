from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import threading
from logs.models import Log
from stats.services import calculate_user_stats

def trigger_stats_recalculation(user_id, year=None):
    # Recalculate All-Time
    calculate_user_stats(user_id, year=None)
    # Recalculate Specific Year if provided
    if year:
        calculate_user_stats(user_id, year=year)

@receiver(post_save, sender=Log)
@receiver(post_delete, sender=Log)
def on_log_changed(sender, instance, **kwargs):
    # Determine the year of the log
    year = None
    if instance.logged_at:
        year = instance.logged_at.year
        
    # Start background thread to recalculate
    threading.Thread(
        target=trigger_stats_recalculation, 
        args=(instance.user.id, year)
    ).start()
