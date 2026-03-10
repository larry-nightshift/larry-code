from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Contact, Interaction, Reminder


class ContactModelTest(TestCase):
    """Test Contact model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.contact = Contact.objects.create(
            user=self.user,
            full_name='John Doe',
            email='john@example.com',
            phone='555-1234',
            company='Tech Corp',
            tags='important,friend'
        )

    def test_contact_creation(self):
        """Test basic contact creation."""
        self.assertEqual(self.contact.full_name, 'John Doe')
        self.assertEqual(self.contact.email, 'john@example.com')
        self.assertEqual(self.contact.user, self.user)

    def test_contact_str(self):
        """Test contact string representation."""
        self.assertEqual(str(self.contact), 'John Doe')

    def test_contact_timestamps(self):
        """Test created_at and updated_at timestamps."""
        self.assertIsNotNone(self.contact.created_at)
        self.assertIsNotNone(self.contact.updated_at)


class InteractionModelTest(TestCase):
    """Test Interaction model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.contact = Contact.objects.create(
            user=self.user,
            full_name='Jane Doe'
        )
        self.interaction = Interaction.objects.create(
            contact=self.contact,
            date=timezone.now(),
            medium='call',
            notes='Had a great call'
        )

    def test_interaction_creation(self):
        """Test interaction creation."""
        self.assertEqual(self.interaction.contact, self.contact)
        self.assertEqual(self.interaction.medium, 'call')

    def test_interaction_ordering(self):
        """Test interactions are ordered by date descending."""
        older_interaction = Interaction.objects.create(
            contact=self.contact,
            date=timezone.now() - timedelta(days=1),
            medium='email',
            notes='Old email'
        )
        interactions = list(self.contact.interactions.all())
        self.assertEqual(interactions[0].id, self.interaction.id)


class ReminderModelTest(TestCase):
    """Test Reminder model."""

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass')
        self.contact = Contact.objects.create(
            user=self.user,
            full_name='John Doe'
        )
        self.future_time = timezone.now() + timedelta(days=3)
        self.reminder = Reminder.objects.create(
            user=self.user,
            contact=self.contact,
            due_at=self.future_time,
            message='Follow up with John'
        )

    def test_reminder_creation(self):
        """Test reminder creation."""
        self.assertEqual(self.reminder.user, self.user)
        self.assertEqual(self.reminder.contact, self.contact)
        self.assertFalse(self.reminder.done)

    def test_is_overdue(self):
        """Test is_overdue calculation."""
        self.assertFalse(self.reminder.is_overdue())

        past_reminder = Reminder.objects.create(
            user=self.user,
            due_at=timezone.now() - timedelta(days=1),
            message='Should be done'
        )
        self.assertTrue(past_reminder.is_overdue())

    def test_is_not_overdue_when_done(self):
        """Test completed reminders are never overdue."""
        self.reminder.done = True
        self.assertFalse(self.reminder.is_overdue())

    def test_days_until_due(self):
        """Test days_until_due calculation."""
        days = self.reminder.days_until_due()
        self.assertIsNotNone(days)
        self.assertGreaterEqual(days, 2)  # At least 2 days away


class ContactAPITest(APITestCase):
    """Test Contact API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass')

        self.contact = Contact.objects.create(
            user=self.user,
            full_name='John Doe',
            email='john@example.com'
        )
        self.other_contact = Contact.objects.create(
            user=self.other_user,
            full_name='Other Person'
        )

    def test_create_contact(self):
        """Test creating a contact."""
        self.client.force_authenticate(user=self.user)
        data = {
            'full_name': 'New Contact',
            'email': 'new@example.com',
            'phone': '555-5678',
            'company': 'New Corp'
        }
        response = self.client.post('/api/crm/contacts/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contact.objects.filter(user=self.user).count(), 2)

    def test_list_contacts(self):
        """Test listing contacts - only own contacts shown."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/crm/contacts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['full_name'], 'John Doe')

    def test_retrieve_contact(self):
        """Test retrieving a single contact."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/crm/contacts/{self.contact.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['full_name'], 'John Doe')

    def test_update_contact(self):
        """Test updating a contact."""
        self.client.force_authenticate(user=self.user)
        data = {'full_name': 'Updated Name'}
        response = self.client.patch(f'/api/crm/contacts/{self.contact.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contact.refresh_from_db()
        self.assertEqual(self.contact.full_name, 'Updated Name')

    def test_delete_contact(self):
        """Test deleting a contact."""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete(f'/api/crm/contacts/{self.contact.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Contact.objects.filter(user=self.user).count(), 0)

    def test_cannot_access_other_users_contact(self):
        """Test user cannot access other user's contact."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/crm/contacts/{self.other_contact.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_search_contacts(self):
        """Test searching contacts by name."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/crm/contacts/?search=John')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class ReminderAPITest(APITestCase):
    """Test Reminder API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.contact = Contact.objects.create(
            user=self.user,
            full_name='John Doe'
        )

        self.reminder = Reminder.objects.create(
            user=self.user,
            contact=self.contact,
            due_at=timezone.now() + timedelta(days=2),
            message='Follow up'
        )

    def test_create_reminder(self):
        """Test creating a reminder."""
        self.client.force_authenticate(user=self.user)
        data = {
            'contact': str(self.contact.id),
            'due_at': (timezone.now() + timedelta(days=5)).isoformat(),
            'message': 'Another follow up'
        }
        response = self.client.post('/api/crm/reminders/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_reminders(self):
        """Test listing reminders."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/crm/reminders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_reminders_due_in_days(self):
        """Test filtering reminders by due_in parameter."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/crm/reminders/?due_in=3')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_mark_reminder_done(self):
        """Test marking a reminder as done."""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            f'/api/crm/reminders/{self.reminder.id}/mark_done/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reminder.refresh_from_db()
        self.assertTrue(self.reminder.done)

    def test_snooze_reminder(self):
        """Test snoozing a reminder."""
        self.client.force_authenticate(user=self.user)
        original_due = self.reminder.due_at
        response = self.client.patch(
            f'/api/crm/reminders/{self.reminder.id}/snooze/',
            {'days': 3}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.reminder.refresh_from_db()
        self.assertGreater(self.reminder.due_at, original_due)
