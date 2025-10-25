from rest_framework import serializers
from .models import Campaign, ScheduledCampaign
from apps.emails.serializers import EmailTemplateSerializer
from apps.contacts.serializers import ContactListSerializer


class CampaignSerializer(serializers.ModelSerializer):
    template_data = EmailTemplateSerializer(source='template', read_only=True)
    contact_list_data = ContactListSerializer(source='contact_list', read_only=True)
    delivery_rate = serializers.FloatField(read_only=True)
    open_rate = serializers.FloatField(read_only=True)
    click_rate = serializers.FloatField(read_only=True)
    bounce_rate = serializers.FloatField(read_only=True)

    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'subject', 'from_email', 'from_name',
            'template', 'template_data', 'contact_list', 'contact_list_data',
            'status', 'scheduled_at', 'started_at', 'completed_at',
            'total_recipients', 'sent_count', 'delivered_count',
            'bounce_count', 'complaint_count', 'open_count', 'click_count',
            'delivery_rate', 'open_rate', 'click_rate', 'bounce_rate',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'status', 'started_at', 'completed_at', 'total_recipients',
            'sent_count', 'delivered_count', 'bounce_count', 'complaint_count',
            'open_count', 'click_count', 'created_at', 'updated_at'
        ]


class ScheduledCampaignSerializer(serializers.ModelSerializer):
    campaign_data = CampaignSerializer(source='campaign', read_only=True)

    class Meta:
        model = ScheduledCampaign
        fields = [
            'id', 'campaign', 'campaign_data', 'scheduled_at',
            'timezone', 'is_recurring', 'recurrence_rule',
            'celery_task_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['celery_task_id', 'created_at', 'updated_at']


class CampaignScheduleSerializer(serializers.Serializer):
    """Serializer for scheduling a campaign"""
    scheduled_at = serializers.DateTimeField()
    timezone = serializers.CharField(default='UTC')
    is_recurring = serializers.BooleanField(default=False)
    recurrence_rule = serializers.CharField(required=False, allow_blank=True)
