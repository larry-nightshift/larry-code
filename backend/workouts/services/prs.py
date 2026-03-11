from decimal import Decimal
from django.utils import timezone
from ..models import Workout, WorkoutSet, PersonalRecord, Exercise


def calculate_epley_1rm(weight, reps):
    """Calculate estimated 1RM using Epley formula: 1RM = weight * (1 + reps/30)"""
    if not weight or not reps or reps == 0:
        return None
    return weight * (1 + Decimal(reps) / Decimal(30))


def compute_pr_candidates(workout: Workout):
    """
    Compute PR candidates from a single workout.
    Returns list of (exercise, record_type, value_decimal, value_int) tuples.
    """
    candidates = []

    # Group sets by exercise
    exercise_sets = {}
    for we in workout.workout_exercises.all():
        if we.exercise.id not in exercise_sets:
            exercise_sets[we.exercise.id] = {
                'exercise': we.exercise,
                'sets': []
            }
        # Add non-warmup sets only
        non_warmup_sets = we.sets.filter(is_warmup=False)
        exercise_sets[we.exercise.id]['sets'].extend(non_warmup_sets)

    # Compute PRs per exercise
    for exercise_id, data in exercise_sets.items():
        exercise = data['exercise']
        sets = data['sets']

        if not sets:
            continue

        ex_type = exercise.exercise_type

        if ex_type == 'WEIGHT_REPS':
            # MAX_WEIGHT: highest weight
            max_weight = None
            for s in sets:
                if s.weight:
                    if max_weight is None or s.weight > max_weight:
                        max_weight = s.weight

            if max_weight:
                candidates.append((exercise, 'MAX_WEIGHT', max_weight, None))

            # BEST_EST_1RM: highest 1RM estimate
            max_1rm = None
            for s in sets:
                if s.weight and s.reps:
                    est_1rm = calculate_epley_1rm(s.weight, s.reps)
                    if est_1rm and (max_1rm is None or est_1rm > max_1rm):
                        max_1rm = est_1rm

            if max_1rm:
                candidates.append((exercise, 'BEST_EST_1RM', max_1rm, None))

        elif ex_type == 'BODYWEIGHT_REPS':
            # MAX_REPS: highest reps in a set
            max_reps = None
            for s in sets:
                if s.reps:
                    if max_reps is None or s.reps > max_reps:
                        max_reps = s.reps

            if max_reps:
                candidates.append((exercise, 'MAX_REPS', Decimal(max_reps), max_reps))

        elif ex_type == 'TIME':
            # MAX_DURATION: longest duration
            max_duration = None
            for s in sets:
                if s.duration_seconds:
                    if max_duration is None or s.duration_seconds > max_duration:
                        max_duration = s.duration_seconds

            if max_duration:
                candidates.append((exercise, 'MAX_DURATION', Decimal(max_duration), max_duration))

    return candidates


def apply_pr_candidates(user, workout, candidates):
    """
    Apply PR candidates and update PersonalRecord table.
    Returns list of newly created/updated PRs.
    """
    updated_prs = []

    for exercise, record_type, value_decimal, value_int in candidates:
        # Check if this is a new PR
        try:
            current_pr = PersonalRecord.objects.get(
                user=user,
                exercise=exercise,
                record_type=record_type
            )
            # Update if new value is better
            if value_decimal > current_pr.value_decimal:
                current_pr.value_decimal = value_decimal
                current_pr.value_int = value_int
                current_pr.achieved_at = workout.started_at
                current_pr.workout = workout
                current_pr.save()
                updated_prs.append(current_pr)
        except PersonalRecord.DoesNotExist:
            # Create new PR
            pr = PersonalRecord.objects.create(
                user=user,
                exercise=exercise,
                record_type=record_type,
                value_decimal=value_decimal,
                value_int=value_int,
                achieved_at=workout.started_at,
                workout=workout
            )
            updated_prs.append(pr)

    return updated_prs


def rebuild_all_prs_for_user(user):
    """
    Rebuild all PRs for a user from scratch.
    Useful for migrations or corrections.
    """
    # Clear existing PRs
    PersonalRecord.objects.filter(user=user).delete()

    # Process all workouts in order
    workouts = Workout.objects.filter(user=user).order_by('started_at')
    all_prs = []

    for workout in workouts:
        candidates = compute_pr_candidates(workout)
        prs = apply_pr_candidates(user, workout, candidates)
        all_prs.extend(prs)

    return all_prs
