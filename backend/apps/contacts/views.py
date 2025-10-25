from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse
from django.db import transaction
import csv
from .models import ContactList, Contact
from .serializers import (
    ContactListSerializer, ContactSerializer,
    BulkContactUploadSerializer, ContactListManageSerializer
)


class ContactListViewSet(viewsets.ModelViewSet):
    """ViewSet for ContactList"""

    queryset = ContactList.objects.all()
    serializer_class = ContactListSerializer

    @action(detail=True, methods=['post'])
    def add_contacts(self, request, pk=None):
        """Add contacts to this list"""
        contact_list = self.get_object()
        serializer = ContactListManageSerializer(data=request.data)

        if serializer.is_valid():
            contact_ids = serializer.validated_data['contact_ids']
            contacts = Contact.objects.filter(id__in=contact_ids)

            with transaction.atomic():
                contact_list.contacts.add(*contacts)
                contact_list.total_contacts = contact_list.contacts.count()
                contact_list.save()

            return Response({
                'message': f'{len(contacts)} contacts added to list',
                'total_contacts': contact_list.total_contacts
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def remove_contacts(self, request, pk=None):
        """Remove contacts from this list"""
        contact_list = self.get_object()
        serializer = ContactListManageSerializer(data=request.data)

        if serializer.is_valid():
            contact_ids = serializer.validated_data['contact_ids']
            contacts = Contact.objects.filter(id__in=contact_ids)

            with transaction.atomic():
                contact_list.contacts.remove(*contacts)
                contact_list.total_contacts = contact_list.contacts.count()
                contact_list.save()

            return Response({
                'message': f'{len(contacts)} contacts removed from list',
                'total_contacts': contact_list.total_contacts
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactViewSet(viewsets.ModelViewSet):
    """ViewSet for Contact"""

    queryset = Contact.objects.prefetch_related('lists').all()
    serializer_class = ContactSerializer
    filterset_fields = ['is_subscribed', 'is_suppressed']
    search_fields = ['email', 'first_name', 'last_name']

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        """Bulk upload contacts from CSV"""
        serializer = BulkContactUploadSerializer(data=request.data)

        if serializer.is_valid():
            list_id = serializer.validated_data['list_id']
            contacts_data = serializer.validated_data['contacts']

            try:
                contact_list = ContactList.objects.get(id=list_id)
            except ContactList.DoesNotExist:
                return Response(
                    {'error': 'Contact list not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            created_count = 0
            updated_count = 0

            with transaction.atomic():
                for contact_data in contacts_data:
                    email = contact_data.get('email')
                    if not email:
                        continue

                    contact, created = Contact.objects.update_or_create(
                        email=email,
                        defaults={
                            'first_name': contact_data.get('first_name', ''),
                            'last_name': contact_data.get('last_name', ''),
                            'custom_fields': contact_data.get('custom_fields', {}),
                        }
                    )

                    contact.lists.add(contact_list)

                    if created:
                        created_count += 1
                    else:
                        updated_count += 1

                # Update list count
                contact_list.total_contacts = contact_list.contacts.count()
                contact_list.save()

            return Response({
                'message': 'Bulk upload completed',
                'created': created_count,
                'updated': updated_count,
                'total': created_count + updated_count
            })

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export contacts to CSV"""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="contacts.csv"'

        writer = csv.writer(response)
        writer.writerow(['Email', 'First Name', 'Last Name', 'Subscribed', 'Suppressed', 'Lists'])

        contacts = self.filter_queryset(self.get_queryset())
        for contact in contacts:
            lists = ', '.join([lst.name for lst in contact.lists.all()])
            writer.writerow([
                contact.email,
                contact.first_name,
                contact.last_name,
                'Yes' if contact.is_subscribed else 'No',
                'Yes' if contact.is_suppressed else 'No',
                lists
            ])

        return response
