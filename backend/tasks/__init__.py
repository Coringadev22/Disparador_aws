"""
Celery tasks package
Import all tasks here to make them discoverable by Celery
"""

# Import all email tasks
from .email_tasks import (
    send_campaign_task,
    send_single_email_task,
    process_ses_notification_task,
    retry_failed_emails_task,
    update_campaign_metrics_task,
)

# Import all scheduled tasks
from .scheduled_tasks import (
    check_scheduled_campaigns_task,
    cleanup_old_logs_task,
    sync_suppression_list_task,
    daily_metrics_summary_task,
)

__all__ = [
    # Email tasks
    'send_campaign_task',
    'send_single_email_task',
    'process_ses_notification_task',
    'retry_failed_emails_task',
    'update_campaign_metrics_task',
    # Scheduled tasks
    'check_scheduled_campaigns_task',
    'cleanup_old_logs_task',
    'sync_suppression_list_task',
    'daily_metrics_summary_task',
]
