from rest_framework import serializers
from .models import ContactList, Contact


class ContactListSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactList
        fields = ['id', 'name', 'description', 'total_contacts', 'created_at', 'updated_at']
        read_only_fields = ['total_contacts', 'created_at', 'updated_at']


class ContactSerializer(serializers.ModelSerializer):
    lists_data = ContactListSerializer(source='lists', many=True, read_only=True)
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Contact
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'custom_fields', 'lists', 'lists_data', 'is_subscribed',
            'is_suppressed', 'suppression_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class BulkContactUploadSerializer(serializers.Serializer):
    """Serializer for bulk contact upload via CSV"""
    list_id = serializers.IntegerField()
    contacts = serializers.ListField(
        child=serializers.DictField()
    )


class ContactListManageSerializer(serializers.Serializer):
    """Serializer for adding/removing contacts from list"""
    contact_ids = serializers.ListField(
        child=serializers.IntegerField()
    )
