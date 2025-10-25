"""
Webhook handlers for SES SNS notifications
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
import json
import logging
from django.utils import timezone

logger = logging.getLogger(__name__)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def ses_webhook(request):
    """
    Handle SES SNS notifications for bounces, complaints, deliveries, etc.
    """

    try:
        # Parse SNS message
        if request.content_type == 'text/plain':
            data = json.loads(request.body.decode('utf-8'))
        else:
            data = request.data

        # Handle SNS subscription confirmation
        if data.get('Type') == 'SubscriptionConfirmation':
            logger.info(f"SNS Subscription confirmation received: {data.get('SubscribeURL')}")
            # In production, you should verify and confirm the subscription
            # For now, just log it
            return Response({'message': 'Subscription confirmation received'})

        # Handle SNS notification
        if data.get('Type') == 'Notification':
            message = json.loads(data.get('Message', '{}'))
            notification_type = message.get('notificationType')

            logger.info(f"Received SES notification: {notification_type}")

            # Queue the processing task
            from tasks.email_tasks import process_ses_notification_task
            process_ses_notification_task.delay(message)

            return Response({'message': 'Notification queued for processing'})

        return Response({'message': 'Unknown message type'}, status=status.HTTP_400_BAD_REQUEST)

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return Response({'error': 'Invalid JSON'}, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Error processing SNS notification: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def process_ses_notification(notification_data):
    """
    Process SES notification (called from Celery task)

    Args:
        notification_data: Notification data from SNS
    """
    from apps.analytics.models import EmailLog, EmailEvent
    from apps.contacts.models import Contact
    from apps.campaigns.models import Campaign

    notification_type = notification_data.get('notificationType')

    if notification_type == 'Bounce':
        _process_bounce(notification_data)
    elif notification_type == 'Complaint':
        _process_complaint(notification_data)
    elif notification_type == 'Delivery':
        _process_delivery(notification_data)
    elif notification_type == 'Send':
        _process_send(notification_data)
    elif notification_type == 'Reject':
        _process_reject(notification_data)
    elif notification_type == 'Open':
        _process_open(notification_data)
    elif notification_type == 'Click':
        _process_click(notification_data)
    else:
        logger.warning(f"Unknown notification type: {notification_type}")


def _process_bounce(data):
    """Process bounce notification"""
    from apps.analytics.models import EmailLog, EmailEvent
    from apps.contacts.models import Contact

    bounce = data.get('bounce', {})
    mail = data.get('mail', {})
    message_id = mail.get('messageId')

    try:
        email_log = EmailLog.objects.get(message_id=message_id)
        email_log.status = 'bounced'
        email_log.save()

        # Create event
        bounce_type = bounce.get('bounceType', '').lower()
        EmailEvent.objects.create(
            email_log=email_log,
            event_type='bounce',
            bounce_type='hard' if bounce_type == 'permanent' else 'soft',
            timestamp=timezone.now(),
            metadata=data
        )

        # Update campaign metrics
        if email_log.campaign:
            campaign = email_log.campaign
            campaign.bounce_count += 1
            campaign.save()

        # Suppress contact if hard bounce
        if bounce_type == 'permanent':
            contact = email_log.contact
            contact.is_suppressed = True
            contact.suppression_reason = 'hard_bounce'
            contact.save()
            logger.info(f"Contact {contact.email} suppressed due to hard bounce")

        logger.info(f"Processed bounce for message {message_id}")

    except EmailLog.DoesNotExist:
        logger.error(f"EmailLog not found for message_id: {message_id}")


def _process_complaint(data):
    """Process complaint notification"""
    from apps.analytics.models import EmailLog, EmailEvent
    from apps.contacts.models import Contact

    mail = data.get('mail', {})
    message_id = mail.get('messageId')

    try:
        email_log = EmailLog.objects.get(message_id=message_id)
        email_log.status = 'complained'
        email_log.save()

        # Create event
        EmailEvent.objects.create(
            email_log=email_log,
            event_type='complaint',
            timestamp=timezone.now(),
            metadata=data
        )

        # Update campaign metrics
        if email_log.campaign:
            campaign = email_log.campaign
            campaign.complaint_count += 1
            campaign.save()

        # Suppress contact
        contact = email_log.contact
        contact.is_suppressed = True
        contact.suppression_reason = 'complaint'
        contact.save()

        logger.info(f"Contact {contact.email} suppressed due to complaint")
        logger.info(f"Processed complaint for message {message_id}")

    except EmailLog.DoesNotExist:
        logger.error(f"EmailLog not found for message_id: {message_id}")


def _process_delivery(data):
    """Process delivery notification"""
    from apps.analytics.models import EmailLog, EmailEvent

    mail = data.get('mail', {})
    message_id = mail.get('messageId')

    try:
        email_log = EmailLog.objects.get(message_id=message_id)
        email_log.status = 'delivered'
        email_log.delivered_at = timezone.now()
        email_log.save()

        # Create event
        EmailEvent.objects.create(
            email_log=email_log,
            event_type='delivery',
            timestamp=timezone.now(),
            metadata=data
        )

        # Update campaign metrics
        if email_log.campaign:
            campaign = email_log.campaign
            campaign.delivered_count += 1
            campaign.save()

        logger.info(f"Processed delivery for message {message_id}")

    except EmailLog.DoesNotExist:
        logger.error(f"EmailLog not found for message_id: {message_id}")


def _process_send(data):
    """Process send notification"""
    from apps.analytics.models import EmailLog, EmailEvent

    mail = data.get('mail', {})
    message_id = mail.get('messageId')

    try:
        email_log = EmailLog.objects.get(message_id=message_id)

        # Create event
        EmailEvent.objects.create(
            email_log=email_log,
            event_type='send',
            timestamp=timezone.now(),
            metadata=data
        )

        logger.info(f"Processed send for message {message_id}")

    except EmailLog.DoesNotExist:
        logger.error(f"EmailLog not found for message_id: {message_id}")


def _process_reject(data):
    """Process reject notification"""
    from apps.analytics.models import EmailLog, EmailEvent

    mail = data.get('mail', {})
    message_id = mail.get('messageId')

    try:
        email_log = EmailLog.objects.get(message_id=message_id)
        email_log.status = 'failed'
        email_log.error_message = 'Rejected by SES'
        email_log.save()

        # Create event
        EmailEvent.objects.create(
            email_log=email_log,
            event_type='reject',
            timestamp=timezone.now(),
            metadata=data
        )

        logger.info(f"Processed reject for message {message_id}")

    except EmailLog.DoesNotExist:
        logger.error(f"EmailLog not found for message_id: {message_id}")


def _process_open(data):
    """Process open notification"""
    from apps.analytics.models import EmailLog, EmailEvent

    mail = data.get('mail', {})
    message_id = mail.get('messageId')

    try:
        email_log = EmailLog.objects.get(message_id=message_id)

        # Create event
        EmailEvent.objects.create(
            email_log=email_log,
            event_type='open',
            timestamp=timezone.now(),
            metadata=data
        )

        # Update campaign metrics
        if email_log.campaign:
            campaign = email_log.campaign
            campaign.open_count += 1
            campaign.save()

        logger.info(f"Processed open for message {message_id}")

    except EmailLog.DoesNotExist:
        logger.error(f"EmailLog not found for message_id: {message_id}")


def _process_click(data):
    """Process click notification"""
    from apps.analytics.models import EmailLog, EmailEvent

    mail = data.get('mail', {})
    message_id = mail.get('messageId')

    try:
        email_log = EmailLog.objects.get(message_id=message_id)

        # Create event
        EmailEvent.objects.create(
            email_log=email_log,
            event_type='click',
            timestamp=timezone.now(),
            metadata=data
        )

        # Update campaign metrics
        if email_log.campaign:
            campaign = email_log.campaign
            campaign.click_count += 1
            campaign.save()

        logger.info(f"Processed click for message {message_id}")

    except EmailLog.DoesNotExist:
        logger.error(f"EmailLog not found for message_id: {message_id}")
