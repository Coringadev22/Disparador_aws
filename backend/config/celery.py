"""
Celery configuration for email platform project.
"""
import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('email_platform')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Import tasks to register them
from tasks import (
    check_scheduled_campaigns_task,
    cleanup_old_logs_task,
    sync_suppression_list_task,
)

# Celery Beat Schedule
app.conf.beat_schedule = {
    'check-scheduled-campaigns': {
        'task': 'check_scheduled_campaigns_task',
        'schedule': 60.0,  # Every 1 minute
    },
    'cleanup-old-logs': {
        'task': 'cleanup_old_logs_task',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
    },
    'sync-suppression-list': {
        'task': 'sync_suppression_list_task',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
}

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
