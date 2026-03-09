from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import date, timedelta
from .models import TodayFocus, Note, Task, UpcomingItem

User = get_user_model()


class TodayFocusModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')

    def test_create_today_focus(self):
        focus = TodayFocus.objects.create(
            user=self.user,
            date=date.today(),
            text='Test focus'
        )
        self.assertEqual(focus.text, 'Test focus')
        self.assertEqual(focus.user, self.user)

    def test_unique_together_constraint(self):
        TodayFocus.objects.create(
            user=self.user,
            date=date.today(),
            text='First'
        )
        with self.assertRaises(Exception):
            TodayFocus.objects.create(
                user=self.user,
                date=date.today(),
                text='Second'
            )


class NoteModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')

    def test_create_note(self):
        note = Note.objects.create(
            user=self.user,
            title='Test Note',
            body='Test body',
            pinned=False,
            archived=False
        )
        self.assertEqual(note.title, 'Test Note')
        self.assertFalse(note.pinned)
        self.assertFalse(note.archived)

    def test_note_defaults(self):
        note = Note.objects.create(
            user=self.user,
            body='Test body'
        )
        self.assertEqual(note.title, '')
        self.assertFalse(note.pinned)
        self.assertFalse(note.archived)


class TaskModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')

    def test_create_task(self):
        task = Task.objects.create(
            user=self.user,
            text='Test task',
            status='TODO'
        )
        self.assertEqual(task.text, 'Test task')
        self.assertEqual(task.status, 'TODO')

    def test_task_status_choices(self):
        task = Task.objects.create(
            user=self.user,
            text='Test task',
            status='DONE'
        )
        self.assertEqual(task.status, 'DONE')


class UpcomingItemModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')

    def test_create_upcoming_item(self):
        from django.utils.timezone import now
        starts_at = now()
        item = UpcomingItem.objects.create(
            user=self.user,
            title='Test Event',
            starts_at=starts_at
        )
        self.assertEqual(item.title, 'Test Event')
        self.assertEqual(item.notes, '')


class TodayFocusAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_get_today_focus_no_content(self):
        response = self.client.get('/api/focus/today/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_put_today_focus_create(self):
        data = {'text': 'My focus for today'}
        response = self.client.put('/api/focus/today/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['text'], 'My focus for today')
        self.assertEqual(response.data['date'], str(date.today()))

    def test_put_today_focus_update(self):
        TodayFocus.objects.create(
            user=self.user,
            date=date.today(),
            text='Old focus'
        )
        data = {'text': 'New focus'}
        response = self.client.put('/api/focus/today/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['text'], 'New focus')

    def test_get_today_focus_exists(self):
        TodayFocus.objects.create(
            user=self.user,
            date=date.today(),
            text='Test focus'
        )
        response = self.client.get('/api/focus/today/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['text'], 'Test focus')

    def test_unauthenticated_access_denied(self):
        client = APIClient()
        response = client.get('/api/focus/today/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])


class NoteAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.other_user = User.objects.create_user(username='otheruser', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_note(self):
        data = {'title': 'Test Note', 'body': 'Test body'}
        response = self.client.post('/api/notes/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Test Note')

    def test_list_notes(self):
        Note.objects.create(user=self.user, title='Note 1', body='Body 1')
        Note.objects.create(user=self.user, title='Note 2', body='Body 2')
        Note.objects.create(user=self.other_user, title='Other', body='Body')

        response = self.client.get('/api/notes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_update_note(self):
        note = Note.objects.create(user=self.user, title='Old', body='Body')
        data = {'title': 'Updated', 'pinned': True}
        response = self.client.patch(f'/api/notes/{note.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated')
        self.assertTrue(response.data['pinned'])

    def test_archive_note(self):
        note = Note.objects.create(user=self.user, title='Note', body='Body')
        data = {'archived': True}
        response = self.client.patch(f'/api/notes/{note.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['archived'])


class TaskAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_task(self):
        data = {'text': 'Test task'}
        response = self.client.post('/api/tasks/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['text'], 'Test task')
        self.assertEqual(response.data['status'], 'TODO')

    def test_list_tasks(self):
        Task.objects.create(user=self.user, text='Task 1')
        Task.objects.create(user=self.user, text='Task 2')
        response = self.client.get('/api/tasks/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    def test_update_task_status(self):
        task = Task.objects.create(user=self.user, text='Task')
        data = {'status': 'DONE'}
        response = self.client.patch(f'/api/tasks/{task.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'DONE')

    def test_task_with_due_date(self):
        due_date = date.today() + timedelta(days=1)
        data = {'text': 'Task with due date', 'due_date': str(due_date)}
        response = self.client.post('/api/tasks/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['due_date'], str(due_date))


class UpcomingItemAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_create_upcoming_item(self):
        from django.utils.timezone import now
        data = {
            'title': 'Team Meeting',
            'starts_at': now().isoformat(),
            'notes': 'Discuss Q1 goals'
        }
        response = self.client.post('/api/upcoming/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Team Meeting')

    def test_list_upcoming_items(self):
        from django.utils.timezone import now
        UpcomingItem.objects.create(
            user=self.user,
            title='Item 1',
            starts_at=now()
        )
        UpcomingItem.objects.create(
            user=self.user,
            title='Item 2',
            starts_at=now()
        )
        response = self.client.get('/api/upcoming/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
