from django.db import models
from apps.emails.models import EmailTemplate
from apps.contacts.models import ContactList


class Campaign(models.Model):
    """Email campaign"""

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('sending', 'Sending'),
        ('sent', 'Sent'),
        ('paused', 'Paused'),
        ('failed', 'Failed'),
    ]

    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=500)
    from_email = models.EmailField()
    from_name = models.CharField(max_length=100)
    template = models.ForeignKey(
        EmailTemplate,
        on_delete=models.PROTECT,
        related_name='campaigns'
    )
    contact_list = models.ForeignKey(
        ContactList,
        on_delete=models.PROTECT,
        related_name='campaigns'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True
    )
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # Metrics
    total_recipients = models.IntegerField(default=0)
    sent_count = models.IntegerField(default=0)
    delivered_count = models.IntegerField(default=0)
    bounce_count = models.IntegerField(default=0)
    complaint_count = models.IntegerField(default=0)
    open_count = models.IntegerField(default=0)
    click_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'campaigns'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.name

    @property
    def delivery_rate(self):
        if self.sent_count == 0:
            return 0
        return (self.delivered_count / self.sent_count) * 100

    @property
    def open_rate(self):
        if self.delivered_count == 0:
            return 0
        return (self.open_count / self.delivered_count) * 100

    @property
    def click_rate(self):
        if self.delivered_count == 0:
            return 0
        return (self.click_count / self.delivered_count) * 100

    @property
    def bounce_rate(self):
        if self.sent_count == 0:
            return 0
        return (self.bounce_count / self.sent_count) * 100


class ScheduledCampaign(models.Model):
    """Scheduled campaign settings"""

    campaign = models.OneToOneField(
        Campaign,
        on_delete=models.CASCADE,
        related_name='schedule'
    )
    scheduled_at = models.DateTimeField()
    timezone = models.CharField(max_length=50, default='UTC')
    is_recurring = models.BooleanField(default=False)
    recurrence_rule = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="RRULE format for recurring campaigns"
    )
    celery_task_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'scheduled_campaigns'
        ordering = ['scheduled_at']

    def __str__(self):
        return f"Schedule for {self.campaign.name}"
