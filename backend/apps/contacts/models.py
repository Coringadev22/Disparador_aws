from django.db import models


class ContactList(models.Model):
    """Contact list for organizing contacts"""

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    total_contacts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contact_lists'
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Contact(models.Model):
    """Individual contact"""

    email = models.EmailField(unique=True, db_index=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    custom_fields = models.JSONField(default=dict, blank=True)
    lists = models.ManyToManyField(ContactList, related_name='contacts', blank=True)
    is_subscribed = models.BooleanField(default=True)
    is_suppressed = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Suppressed due to bounces or complaints"
    )
    suppression_reason = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contacts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_subscribed']),
            models.Index(fields=['is_suppressed']),
        ]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()
