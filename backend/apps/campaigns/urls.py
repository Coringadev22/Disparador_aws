from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, ScheduledCampaignViewSet

router = DefaultRouter()
router.register(r'campaigns', CampaignViewSet, basename='campaign')
router.register(r'scheduled-campaigns', ScheduledCampaignViewSet, basename='scheduledcampaign')

urlpatterns = [
    path('', include(router.urls)),
]
