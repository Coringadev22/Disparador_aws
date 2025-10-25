from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import EmailLog, EmailEvent
from .serializers import EmailLogSerializer, EmailEventSerializer
from apps.campaigns.models import Campaign


class EmailLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for EmailLog (read-only)"""

    queryset = EmailLog.objects.select_related('campaign', 'contact').prefetch_related('events').all()
    serializer_class = EmailLogSerializer
    filterset_fields = ['status', 'campaign']
    search_fields = ['to_email', 'subject', 'message_id']


class EmailEventViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for EmailEvent (read-only)"""

    queryset = EmailEvent.objects.select_related('email_log').all()
    serializer_class = EmailEventSerializer
    filterset_fields = ['event_type', 'bounce_type']


@api_view(['GET'])
def dashboard_metrics(request):
    """Get overall dashboard metrics"""

    # Get today's date range
    today = timezone.now().date()
    today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
    today_end = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))

    # Last 7 days
    seven_days_ago = today_start - timedelta(days=7)

    # Today's metrics
    today_sent = EmailLog.objects.filter(
        sent_at__gte=today_start,
        sent_at__lte=today_end
    ).count()

    today_delivered = EmailLog.objects.filter(
        status='delivered',
        delivered_at__gte=today_start,
        delivered_at__lte=today_end
    ).count()

    today_bounced = EmailLog.objects.filter(
        status='bounced',
        created_at__gte=today_start,
        created_at__lte=today_end
    ).count()

    # Overall rates
    total_sent = EmailLog.objects.filter(status__in=['sent', 'delivered']).count()
    total_delivered = EmailLog.objects.filter(status='delivered').count()
    total_opened = EmailEvent.objects.filter(event_type='open').count()

    delivery_rate = (total_delivered / total_sent * 100) if total_sent > 0 else 0
    open_rate = (total_opened / total_delivered * 100) if total_delivered > 0 else 0

    # Last 7 days data for chart
    chart_data = []
    for i in range(7):
        day = today_start - timedelta(days=i)
        day_end = day + timedelta(days=1)

        day_sent = EmailLog.objects.filter(
            sent_at__gte=day,
            sent_at__lt=day_end
        ).count()

        chart_data.append({
            'date': day.strftime('%Y-%m-%d'),
            'sent': day_sent
        })

    chart_data.reverse()

    # Recent campaigns
    recent_campaigns = Campaign.objects.all()[:5]
    recent_campaigns_data = [{
        'id': c.id,
        'name': c.name,
        'status': c.status,
        'sent_count': c.sent_count,
        'delivered_count': c.delivered_count,
        'created_at': c.created_at
    } for c in recent_campaigns]

    # Problems/alerts
    alerts = []

    # Check for high bounce rate
    if total_sent > 100:
        bounce_count = EmailLog.objects.filter(status='bounced').count()
        bounce_rate = (bounce_count / total_sent * 100)
        if bounce_rate > 5:
            alerts.append({
                'type': 'warning',
                'message': f'High bounce rate detected: {bounce_rate:.1f}%'
            })

    return Response({
        'today': {
            'sent': today_sent,
            'delivered': today_delivered,
            'bounced': today_bounced
        },
        'overall': {
            'delivery_rate': round(delivery_rate, 2),
            'open_rate': round(open_rate, 2)
        },
        'chart_data': chart_data,
        'recent_campaigns': recent_campaigns_data,
        'alerts': alerts
    })


@api_view(['GET'])
def campaign_analytics(request, campaign_id):
    """Get detailed analytics for a specific campaign"""

    try:
        campaign = Campaign.objects.get(id=campaign_id)
    except Campaign.DoesNotExist:
        return Response(
            {'error': 'Campaign not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get email logs for this campaign
    logs = EmailLog.objects.filter(campaign=campaign)

    # Status breakdown
    status_breakdown = logs.values('status').annotate(count=Count('id'))

    # Events breakdown
    events = EmailEvent.objects.filter(email_log__campaign=campaign)
    events_breakdown = events.values('event_type').annotate(count=Count('id'))

    # Timeline data (last 24 hours)
    timeline_data = []
    now = timezone.now()

    for i in range(24):
        hour_start = now - timedelta(hours=i+1)
        hour_end = now - timedelta(hours=i)

        hour_sent = logs.filter(
            sent_at__gte=hour_start,
            sent_at__lt=hour_end
        ).count()

        hour_opened = events.filter(
            event_type='open',
            timestamp__gte=hour_start,
            timestamp__lt=hour_end
        ).count()

        timeline_data.append({
            'hour': hour_start.strftime('%H:00'),
            'sent': hour_sent,
            'opened': hour_opened
        })

    timeline_data.reverse()

    return Response({
        'campaign': {
            'id': campaign.id,
            'name': campaign.name,
            'status': campaign.status
        },
        'metrics': {
            'total_recipients': campaign.total_recipients,
            'sent_count': campaign.sent_count,
            'delivered_count': campaign.delivered_count,
            'bounce_count': campaign.bounce_count,
            'open_count': campaign.open_count,
            'click_count': campaign.click_count,
            'delivery_rate': campaign.delivery_rate,
            'open_rate': campaign.open_rate,
            'click_rate': campaign.click_rate
        },
        'status_breakdown': list(status_breakdown),
        'events_breakdown': list(events_breakdown),
        'timeline': timeline_data
    })
