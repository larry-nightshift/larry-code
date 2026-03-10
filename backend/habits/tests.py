from django.test import TestCase
from django.contrib.auth.models import User
from datetime import date, timedelta
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from .models import Habit, HabitCheckin
from .services.streaks import (
    calculate_current_streak,
    calculate_best_streak,
    get_completion_for_date,
)


class HabitModelTests(TestCase):
    """Test Habit model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass"
        )

    def test_create_daily_habit(self):
        """Test creating a daily habit."""
        habit = Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )
        self.assertEqual(habit.name, "Exercise")
        self.assertEqual(habit.schedule_type, Habit.SCHEDULE_DAILY)
        self.assertIsNone(habit.weekly_target)

    def test_create_weekly_habit(self):
        """Test creating a weekly habit."""
        habit = Habit.objects.create(
            user=self.user,
            name="Yoga",
            schedule_type=Habit.SCHEDULE_WEEKLY,
            weekly_target=3,
            start_date=date.today(),
        )
        self.assertEqual(habit.schedule_type, Habit.SCHEDULE_WEEKLY)
        self.assertEqual(habit.weekly_target, 3)

    def test_habit_archive(self):
        """Test archiving a habit."""
        habit = Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )
        habit.is_archived = True
        habit.save()
        self.assertTrue(habit.is_archived)


class HabitCheckinModelTests(TestCase):
    """Test HabitCheckin model."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass"
        )
        self.habit = Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )

    def test_create_checkin(self):
        """Test creating a check-in."""
        checkin = HabitCheckin.objects.create(
            user=self.user, habit=self.habit, date=date.today()
        )
        self.assertEqual(checkin.habit, self.habit)
        self.assertEqual(checkin.date, date.today())

    def test_unique_habit_date(self):
        """Test unique constraint on habit and date."""
        HabitCheckin.objects.create(
            user=self.user, habit=self.habit, date=date.today()
        )
        with self.assertRaises(Exception):
            HabitCheckin.objects.create(
                user=self.user, habit=self.habit, date=date.today()
            )


class StreakCalculationTests(TestCase):
    """Test streak calculation service."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass"
        )
        self.habit = Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today() - timedelta(days=30),
        )

    def test_daily_streak_consecutive(self):
        """Test consecutive daily streak."""
        today = date.today()
        # Create 5 consecutive days of check-ins
        for i in range(5):
            HabitCheckin.objects.create(
                user=self.user,
                habit=self.habit,
                date=today - timedelta(days=4 - i),
            )

        streak = calculate_current_streak(self.habit, today)
        self.assertEqual(streak, 5)

    def test_daily_streak_with_gap(self):
        """Test daily streak stops at gap."""
        today = date.today()
        # Create check-ins with a gap
        HabitCheckin.objects.create(user=self.user, habit=self.habit, date=today)
        HabitCheckin.objects.create(
            user=self.user, habit=self.habit, date=today - timedelta(days=1)
        )
        # Gap on today - timedelta(days=2)
        HabitCheckin.objects.create(
            user=self.user, habit=self.habit, date=today - timedelta(days=3)
        )

        streak = calculate_current_streak(self.habit, today)
        self.assertEqual(streak, 2)

    def test_daily_streak_empty(self):
        """Test streak is 0 when no check-ins."""
        streak = calculate_current_streak(self.habit, date.today())
        self.assertEqual(streak, 0)

    def test_best_daily_streak(self):
        """Test calculating best daily streak."""
        today = date.today()
        # Create a streak of 3 days
        for i in range(3):
            HabitCheckin.objects.create(
                user=self.user,
                habit=self.habit,
                date=today - timedelta(days=10 + i),
            )

        best = calculate_best_streak(self.habit)
        self.assertEqual(best, 3)

    def test_completion_for_date(self):
        """Test checking completion for a specific date."""
        today = date.today()
        HabitCheckin.objects.create(user=self.user, habit=self.habit, date=today)

        self.assertTrue(get_completion_for_date(self.habit, today))
        self.assertFalse(
            get_completion_for_date(self.habit, today - timedelta(days=1))
        )


class HabitAPITests(APITestCase):
    """Test Habit API endpoints."""

    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", password="testpass"
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_habits(self):
        """Test listing habits."""
        Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )
        response = self.client.get("/api/habits/habits/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_habit(self):
        """Test creating a habit."""
        data = {
            "name": "Exercise",
            "schedule_type": "DAILY",
            "start_date": date.today(),
        }
        response = self.client.post("/api/habits/habits/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Exercise")

    def test_create_weekly_habit(self):
        """Test creating a weekly habit."""
        data = {
            "name": "Yoga",
            "schedule_type": "WEEKLY",
            "weekly_target": 3,
            "start_date": date.today(),
        }
        response = self.client.post("/api/habits/habits/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["weekly_target"], 3)

    def test_cannot_access_other_users_habits(self):
        """Test that users cannot access other users' habits."""
        other_user = User.objects.create_user(
            username="otheruser", password="testpass"
        )
        habit = Habit.objects.create(
            user=other_user,
            name="Private Habit",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )

        response = self.client.get(f"/api/habits/habits/{habit.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_checkin(self):
        """Test toggling a check-in."""
        habit = Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )
        data = {"habit_id": str(habit.id), "date": str(date.today())}
        response = self.client.post("/api/habits/checkins/toggle/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["completed"])

    def test_toggle_checkin_twice(self):
        """Test toggling a check-in twice (idempotent)."""
        habit = Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )
        data = {"habit_id": str(habit.id), "date": str(date.today())}

        # First toggle
        response1 = self.client.post("/api/habits/checkins/toggle/", data, format="json")
        self.assertTrue(response1.data["completed"])

        # Second toggle
        response2 = self.client.post("/api/habits/checkins/toggle/", data, format="json")
        self.assertFalse(response2.data["completed"])

    def test_today_endpoint(self):
        """Test the today endpoint."""
        habit = Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )
        HabitCheckin.objects.create(
            user=self.user, habit=habit, date=date.today()
        )

        response = self.client.get("/api/habits/today/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertTrue(response.data[0]["completed_today"])

    def test_calendar_endpoint(self):
        """Test the calendar endpoint."""
        habit = Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )
        HabitCheckin.objects.create(
            user=self.user, habit=habit, date=date.today()
        )

        response = self.client.get(f"/api/habits/habits/{habit.id}/calendar/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn(str(date.today()), response.data["dates"])

    def test_insights_endpoint(self):
        """Test the insights endpoint."""
        habit = Habit.objects.create(
            user=self.user,
            name="Exercise",
            schedule_type=Habit.SCHEDULE_DAILY,
            start_date=date.today(),
        )
        response = self.client.get("/api/habits/insights/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("most_consistent", response.data)
        self.assertIn("at_risk", response.data)

    def test_unauthenticated_request(self):
        """Test that unauthenticated requests are rejected."""
        client = APIClient()
        response = client.get("/api/habits/habits/")
        # DRF returns 403 Forbidden for unauthenticated requests with IsAuthenticated
        self.assertIn(
            response.status_code,
            [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN],
        )
