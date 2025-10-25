from django.contrib import admin
from .models import EmailLog, EmailEvent


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['to_email', 'subject', 'status', 'campaign', 'sent_at', 'created_at']
    list_filter = ['status', 'created_at', 'sent_at']
    search_fields = ['to_email', 'subject', 'message_id']
    readonly_fields = ['message_id', 'sent_at', 'delivered_at', 'created_at', 'updated_at']


@admin.register(EmailEvent)
class EmailEventAdmin(admin.ModelAdmin):
    list_display = ['email_log', 'event_type', 'bounce_type', 'timestamp', 'created_at']
    list_filter = ['event_type', 'bounce_type', 'timestamp']
    search_fields = ['email_log__to_email', 'email_log__message_id']
    readonly_fields = ['created_at']
