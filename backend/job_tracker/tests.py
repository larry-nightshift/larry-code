from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone

from .models import (
    Company,
    Application,
    Contact,
    ApplicationContact,
    Activity,
    Reminder,
    InterviewPrepNote,
)


class CompanyTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )

    def test_company_creation(self):
        company = Company.objects.create(
            user=self.user,
            name="Acme Corp",
            website="https://acme.com",
            industry="Technology",
            location="San Francisco, CA",
        )
        self.assertEqual(company.name, "Acme Corp")
        self.assertEqual(company.user, self.user)

    def test_unique_company_name_per_user(self):
        Company.objects.create(user=self.user, name="Acme Corp")
        with self.assertRaises(Exception):
            Company.objects.create(user=self.user, name="Acme Corp")

    def test_company_str(self):
        company = Company.objects.create(user=self.user, name="Test Company")
        self.assertEqual(str(company), "Test Company")


class ApplicationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.company = Company.objects.create(user=self.user, name="Test Corp")

    def test_application_creation(self):
        app = Application.objects.create(
            user=self.user,
            company=self.company,
            role_title="Senior Engineer",
            status=Application.STATUS_APPLIED,
            priority=3,
        )
        self.assertEqual(app.role_title, "Senior Engineer")
        self.assertEqual(app.status, Application.STATUS_APPLIED)

    def test_application_salary_validation(self):
        app = Application(
            user=self.user,
            company=self.company,
            role_title="Engineer",
            salary_min=100000,
            salary_max=50000,
        )
        with self.assertRaises(Exception):
            app.clean()

    def test_status_change_creates_activity(self):
        app = Application.objects.create(
            user=self.user,
            company=self.company,
            role_title="Engineer",
            status=Application.STATUS_APPLIED,
        )

        # Change status
        app.status = Application.STATUS_PHONE_SCREEN
        app.save()

        # Check that activity was created
        activity = Activity.objects.filter(
            application=app, is_system=True
        ).first()
        self.assertIsNotNone(activity)
        self.assertIn("Status changed", activity.title)


class ContactTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.company = Company.objects.create(user=self.user, name="Test Corp")

    def test_contact_creation(self):
        contact = Contact.objects.create(
            user=self.user,
            company=self.company,
            name="John Doe",
            email="john@example.com",
            role_at_company="Hiring Manager",
        )
        self.assertEqual(contact.name, "John Doe")
        self.assertEqual(contact.email, "john@example.com")


class ActivityTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.company = Company.objects.create(user=self.user, name="Test Corp")
        self.application = Application.objects.create(
            user=self.user,
            company=self.company,
            role_title="Engineer",
        )

    def test_activity_creation(self):
        activity = Activity.objects.create(
            user=self.user,
            application=self.application,
            activity_type=Activity.TYPE_NOTE,
            title="Follow up email sent",
            activity_date=timezone.now(),
        )
        self.assertEqual(activity.title, "Follow up email sent")
        self.assertEqual(activity.activity_type, Activity.TYPE_NOTE)


class ReminderTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.company = Company.objects.create(user=self.user, name="Test Corp")
        self.application = Application.objects.create(
            user=self.user,
            company=self.company,
            role_title="Engineer",
        )

    def test_reminder_creation(self):
        tomorrow = timezone.now().date() + timedelta(days=1)
        reminder = Reminder.objects.create(
            user=self.user,
            application=self.application,
            reminder_date=tomorrow,
            title="Follow up with recruiter",
        )
        self.assertEqual(reminder.title, "Follow up with recruiter")
        self.assertFalse(reminder.is_completed)

    def test_reminder_completion(self):
        tomorrow = timezone.now().date() + timedelta(days=1)
        reminder = Reminder.objects.create(
            user=self.user,
            application=self.application,
            reminder_date=tomorrow,
            title="Test reminder",
        )
        reminder.is_completed = True
        reminder.completed_at = timezone.now()
        reminder.save()
        self.assertTrue(reminder.is_completed)
        self.assertIsNotNone(reminder.completed_at)


class APITestCase_Companies(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_company(self):
        response = self.client.post(
            "/api/job_tracker/companies/",
            {"name": "Test Corp", "industry": "Tech"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Company.objects.count(), 1)

    def test_list_companies(self):
        Company.objects.create(user=self.user, name="Corp 1")
        Company.objects.create(user=self.user, name="Corp 2")

        response = self.client.get("/api/job_tracker/companies/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)


class APITestCase_Applications(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass123"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.company = Company.objects.create(user=self.user, name="Test Corp")

    def test_create_application(self):
        response = self.client.post(
            "/api/job_tracker/applications/",
            {
                "company": str(self.company.id),
                "role_title": "Senior Engineer",
                "status": Application.STATUS_APPLIED,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_filter_applications_by_status(self):
        Application.objects.create(
            user=self.user,
            company=self.company,
            role_title="Role 1",
            status=Application.STATUS_APPLIED,
        )
        Application.objects.create(
            user=self.user,
            company=self.company,
            role_title="Role 2",
            status=Application.STATUS_INTERVIEW,
        )

        response = self.client.get(
            "/api/job_tracker/applications/?status=APPLIED"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)


class PermissionTestCase(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(
            username="user1", password="pass123"
        )
        self.user2 = User.objects.create_user(
            username="user2", password="pass123"
        )
        self.client = APIClient()

    def test_user_cannot_see_other_user_data(self):
        company = Company.objects.create(user=self.user1, name="Secret Corp")

        self.client.force_authenticate(user=self.user2)
        response = self.client.get("/api/job_tracker/companies/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)

    def test_unauthenticated_user_gets_403(self):
        response = self.client.get("/api/job_tracker/companies/")
        # DRF returns 403 for unauthenticated requests with IsAuthenticated permission
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
