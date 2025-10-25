from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Campaign, ScheduledCampaign
from .serializers import (
    CampaignSerializer, ScheduledCampaignSerializer,
    CampaignScheduleSerializer
)


class CampaignViewSet(viewsets.ModelViewSet):
    """ViewSet for Campaign"""

    queryset = Campaign.objects.select_related('template', 'contact_list').all()
    serializer_class = CampaignSerializer

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Send campaign immediately"""
        campaign = self.get_object()

        if campaign.status not in ['draft', 'paused']:
            return Response(
                {'error': 'Campaign can only be sent from draft or paused status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                campaign.status = 'sending'
                campaign.started_at = timezone.now()
                campaign.total_recipients = campaign.contact_list.total_contacts
                campaign.save()

            # Trigger Celery task
            from tasks.email_tasks import send_campaign_task
            send_campaign_task.delay(campaign.id)

            return Response({
                'message': 'Campaign queued for sending',
                'campaign_id': campaign.id,
                'total_recipients': campaign.total_recipients
            })

        except Exception as e:
            campaign.status = 'failed'
            campaign.save()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def schedule(self, request, pk=None):
        """Schedule campaign for later"""
        campaign = self.get_object()
        serializer = CampaignScheduleSerializer(data=request.data)

        if serializer.is_valid():
            if campaign.status != 'draft':
                return Response(
                    {'error': 'Only draft campaigns can be scheduled'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            scheduled_at = serializer.validated_data['scheduled_at']

            if scheduled_at <= timezone.now():
                return Response(
                    {'error': 'Scheduled time must be in the future'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                with transaction.atomic():
                    # Create or update schedule
                    schedule, created = ScheduledCampaign.objects.update_or_create(
                        campaign=campaign,
                        defaults={
                            'scheduled_at': scheduled_at,
                            'timezone': serializer.validated_data['timezone'],
                            'is_recurring': serializer.validated_data.get('is_recurring', False),
                            'recurrence_rule': serializer.validated_data.get('recurrence_rule', ''),
                        }
                    )

                    campaign.status = 'scheduled'
                    campaign.scheduled_at = scheduled_at
                    campaign.total_recipients = campaign.contact_list.total_contacts
                    campaign.save()

                return Response({
                    'message': 'Campaign scheduled successfully',
                    'campaign_id': campaign.id,
                    'scheduled_at': scheduled_at
                })

            except Exception as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause ongoing campaign"""
        campaign = self.get_object()

        if campaign.status != 'sending':
            return Response(
                {'error': 'Only sending campaigns can be paused'},
                status=status.HTTP_400_BAD_REQUEST
            )

        campaign.status = 'paused'
        campaign.save()

        return Response({
            'message': 'Campaign paused',
            'campaign_id': campaign.id
        })

    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """Get campaign metrics"""
        campaign = self.get_object()

        return Response({
            'campaign_id': campaign.id,
            'name': campaign.name,
            'status': campaign.status,
            'total_recipients': campaign.total_recipients,
            'sent_count': campaign.sent_count,
            'delivered_count': campaign.delivered_count,
            'bounce_count': campaign.bounce_count,
            'complaint_count': campaign.complaint_count,
            'open_count': campaign.open_count,
            'click_count': campaign.click_count,
            'delivery_rate': campaign.delivery_rate,
            'open_rate': campaign.open_rate,
            'click_rate': campaign.click_rate,
            'bounce_rate': campaign.bounce_rate,
            'started_at': campaign.started_at,
            'completed_at': campaign.completed_at,
        })


class ScheduledCampaignViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for ScheduledCampaign (read-only)"""

    queryset = ScheduledCampaign.objects.select_related('campaign').all()
    serializer_class = ScheduledCampaignSerializer
