from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmailTemplate
from .serializers import EmailTemplateSerializer, EmailTemplatePreviewSerializer
from string import Template as StringTemplate


class EmailTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for EmailTemplate"""

    queryset = EmailTemplate.objects.all()
    serializer_class = EmailTemplateSerializer

    @action(detail=True, methods=['post'])
    def preview(self, request, pk=None):
        """Preview template with test data"""
        template = self.get_object()
        serializer = EmailTemplatePreviewSerializer(data=request.data)

        if serializer.is_valid():
            test_data = serializer.validated_data['test_data']

            try:
                # Simple template substitution
                html_preview = StringTemplate(template.html_content).safe_substitute(test_data)
                text_preview = StringTemplate(template.plain_text_content).safe_substitute(test_data)
                subject_preview = StringTemplate(template.subject_template).safe_substitute(test_data)

                return Response({
                    'subject': subject_preview,
                    'html_content': html_preview,
                    'plain_text_content': text_preview
                })
            except Exception as e:
                return Response(
                    {'error': f'Template rendering error: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
