from rest_framework import serializers
from .models import EmailTemplate


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'subject_template', 'html_content',
            'plain_text_content', 'variables', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class EmailTemplatePreviewSerializer(serializers.Serializer):
    """Serializer for template preview with test data"""
    test_data = serializers.JSONField()
