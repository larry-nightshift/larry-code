import uuid
from django.db import models
from django.contrib.auth.models import User


class Exercise(models.Model):
    EXERCISE_TYPE_CHOICES = (
        ('WEIGHT_REPS', 'Weight + Reps'),
        ('BODYWEIGHT_REPS', 'Bodyweight + Reps'),
        ('TIME', 'Time'),
        ('DISTANCE_TIME', 'Distance + Time'),
    )

    MUSCLE_GROUP_CHOICES = (
        ('CHEST', 'Chest'),
        ('BACK', 'Back'),
        ('LEGS', 'Legs'),
        ('SHOULDERS', 'Shoulders'),
        ('ARMS', 'Arms'),
        ('CORE', 'Core'),
        ('FULL_BODY', 'Full Body'),
        ('CARDIO', 'Cardio'),
        ('OTHER', 'Other'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=255)
    exercise_type = models.CharField(max_length=20, choices=EXERCISE_TYPE_CHOICES)
    muscle_group = models.CharField(max_length=20, choices=MUSCLE_GROUP_CHOICES, blank=True)
    notes = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_archived', 'name']),
        ]
        unique_together = ('user', 'name')

    def __str__(self):
        return f"{self.name} ({self.get_exercise_type_display()})"


class Routine(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='routines')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class RoutineItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    routine = models.ForeignKey(Routine, on_delete=models.CASCADE, related_name='items')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    order = models.PositiveSmallIntegerField()
    target_sets = models.PositiveSmallIntegerField(null=True, blank=True)
    target_reps_min = models.PositiveSmallIntegerField(null=True, blank=True)
    target_reps_max = models.PositiveSmallIntegerField(null=True, blank=True)
    target_weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    rest_seconds = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['routine', 'order']
        indexes = [
            models.Index(fields=['routine', 'order']),
        ]

    def __str__(self):
        return f"{self.routine.name} - {self.exercise.name} (#{self.order})"


class Workout(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workouts')
    routine = models.ForeignKey(Routine, on_delete=models.SET_NULL, null=True, blank=True)
    title = models.CharField(max_length=255, blank=True)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['user', 'started_at']),
        ]

    def __str__(self):
        return f"Workout - {self.started_at}"


class WorkoutExercise(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout = models.ForeignKey(Workout, on_delete=models.CASCADE, related_name='workout_exercises')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE)
    order = models.PositiveSmallIntegerField()
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['workout', 'order']
        indexes = [
            models.Index(fields=['workout', 'order']),
        ]

    def __str__(self):
        return f"{self.workout.started_at} - {self.exercise.name}"


class WorkoutSet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workout_exercise = models.ForeignKey(WorkoutExercise, on_delete=models.CASCADE, related_name='sets')
    set_number = models.PositiveSmallIntegerField()
    weight = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    reps = models.PositiveSmallIntegerField(null=True, blank=True)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    distance_meters = models.PositiveIntegerField(null=True, blank=True)
    rpe = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    is_warmup = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['workout_exercise', 'set_number']
        indexes = [
            models.Index(fields=['workout_exercise', 'set_number']),
        ]

    def __str__(self):
        return f"Set {self.set_number}"


class PersonalRecord(models.Model):
    RECORD_TYPE_CHOICES = (
        ('MAX_WEIGHT', 'Max Weight'),
        ('MAX_REPS', 'Max Reps'),
        ('MAX_DURATION', 'Max Duration'),
        ('BEST_EST_1RM', 'Best Est. 1RM'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='personal_records')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='prs')
    record_type = models.CharField(max_length=20, choices=RECORD_TYPE_CHOICES)
    value_decimal = models.DecimalField(max_digits=8, decimal_places=2)
    value_int = models.IntegerField(null=True, blank=True)
    achieved_at = models.DateTimeField()
    workout = models.ForeignKey(Workout, on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-achieved_at']
        constraints = [
            models.UniqueConstraint(fields=['user', 'exercise', 'record_type'], name='unique_pr_per_exercise')
        ]

    def __str__(self):
        return f"{self.exercise.name} - {self.get_record_type_display()}: {self.value_decimal}"
