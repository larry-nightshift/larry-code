from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta

from .models import Exercise, Routine, RoutineItem, Workout, WorkoutExercise, WorkoutSet, PersonalRecord
from .serializers import (
    ExerciseSerializer, RoutineSerializer, RoutineItemSerializer,
    WorkoutCreateSerializer, WorkoutDetailSerializer, WorkoutListSerializer,
    WorkoutSetSerializer, PersonalRecordSerializer
)
from .services.prs import compute_pr_candidates, apply_pr_candidates, rebuild_all_prs_for_user


class ExerciseViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ExerciseSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        user = self.request.user
        archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        qs = Exercise.objects.filter(user=user)
        if not archived:
            qs = qs.filter(is_archived=False)
        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        exercise = self.get_object()
        exercise.is_archived = True
        exercise.save()
        return Response({'status': 'archived'})

    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        exercise = self.get_object()
        exercise.is_archived = False
        exercise.save()
        return Response({'status': 'unarchived'})


class RoutineViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = RoutineSerializer

    def get_queryset(self):
        user = self.request.user
        archived = self.request.query_params.get('archived', 'false').lower() == 'true'
        qs = Routine.objects.filter(user=user)
        if not archived:
            qs = qs.filter(is_archived=False)
        return qs.prefetch_related('items__exercise').order_by('-created_at')

    def perform_create(self, serializer):
        routine = serializer.save(user=self.request.user)
        # Handle nested items if provided
        items_data = self.request.data.get('items', [])
        for idx, item_data in enumerate(items_data):
            RoutineItem.objects.create(
                routine=routine,
                exercise_id=item_data.get('exercise'),
                order=idx + 1,
                target_sets=item_data.get('target_sets'),
                target_reps_min=item_data.get('target_reps_min'),
                target_reps_max=item_data.get('target_reps_max'),
                target_weight=item_data.get('target_weight'),
                rest_seconds=item_data.get('rest_seconds'),
                notes=item_data.get('notes', '')
            )

    def perform_update(self, serializer):
        routine = serializer.save()
        # Handle updated items
        items_data = self.request.data.get('items', [])
        # Delete old items and recreate
        routine.items.all().delete()
        for idx, item_data in enumerate(items_data):
            RoutineItem.objects.create(
                routine=routine,
                exercise_id=item_data.get('exercise'),
                order=idx + 1,
                target_sets=item_data.get('target_sets'),
                target_reps_min=item_data.get('target_reps_min'),
                target_reps_max=item_data.get('target_reps_max'),
                target_weight=item_data.get('target_weight'),
                rest_seconds=item_data.get('rest_seconds'),
                notes=item_data.get('notes', '')
            )

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        routine = self.get_object()
        routine.is_archived = True
        routine.save()
        return Response({'status': 'archived'})


class WorkoutViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'workout_exercises__exercise__name']

    def get_serializer_class(self):
        if self.action == 'create':
            return WorkoutCreateSerializer
        elif self.action == 'retrieve':
            return WorkoutDetailSerializer
        else:
            return WorkoutListSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Workout.objects.filter(user=user).prefetch_related('workout_exercises__sets', 'workout_exercises__exercise')

        # Filter by date range
        from_date = self.request.query_params.get('from')
        to_date = self.request.query_params.get('to')
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date)
                qs = qs.filter(started_at__gte=from_dt)
            except:
                pass
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date)
                qs = qs.filter(started_at__lte=to_dt)
            except:
                pass

        # Filter by exercise
        exercise_id = self.request.query_params.get('exercise_id')
        if exercise_id:
            qs = qs.filter(workout_exercises__exercise_id=exercise_id).distinct()

        return qs.order_by('-started_at')

    def perform_create(self, serializer):
        workout = serializer.save(user=self.request.user, started_at=timezone.now())

        # If routine provided, prefill exercises
        routine_id = self.request.data.get('routine')
        if routine_id:
            routine = Routine.objects.get(id=routine_id, user=self.request.user)
            for item in routine.items.all():
                WorkoutExercise.objects.create(
                    workout=workout,
                    exercise=item.exercise,
                    order=item.order
                )

    @action(detail=True, methods=['post'])
    def add_exercise(self, request, pk=None):
        workout = self.get_object()
        exercise_id = request.data.get('exercise_id')
        order = request.data.get('order')

        if not exercise_id or not order:
            return Response({'error': 'exercise_id and order required'}, status=status.HTTP_400_BAD_REQUEST)

        exercise = Exercise.objects.get(id=exercise_id, user=request.user)
        we = WorkoutExercise.objects.create(workout=workout, exercise=exercise, order=order)
        return Response(WorkoutExerciseSerializer(we).data)

    @action(detail=True, methods=['post'])
    def add_set(self, request, pk=None):
        workout = self.get_object()
        we_id = request.data.get('workout_exercise_id')
        set_number = request.data.get('set_number')

        if not we_id or set_number is None:
            return Response({'error': 'workout_exercise_id and set_number required'}, status=status.HTTP_400_BAD_REQUEST)

        we = WorkoutExercise.objects.get(id=we_id, workout=workout)
        serializer = WorkoutSetSerializer(
            data=request.data,
            context={'workout_exercise': we}
        )
        if serializer.is_valid():
            serializer.save(workout_exercise=we)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def finish(self, request, pk=None):
        workout = self.get_object()
        workout.ended_at = timezone.now()
        workout.notes = request.data.get('notes', workout.notes)
        workout.save()

        # Compute and apply PRs
        candidates = compute_pr_candidates(workout)
        apply_pr_candidates(request.user, workout, candidates)

        return Response(WorkoutDetailSerializer(workout).data)

    @action(detail=True, methods=['post'])
    def delete_exercise(self, request, pk=None):
        workout = self.get_object()
        we_id = request.data.get('workout_exercise_id')
        we = WorkoutExercise.objects.get(id=we_id, workout=workout)
        we.delete()
        return Response({'status': 'deleted'})

    @action(detail=True, methods=['post'])
    def delete_set(self, request, pk=None):
        workout = self.get_object()
        set_id = request.data.get('set_id')
        ws = WorkoutSet.objects.get(id=set_id, workout_exercise__workout=workout)
        ws.delete()
        return Response({'status': 'deleted'})


class PersonalRecordViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PersonalRecordSerializer

    def get_queryset(self):
        user = self.request.user
        return PersonalRecord.objects.filter(user=user).select_related('exercise').order_by('-achieved_at')

    @action(detail=False, methods=['get'])
    def by_exercise(self, request):
        exercise_id = request.query_params.get('exercise_id')
        if not exercise_id:
            return Response({'error': 'exercise_id required'}, status=status.HTTP_400_BAD_REQUEST)

        prs = self.get_queryset().filter(exercise_id=exercise_id)
        serializer = self.get_serializer(prs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def rebuild(self, request):
        """Rebuild all PRs from scratch"""
        prs = rebuild_all_prs_for_user(request.user)
        return Response({
            'status': 'rebuilt',
            'count': len(prs)
        })


class ProgressViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='chart')
    def chart(self, request):
        """Get progress data for a chart"""
        exercise_id = request.query_params.get('exercise_id')
        metric = request.query_params.get('metric', 'EST_1RM')
        from_date = request.query_params.get('from')
        to_date = request.query_params.get('to')

        if not exercise_id:
            return Response({'error': 'exercise_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            exercise = Exercise.objects.get(id=exercise_id, user=request.user)
        except Exercise.DoesNotExist:
            return Response({'error': 'exercise not found'}, status=status.HTTP_404_NOT_FOUND)

        # Build query
        qs = Workout.objects.filter(
            user=request.user,
            workout_exercises__exercise=exercise
        ).distinct().order_by('started_at').prefetch_related('workout_exercises__sets')

        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date)
                qs = qs.filter(started_at__gte=from_dt)
            except:
                pass

        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date)
                qs = qs.filter(started_at__lte=to_dt)
            except:
                pass

        # Build progress data
        from .services.prs import calculate_epley_1rm
        progress_data = []
        seen_dates = set()

        for workout in qs:
            for we in workout.workout_exercises.all():
                if we.exercise.id != exercise_id:
                    continue

                non_warmup_sets = we.sets.filter(is_warmup=False)
                date_str = workout.started_at.strftime('%Y-%m-%d')

                if metric == 'EST_1RM' and exercise.exercise_type == 'WEIGHT_REPS':
                    max_1rm = None
                    for s in non_warmup_sets:
                        if s.weight and s.reps:
                            est = calculate_epley_1rm(s.weight, s.reps)
                            if est and (max_1rm is None or est > max_1rm):
                                max_1rm = est
                    if max_1rm and date_str not in seen_dates:
                        progress_data.append({'date': date_str, 'value': float(max_1rm)})
                        seen_dates.add(date_str)

                elif metric == 'MAX_WEIGHT' and exercise.exercise_type == 'WEIGHT_REPS':
                    max_weight = None
                    for s in non_warmup_sets:
                        if s.weight:
                            if max_weight is None or s.weight > max_weight:
                                max_weight = s.weight
                    if max_weight and date_str not in seen_dates:
                        progress_data.append({'date': date_str, 'value': float(max_weight)})
                        seen_dates.add(date_str)

                elif metric == 'MAX_REPS' and exercise.exercise_type == 'BODYWEIGHT_REPS':
                    max_reps = None
                    for s in non_warmup_sets:
                        if s.reps:
                            if max_reps is None or s.reps > max_reps:
                                max_reps = s.reps
                    if max_reps and date_str not in seen_dates:
                        progress_data.append({'date': date_str, 'value': float(max_reps)})
                        seen_dates.add(date_str)

                elif metric == 'MAX_DURATION' and exercise.exercise_type == 'TIME':
                    max_duration = None
                    for s in non_warmup_sets:
                        if s.duration_seconds:
                            if max_duration is None or s.duration_seconds > max_duration:
                                max_duration = s.duration_seconds
                    if max_duration and date_str not in seen_dates:
                        progress_data.append({'date': date_str, 'value': float(max_duration)})
                        seen_dates.add(date_str)

        return Response(progress_data)
