from django.contrib import admin
from .models import ContactList, Contact


@admin.register(ContactList)
class ContactListAdmin(admin.ModelAdmin):
    list_display = ['name', 'total_contacts', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['total_contacts', 'created_at', 'updated_at']


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['email', 'full_name', 'is_subscribed', 'is_suppressed', 'created_at']
    list_filter = ['is_subscribed', 'is_suppressed', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    filter_horizontal = ['lists']
    readonly_fields = ['created_at', 'updated_at']
