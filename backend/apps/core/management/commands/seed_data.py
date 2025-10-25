"""
Management command to populate database with sample data
"""
from django.core.management.base import BaseCommand
from apps.emails.models import EmailTemplate
from apps.contacts.models import ContactList, Contact
from apps.campaigns.models import Campaign
from django.db import transaction


class Command(BaseCommand):
    help = 'Populate database with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Starting data seeding...')

        with transaction.atomic():
            # Create Email Templates
            self.stdout.write('Creating email templates...')
            templates = self._create_templates()

            # Create Contact Lists
            self.stdout.write('Creating contact lists...')
            lists = self._create_contact_lists()

            # Create Contacts
            self.stdout.write('Creating contacts...')
            self._create_contacts(lists)

            # Create Campaigns
            self.stdout.write('Creating campaigns...')
            self._create_campaigns(templates, lists)

        self.stdout.write(self.style.SUCCESS('Data seeding completed successfully!'))

    def _create_templates(self):
        templates = []

        # Welcome Template
        welcome = EmailTemplate.objects.create(
            name='Boas-vindas',
            subject_template='Bem-vindo(a), $name!',
            html_content='''
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h1 style="color: #2563eb;">Olá, $name!</h1>
                <p>Seja bem-vindo(a) à nossa plataforma!</p>
                <p>Estamos muito felizes em tê-lo(a) conosco.</p>
                <p>Atenciosamente,<br>Equipe</p>
            </body>
            </html>
            ''',
            plain_text_content='''
            Olá, $name!

            Seja bem-vindo(a) à nossa plataforma!

            Estamos muito felizes em tê-lo(a) conosco.

            Atenciosamente,
            Equipe
            ''',
            variables={'name': 'string', 'email': 'string'},
            is_active=True
        )
        templates.append(welcome)

        # Newsletter Template
        newsletter = EmailTemplate.objects.create(
            name='Newsletter Mensal',
            subject_template='Newsletter - Novidades do Mês',
            html_content='''
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f3f4f6;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
                    <h1 style="color: #1f2937;">Olá, $name!</h1>
                    <h2 style="color: #2563eb;">Novidades do Mês</h2>
                    <p>Confira as principais novidades e atualizações deste mês.</p>
                    <ul>
                        <li>Novidade 1: Nova funcionalidade X</li>
                        <li>Novidade 2: Atualização Y</li>
                        <li>Novidade 3: Melhoria Z</li>
                    </ul>
                    <a href="#" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
                        Saiba Mais
                    </a>
                </div>
            </body>
            </html>
            ''',
            plain_text_content='''
            Olá, $name!

            Novidades do Mês

            Confira as principais novidades e atualizações deste mês.

            - Novidade 1: Nova funcionalidade X
            - Novidade 2: Atualização Y
            - Novidade 3: Melhoria Z

            Saiba Mais: [link]
            ''',
            variables={'name': 'string', 'email': 'string'},
            is_active=True
        )
        templates.append(newsletter)

        # Promotional Template
        promo = EmailTemplate.objects.create(
            name='Promoção Especial',
            subject_template='🎉 Oferta Exclusiva para $name!',
            html_content='''
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #fef3c7;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; border: 2px solid #f59e0b;">
                    <h1 style="color: #f59e0b; text-align: center;">🎉 OFERTA ESPECIAL 🎉</h1>
                    <h2 style="color: #1f2937;">Olá, $name!</h2>
                    <p style="font-size: 18px;">Aproveite nossa promoção exclusiva!</p>
                    <div style="background-color: #fef3c7; padding: 20px; border-radius: 6px; margin: 20px 0; text-align: center;">
                        <p style="font-size: 32px; font-weight: bold; color: #f59e0b; margin: 0;">50% OFF</p>
                        <p style="margin: 10px 0 0 0;">em produtos selecionados</p>
                    </div>
                    <a href="#" style="display: inline-block; background-color: #f59e0b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; width: 100%; text-align: center; font-size: 18px; font-weight: bold;">
                        APROVEITAR AGORA
                    </a>
                </div>
            </body>
            </html>
            ''',
            plain_text_content='''
            🎉 OFERTA ESPECIAL 🎉

            Olá, $name!

            Aproveite nossa promoção exclusiva!

            50% OFF em produtos selecionados

            Aproveitar agora: [link]
            ''',
            variables={'name': 'string', 'email': 'string'},
            is_active=True
        )
        templates.append(promo)

        self.stdout.write(f'Created {len(templates)} templates')
        return templates

    def _create_contact_lists(self):
        lists = []

        clientes = ContactList.objects.create(
            name='Clientes',
            description='Lista de clientes ativos',
            total_contacts=0
        )
        lists.append(clientes)

        prospects = ContactList.objects.create(
            name='Prospects',
            description='Potenciais clientes',
            total_contacts=0
        )
        lists.append(prospects)

        self.stdout.write(f'Created {len(lists)} contact lists')
        return lists

    def _create_contacts(self, lists):
        sample_contacts = [
            {'first_name': 'João', 'last_name': 'Silva', 'email': 'joao.silva@example.com'},
            {'first_name': 'Maria', 'last_name': 'Santos', 'email': 'maria.santos@example.com'},
            {'first_name': 'Pedro', 'last_name': 'Oliveira', 'email': 'pedro.oliveira@example.com'},
            {'first_name': 'Ana', 'last_name': 'Costa', 'email': 'ana.costa@example.com'},
            {'first_name': 'Carlos', 'last_name': 'Ferreira', 'email': 'carlos.ferreira@example.com'},
            {'first_name': 'Juliana', 'last_name': 'Almeida', 'email': 'juliana.almeida@example.com'},
            {'first_name': 'Roberto', 'last_name': 'Pereira', 'email': 'roberto.pereira@example.com'},
            {'first_name': 'Fernanda', 'last_name': 'Lima', 'email': 'fernanda.lima@example.com'},
            {'first_name': 'Lucas', 'last_name': 'Rodrigues', 'email': 'lucas.rodrigues@example.com'},
            {'first_name': 'Patricia', 'last_name': 'Martins', 'email': 'patricia.martins@example.com'},
        ]

        for i, contact_data in enumerate(sample_contacts):
            contact = Contact.objects.create(**contact_data)

            # Add to appropriate list
            if i < 5:
                contact.lists.add(lists[0])  # Clientes
            else:
                contact.lists.add(lists[1])  # Prospects

        # Update list counts
        for contact_list in lists:
            contact_list.total_contacts = contact_list.contacts.count()
            contact_list.save()

        self.stdout.write(f'Created {len(sample_contacts)} contacts')

    def _create_campaigns(self, templates, lists):
        Campaign.objects.create(
            name='Campanha de Boas-vindas',
            subject='Bem-vindo à nossa plataforma!',
            from_email='noreply@example.com',
            from_name='Equipe Plataforma',
            template=templates[0],
            contact_list=lists[0],
            status='draft',
            total_recipients=0
        )

        Campaign.objects.create(
            name='Newsletter Janeiro 2024',
            subject='Newsletter - Novidades de Janeiro',
            from_email='newsletter@example.com',
            from_name='Newsletter',
            template=templates[1],
            contact_list=lists[0],
            status='draft',
            total_recipients=0
        )

        Campaign.objects.create(
            name='Promoção de Verão',
            subject='🎉 Promoção Especial de Verão!',
            from_email='promocoes@example.com',
            from_name='Promoções',
            template=templates[2],
            contact_list=lists[1],
            status='draft',
            total_recipients=0
        )

        self.stdout.write('Created 3 campaigns')
