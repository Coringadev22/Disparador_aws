from django.contrib import admin
from .models import Campaign, ScheduledCampaign


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'sent_count', 'delivered_count', 'open_rate', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'subject']
    readonly_fields = [
        'sent_count', 'delivered_count', 'bounce_count', 'complaint_count',
        'open_count', 'click_count', 'started_at', 'completed_at',
        'created_at', 'updated_at'
    ]


@admin.register(ScheduledCampaign)
class ScheduledCampaignAdmin(admin.ModelAdmin):
    list_display = ['campaign', 'scheduled_at', 'is_recurring', 'created_at']
    list_filter = ['is_recurring', 'scheduled_at']
    search_fields = ['campaign__name']
    readonly_fields = ['created_at', 'updated_at']
