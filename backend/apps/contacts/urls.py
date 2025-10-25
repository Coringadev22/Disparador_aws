from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactListViewSet, ContactViewSet

router = DefaultRouter()
router.register(r'contact-lists', ContactListViewSet, basename='contactlist')
router.register(r'contacts', ContactViewSet, basename='contact')

urlpatterns = [
    path('', include(router.urls)),
]
