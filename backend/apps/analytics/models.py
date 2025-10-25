from django.db import models
from apps.campaigns.models import Campaign
from apps.contacts.models import Contact


class EmailLog(models.Model):
    """Log of individual email sends"""

    STATUS_CHOICES = [
        ('queued', 'Queued'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('bounced', 'Bounced'),
        ('failed', 'Failed'),
        ('complained', 'Complained'),
    ]

    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='email_logs'
    )
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='email_logs'
    )
    message_id = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="SES message ID"
    )
    subject = models.CharField(max_length=500)
    from_email = models.EmailField()
    to_email = models.EmailField(db_index=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='queued',
        db_index=True
    )
    error_message = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'email_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['message_id']),
            models.Index(fields=['status']),
            models.Index(fields=['to_email']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"Email to {self.to_email} - {self.status}"


class EmailEvent(models.Model):
    """Events from SES (bounces, opens, clicks, etc.)"""

    EVENT_TYPE_CHOICES = [
        ('send', 'Send'),
        ('delivery', 'Delivery'),
        ('bounce', 'Bounce'),
        ('complaint', 'Complaint'),
        ('open', 'Open'),
        ('click', 'Click'),
        ('reject', 'Reject'),
    ]

    BOUNCE_TYPE_CHOICES = [
        ('hard', 'Hard Bounce'),
        ('soft', 'Soft Bounce'),
    ]

    email_log = models.ForeignKey(
        EmailLog,
        on_delete=models.CASCADE,
        related_name='events'
    )
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        db_index=True
    )
    bounce_type = models.CharField(
        max_length=10,
        choices=BOUNCE_TYPE_CHOICES,
        blank=True,
        null=True
    )
    timestamp = models.DateTimeField(db_index=True)
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional data from SES"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'email_events'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.event_type} - {self.email_log.to_email}"
