"""
Celery tasks for email sending and processing
"""
from celery import shared_task
from django.utils import timezone
from django.db import transaction
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def send_campaign_task(self, campaign_id):
    """
    Send all emails for a campaign

    Args:
        campaign_id: ID of the campaign to send
    """
    from apps.campaigns.models import Campaign
    from apps.contacts.models import Contact

    try:
        campaign = Campaign.objects.select_related('template', 'contact_list').get(id=campaign_id)

        if campaign.status != 'sending':
            logger.warning(f"Campaign {campaign_id} is not in sending status")
            return

        # Get all subscribed and non-suppressed contacts from the list
        contacts = Contact.objects.filter(
            lists=campaign.contact_list,
            is_subscribed=True,
            is_suppressed=False
        )

        logger.info(f"Sending campaign '{campaign.name}' to {contacts.count()} contacts")

        # Queue individual email tasks
        for contact in contacts:
            send_single_email_task.delay(campaign.id, contact.id)

        return f"Campaign {campaign_id} emails queued successfully"

    except Campaign.DoesNotExist:
        logger.error(f"Campaign {campaign_id} not found")
        raise

    except Exception as e:
        logger.error(f"Error sending campaign {campaign_id}: {str(e)}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def send_single_email_task(self, campaign_id, contact_id):
    """
    Send a single email

    Args:
        campaign_id: ID of the campaign
        contact_id: ID of the contact
    """
    from apps.campaigns.models import Campaign
    from apps.contacts.models import Contact
    from apps.analytics.models import EmailLog
    from apps.core.services.ses_service import SESService

    try:
        campaign = Campaign.objects.select_related('template').get(id=campaign_id)
        contact = Contact.objects.get(id=contact_id)

        # Check if contact is still valid
        if not contact.is_subscribed or contact.is_suppressed:
            logger.info(f"Skipping contact {contact.email} - unsubscribed or suppressed")
            return

        # Prepare template data
        template_data = {
            'name': contact.full_name or contact.first_name,
            'email': contact.email,
            'first_name': contact.first_name,
            'last_name': contact.last_name,
        }
        # Add custom fields
        template_data.update(contact.custom_fields)

        # Render template
        ses = SESService()
        html_content = ses.render_template(campaign.template.html_content, template_data)
        plain_text = ses.render_template(campaign.template.plain_text_content, template_data)
        subject = ses.render_template(campaign.subject, template_data)

        # Create email log
        email_log = EmailLog.objects.create(
            campaign=campaign,
            contact=contact,
            message_id='',  # Will be updated after sending
            subject=subject,
            from_email=campaign.from_email,
            to_email=contact.email,
            status='sending'
        )

        # Send email via SES
        result = ses.send_email(
            to_email=contact.email,
            from_email=campaign.from_email,
            from_name=campaign.from_name,
            subject=subject,
            html_content=html_content,
            plain_text_content=plain_text
        )

        # Update email log based on result
        if result['success']:
            email_log.message_id = result['message_id']
            email_log.status = 'sent'
            email_log.sent_at = timezone.now()
            email_log.save()

            # Update campaign sent count
            with transaction.atomic():
                campaign.sent_count += 1
                campaign.save()

            logger.info(f"Email sent to {contact.email} for campaign {campaign.name}")

        else:
            email_log.status = 'failed'
            email_log.error_message = result['error']
            email_log.save()

            logger.error(f"Failed to send email to {contact.email}: {result['error']}")

        # Check if campaign is complete
        update_campaign_metrics_task.delay(campaign_id)

        return f"Email to {contact.email} processed"

    except Campaign.DoesNotExist:
        logger.error(f"Campaign {campaign_id} not found")
        raise

    except Contact.DoesNotExist:
        logger.error(f"Contact {contact_id} not found")
        raise

    except Exception as e:
        logger.error(f"Error sending email to contact {contact_id}: {str(e)}")
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=2 ** self.request.retries)


@shared_task
def process_ses_notification_task(notification_data):
    """
    Process SES notification from SNS webhook

    Args:
        notification_data: Notification data from SNS
    """
    from apps.core.views.webhooks import process_ses_notification

    try:
        process_ses_notification(notification_data)
        logger.info("SES notification processed successfully")
    except Exception as e:
        logger.error(f"Error processing SES notification: {str(e)}")
        raise


@shared_task
def retry_failed_emails_task():
    """
    Retry failed emails (max 3 attempts)
    """
    from apps.analytics.models import EmailLog
    from datetime import timedelta

    # Get failed emails from last 24 hours that have been retried < 3 times
    cutoff_time = timezone.now() - timedelta(hours=24)

    failed_logs = EmailLog.objects.filter(
        status='failed',
        created_at__gte=cutoff_time
    ).select_related('campaign', 'contact')

    retry_count = 0

    for email_log in failed_logs:
        # Check how many times this email has been attempted
        attempt_count = EmailLog.objects.filter(
            campaign=email_log.campaign,
            contact=email_log.contact
        ).count()

        if attempt_count < 3:
            # Retry sending
            send_single_email_task.delay(email_log.campaign.id, email_log.contact.id)
            retry_count += 1

    logger.info(f"Queued {retry_count} failed emails for retry")
    return f"Queued {retry_count} emails for retry"


@shared_task
def update_campaign_metrics_task(campaign_id):
    """
    Update campaign metrics and check if complete

    Args:
        campaign_id: ID of the campaign
    """
    from apps.campaigns.models import Campaign
    from apps.analytics.models import EmailLog

    try:
        campaign = Campaign.objects.get(id=campaign_id)

        if campaign.status != 'sending':
            return

        # Check if all emails have been processed
        total_logs = EmailLog.objects.filter(campaign=campaign).count()

        if total_logs >= campaign.total_recipients:
            # Mark campaign as complete
            campaign.status = 'sent'
            campaign.completed_at = timezone.now()
            campaign.save()

            logger.info(f"Campaign {campaign.name} completed")

    except Campaign.DoesNotExist:
        logger.error(f"Campaign {campaign_id} not found")
