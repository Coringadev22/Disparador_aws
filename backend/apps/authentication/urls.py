from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('refresh/', views.refresh_token, name='refresh'),
    path('user/', views.current_user, name='current_user'),
    path('users/', views.list_users, name='list_users'),
]
