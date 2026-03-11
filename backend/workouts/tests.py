from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
import datetime

from .models import Exercise, Routine, RoutineItem, Workout, WorkoutExercise, WorkoutSet, PersonalRecord
from .services.prs import compute_pr_candidates, apply_pr_candidates, calculate_epley_1rm


class ExerciseModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')

    def test_create_weight_reps_exercise(self):
        exercise = Exercise.objects.create(
            user=self.user,
            name='Bench Press',
            exercise_type='WEIGHT_REPS',
            muscle_group='CHEST'
        )
        self.assertEqual(exercise.name, 'Bench Press')
        self.assertEqual(exercise.exercise_type, 'WEIGHT_REPS')
        self.assertFalse(exercise.is_archived)

    def test_unique_constraint_user_name(self):
        Exercise.objects.create(
            user=self.user,
            name='Squat',
            exercise_type='WEIGHT_REPS'
        )
        with self.assertRaises(Exception):
            Exercise.objects.create(
                user=self.user,
                name='Squat',
                exercise_type='BODYWEIGHT_REPS'
            )


class RoutineModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.exercise = Exercise.objects.create(
            user=self.user,
            name='Bench Press',
            exercise_type='WEIGHT_REPS'
        )

    def test_create_routine_with_items(self):
        routine = Routine.objects.create(
            user=self.user,
            name='Push Day',
            description='Chest and shoulders'
        )
        RoutineItem.objects.create(
            routine=routine,
            exercise=self.exercise,
            order=1,
            target_sets=4,
            target_reps_min=5,
            target_reps_max=8
        )
        self.assertEqual(routine.items.count(), 1)
        self.assertEqual(routine.items.first().exercise.name, 'Bench Press')


class WorkoutModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.exercise = Exercise.objects.create(
            user=self.user,
            name='Squat',
            exercise_type='WEIGHT_REPS'
        )

    def test_create_workout_with_sets(self):
        workout = Workout.objects.create(
            user=self.user,
            started_at=timezone.now()
        )
        we = WorkoutExercise.objects.create(
            workout=workout,
            exercise=self.exercise,
            order=1
        )
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=1,
            weight=Decimal('185.00'),
            reps=5,
            is_warmup=False
        )
        self.assertEqual(workout.workout_exercises.count(), 1)
        self.assertEqual(we.sets.count(), 1)
        self.assertEqual(we.sets.first().weight, Decimal('185.00'))


class PRComputationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.exercise = Exercise.objects.create(
            user=self.user,
            name='Bench Press',
            exercise_type='WEIGHT_REPS'
        )

    def test_calculate_epley_1rm(self):
        # Test Epley formula: 1RM = weight * (1 + reps/30)
        # Example: 185 lbs x 5 reps = 185 * (1 + 5/30) = 185 * 1.167 ≈ 216
        result = calculate_epley_1rm(Decimal('185'), 5)
        expected = Decimal('185') * (1 + Decimal('5') / Decimal('30'))
        self.assertAlmostEqual(float(result), float(expected), places=2)

    def test_pr_max_weight(self):
        workout = Workout.objects.create(
            user=self.user,
            started_at=timezone.now()
        )
        we = WorkoutExercise.objects.create(
            workout=workout,
            exercise=self.exercise,
            order=1
        )
        # Create sets with varying weights
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=1,
            weight=Decimal('185.00'),
            reps=5,
            is_warmup=False
        )
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=2,
            weight=Decimal('190.00'),
            reps=3,
            is_warmup=False
        )
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=3,
            weight=Decimal('180.00'),
            reps=7,
            is_warmup=False
        )

        candidates = compute_pr_candidates(workout)
        # Should have MAX_WEIGHT and BEST_EST_1RM candidates
        self.assertEqual(len(candidates), 2)

        # Find MAX_WEIGHT candidate
        max_weight_candidate = [c for c in candidates if c[1] == 'MAX_WEIGHT'][0]
        self.assertEqual(max_weight_candidate[2], Decimal('190.00'))

    def test_warmup_sets_ignored(self):
        workout = Workout.objects.create(
            user=self.user,
            started_at=timezone.now()
        )
        we = WorkoutExercise.objects.create(
            workout=workout,
            exercise=self.exercise,
            order=1
        )
        # Create warmup set with high weight
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=1,
            weight=Decimal('300.00'),
            reps=1,
            is_warmup=True
        )
        # Create working set with lower weight
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=2,
            weight=Decimal('185.00'),
            reps=5,
            is_warmup=False
        )

        candidates = compute_pr_candidates(workout)
        # MAX_WEIGHT should be 185, not 300
        max_weight_candidate = [c for c in candidates if c[1] == 'MAX_WEIGHT'][0]
        self.assertEqual(max_weight_candidate[2], Decimal('185.00'))

    def test_bodyweight_reps_max_reps(self):
        exercise = Exercise.objects.create(
            user=self.user,
            name='Pull-ups',
            exercise_type='BODYWEIGHT_REPS'
        )
        workout = Workout.objects.create(
            user=self.user,
            started_at=timezone.now()
        )
        we = WorkoutExercise.objects.create(
            workout=workout,
            exercise=exercise,
            order=1
        )
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=1,
            reps=8,
            is_warmup=False
        )
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=2,
            reps=6,
            is_warmup=False
        )

        candidates = compute_pr_candidates(workout)
        pr_candidate = [c for c in candidates if c[1] == 'MAX_REPS'][0]
        self.assertEqual(pr_candidate[2], Decimal('8'))

    def test_time_max_duration(self):
        exercise = Exercise.objects.create(
            user=self.user,
            name='Plank',
            exercise_type='TIME'
        )
        workout = Workout.objects.create(
            user=self.user,
            started_at=timezone.now()
        )
        we = WorkoutExercise.objects.create(
            workout=workout,
            exercise=exercise,
            order=1
        )
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=1,
            duration_seconds=120,
            is_warmup=False
        )
        WorkoutSet.objects.create(
            workout_exercise=we,
            set_number=2,
            duration_seconds=90,
            is_warmup=False
        )

        candidates = compute_pr_candidates(workout)
        duration_candidate = [c for c in candidates if c[1] == 'MAX_DURATION'][0]
        self.assertEqual(duration_candidate[2], Decimal('120'))

    def test_pr_tracking_improvement(self):
        # Create first workout with PR
        workout1 = Workout.objects.create(
            user=self.user,
            started_at=timezone.now()
        )
        we1 = WorkoutExercise.objects.create(
            workout=workout1,
            exercise=self.exercise,
            order=1
        )
        WorkoutSet.objects.create(
            workout_exercise=we1,
            set_number=1,
            weight=Decimal('185.00'),
            reps=5,
            is_warmup=False
        )

        candidates1 = compute_pr_candidates(workout1)
        apply_pr_candidates(self.user, workout1, candidates1)

        # Verify PR was created
        pr = PersonalRecord.objects.get(
            user=self.user,
            exercise=self.exercise,
            record_type='MAX_WEIGHT'
        )
        self.assertEqual(pr.value_decimal, Decimal('185.00'))

        # Create second workout with improved PR
        workout2 = Workout.objects.create(
            user=self.user,
            started_at=timezone.now() + datetime.timedelta(days=1)
        )
        we2 = WorkoutExercise.objects.create(
            workout=workout2,
            exercise=self.exercise,
            order=1
        )
        WorkoutSet.objects.create(
            workout_exercise=we2,
            set_number=1,
            weight=Decimal('195.00'),
            reps=5,
            is_warmup=False
        )

        candidates2 = compute_pr_candidates(workout2)
        apply_pr_candidates(self.user, workout2, candidates2)

        # Verify PR was updated
        pr.refresh_from_db()
        self.assertEqual(pr.value_decimal, Decimal('195.00'))
