from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmailLogViewSet, EmailEventViewSet, dashboard_metrics, campaign_analytics

router = DefaultRouter()
router.register(r'email-logs', EmailLogViewSet, basename='emaillog')
router.register(r'email-events', EmailEventViewSet, basename='emailevent')

urlpatterns = [
    path('', include(router.urls)),
    path('analytics/dashboard/', dashboard_metrics, name='dashboard-metrics'),
    path('analytics/campaign/<int:campaign_id>/', campaign_analytics, name='campaign-analytics'),
]
