"""
URL configuration for email platform project.
"""
from django.contrib import admin
from django.urls import path, include
from apps.core.views.webhooks import ses_webhook

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.campaigns.urls')),
    path('api/', include('apps.emails.urls')),
    path('api/', include('apps.contacts.urls')),
    path('api/', include('apps.analytics.urls')),
    path('api/webhooks/ses/', ses_webhook, name='ses-webhook'),
]
