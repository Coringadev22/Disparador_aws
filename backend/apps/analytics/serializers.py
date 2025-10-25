from rest_framework import serializers
from .models import EmailLog, EmailEvent


class EmailEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailEvent
        fields = [
            'id', 'email_log', 'event_type', 'bounce_type',
            'timestamp', 'metadata', 'created_at'
        ]
        read_only_fields = ['created_at']


class EmailLogSerializer(serializers.ModelSerializer):
    events = EmailEventSerializer(many=True, read_only=True)
    contact_email = serializers.EmailField(source='contact.email', read_only=True)
    campaign_name = serializers.CharField(source='campaign.name', read_only=True)

    class Meta:
        model = EmailLog
        fields = [
            'id', 'campaign', 'campaign_name', 'contact', 'contact_email',
            'message_id', 'subject', 'from_email', 'to_email', 'status',
            'error_message', 'sent_at', 'delivered_at', 'events',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
