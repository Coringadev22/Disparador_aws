"""
Celery Beat scheduled tasks
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_scheduled_campaigns_task():
    """
    Check for campaigns that need to be sent (runs every minute)
    """
    from apps.campaigns.models import ScheduledCampaign, Campaign
    from tasks.email_tasks import send_campaign_task

    now = timezone.now()

    # Get scheduled campaigns that should be sent now
    scheduled_campaigns = ScheduledCampaign.objects.filter(
        campaign__status='scheduled',
        scheduled_at__lte=now
    ).select_related('campaign')

    sent_count = 0

    for schedule in scheduled_campaigns:
        campaign = schedule.campaign

        try:
            # Update campaign status to sending
            campaign.status = 'sending'
            campaign.started_at = now
            campaign.save()

            # Queue campaign for sending
            send_campaign_task.delay(campaign.id)

            sent_count += 1
            logger.info(f"Started scheduled campaign: {campaign.name}")

            # If not recurring, we can delete the schedule
            if not schedule.is_recurring:
                schedule.delete()

        except Exception as e:
            logger.error(f"Error starting scheduled campaign {campaign.id}: {str(e)}")
            campaign.status = 'failed'
            campaign.save()

    if sent_count > 0:
        logger.info(f"Started {sent_count} scheduled campaigns")

    return f"Processed {sent_count} scheduled campaigns"


@shared_task
def cleanup_old_logs_task():
    """
    Clean up old email logs and events (runs daily)
    Keep logs for 90 days
    """
    from apps.analytics.models import EmailLog, EmailEvent

    cutoff_date = timezone.now() - timedelta(days=90)

    # Delete old events first (foreign key constraint)
    deleted_events = EmailEvent.objects.filter(created_at__lt=cutoff_date).delete()

    # Delete old email logs
    deleted_logs = EmailLog.objects.filter(created_at__lt=cutoff_date).delete()

    logger.info(f"Cleanup: Deleted {deleted_events[0]} events and {deleted_logs[0]} email logs")

    return f"Deleted {deleted_events[0]} events and {deleted_logs[0]} logs"


@shared_task
def sync_suppression_list_task():
    """
    Sync suppression list with SES (runs every 6 hours)
    Ensures our local suppression list matches SES
    """
    from apps.contacts.models import Contact
    from apps.core.services.ses_service import SESService

    # This is a placeholder - AWS SES doesn't have a direct API to get suppression list
    # In production, you would implement this based on your SES setup
    # For now, we'll just log that this task ran

    logger.info("Suppression list sync task executed")

    # You could implement logic here to:
    # 1. Get suppression list from SES (if using SES v2 API)
    # 2. Update local contacts accordingly
    # 3. Add local suppressed contacts to SES suppression list

    suppressed_count = Contact.objects.filter(is_suppressed=True).count()

    logger.info(f"Current suppressed contacts: {suppressed_count}")

    return f"Sync completed - {suppressed_count} suppressed contacts"


@shared_task
def daily_metrics_summary_task():
    """
    Generate daily metrics summary (optional - runs daily)
    This could be used to send reports, update dashboards, etc.
    """
    from apps.campaigns.models import Campaign
    from apps.analytics.models import EmailLog
    from datetime import date

    today = date.today()
    today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
    today_end = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))

    # Get today's stats
    campaigns_started = Campaign.objects.filter(
        started_at__gte=today_start,
        started_at__lte=today_end
    ).count()

    emails_sent = EmailLog.objects.filter(
        sent_at__gte=today_start,
        sent_at__lte=today_end
    ).count()

    emails_delivered = EmailLog.objects.filter(
        status='delivered',
        delivered_at__gte=today_start,
        delivered_at__lte=today_end
    ).count()

    emails_bounced = EmailLog.objects.filter(
        status='bounced',
        created_at__gte=today_start,
        created_at__lte=today_end
    ).count()

    summary = {
        'date': today.isoformat(),
        'campaigns_started': campaigns_started,
        'emails_sent': emails_sent,
        'emails_delivered': emails_delivered,
        'emails_bounced': emails_bounced,
        'delivery_rate': (emails_delivered / emails_sent * 100) if emails_sent > 0 else 0
    }

    logger.info(f"Daily summary: {summary}")

    # Here you could:
    # - Send email report to admin
    # - Store in a DailyMetrics model
    # - Send to external analytics service

    return summary
