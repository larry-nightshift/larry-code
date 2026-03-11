from rest_framework import serializers
from .models import Exercise, Routine, RoutineItem, Workout, WorkoutExercise, WorkoutSet, PersonalRecord


class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'exercise_type', 'muscle_group', 'notes', 'is_archived', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoutineItemSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    exercise_type = serializers.CharField(source='exercise.exercise_type', read_only=True)

    class Meta:
        model = RoutineItem
        fields = [
            'id', 'exercise', 'exercise_name', 'exercise_type', 'order',
            'target_sets', 'target_reps_min', 'target_reps_max', 'target_weight',
            'rest_seconds', 'notes'
        ]
        read_only_fields = ['id', 'exercise_name', 'exercise_type']


class RoutineSerializer(serializers.ModelSerializer):
    items = RoutineItemSerializer(many=True, read_only=True)

    class Meta:
        model = Routine
        fields = ['id', 'name', 'description', 'is_archived', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        routine = Routine.objects.create(**validated_data)
        return routine

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.is_archived = validated_data.get('is_archived', instance.is_archived)
        instance.save()
        return instance


class WorkoutSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSet
        fields = [
            'id', 'set_number', 'weight', 'reps', 'duration_seconds', 'distance_meters',
            'rpe', 'is_warmup', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        workout_exercise = self.context.get('workout_exercise')
        if not workout_exercise:
            return data

        exercise = workout_exercise.exercise
        ex_type = exercise.exercise_type

        if ex_type == 'WEIGHT_REPS':
            if not data.get('weight') or not data.get('reps'):
                raise serializers.ValidationError(
                    "Weight and reps are required for WEIGHT_REPS exercises"
                )
            if data.get('weight') and data['weight'] > 2000:
                raise serializers.ValidationError("Weight cannot exceed 2000 lbs")
            if data.get('reps') and data['reps'] > 1000:
                raise serializers.ValidationError("Reps cannot exceed 1000")

        elif ex_type == 'BODYWEIGHT_REPS':
            if not data.get('reps'):
                raise serializers.ValidationError("Reps are required for BODYWEIGHT_REPS exercises")
            if data.get('weight'):
                raise serializers.ValidationError("Weight must be null for BODYWEIGHT_REPS exercises")
            if data.get('reps') and data['reps'] > 1000:
                raise serializers.ValidationError("Reps cannot exceed 1000")

        elif ex_type == 'TIME':
            if not data.get('duration_seconds'):
                raise serializers.ValidationError("Duration is required for TIME exercises")
            if data.get('duration_seconds') and data['duration_seconds'] > 21600:  # 6 hours
                raise serializers.ValidationError("Duration cannot exceed 6 hours (21600 seconds)")

        return data


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    exercise_type = serializers.CharField(source='exercise.exercise_type', read_only=True)
    sets = WorkoutSetSerializer(many=True, read_only=True)

    class Meta:
        model = WorkoutExercise
        fields = ['id', 'exercise', 'exercise_name', 'exercise_type', 'order', 'notes', 'sets']
        read_only_fields = ['id', 'exercise_name', 'exercise_type', 'sets']


class WorkoutCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workout
        fields = ['routine', 'title', 'notes']


class WorkoutDetailSerializer(serializers.ModelSerializer):
    workout_exercises = WorkoutExerciseSerializer(many=True, read_only=True)
    routine_name = serializers.CharField(source='routine.name', read_only=True)

    class Meta:
        model = Workout
        fields = [
            'id', 'routine', 'routine_name', 'title', 'started_at', 'ended_at',
            'notes', 'workout_exercises', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'routine_name', 'created_at', 'updated_at']


class WorkoutListSerializer(serializers.ModelSerializer):
    routine_name = serializers.CharField(source='routine.name', read_only=True)
    exercise_count = serializers.SerializerMethodField()

    class Meta:
        model = Workout
        fields = ['id', 'routine', 'routine_name', 'title', 'started_at', 'ended_at', 'exercise_count']
        read_only_fields = ['id']

    def get_exercise_count(self, obj):
        return obj.workout_exercises.count()


class PersonalRecordSerializer(serializers.ModelSerializer):
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    exercise_type = serializers.CharField(source='exercise.exercise_type', read_only=True)

    class Meta:
        model = PersonalRecord
        fields = [
            'id', 'exercise', 'exercise_name', 'exercise_type', 'record_type',
            'value_decimal', 'value_int', 'achieved_at', 'workout'
        ]
        read_only_fields = ['id', 'exercise_name', 'exercise_type', 'achieved_at', 'workout']
