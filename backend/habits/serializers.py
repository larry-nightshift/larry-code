from rest_framework import serializers
from datetime import date
from .models import Habit, HabitCheckin


class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = [
            "id",
            "name",
            "description",
            "schedule_type",
            "weekly_target",
            "start_date",
            "is_active",
            "is_archived",
            "color",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, data):
        """Validate weekly_target based on schedule_type."""
        schedule_type = data.get("schedule_type")
        weekly_target = data.get("weekly_target")

        if schedule_type == Habit.SCHEDULE_WEEKLY:
            if weekly_target is None:
                raise serializers.ValidationError(
                    {"weekly_target": "Weekly target is required for weekly habits"}
                )
            if not (1 <= weekly_target <= 7):
                raise serializers.ValidationError(
                    {"weekly_target": "Weekly target must be between 1 and 7"}
                )
        elif schedule_type == Habit.SCHEDULE_DAILY and weekly_target is not None:
            # Clear weekly_target for daily habits
            data["weekly_target"] = None

        return data


class HabitCheckinSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitCheckin
        fields = ["id", "habit", "date", "created_at"]
        read_only_fields = ["id", "created_at"]


class TodayHabitSerializer(serializers.ModelSerializer):
    """Extended serializer for Today view with computed fields."""

    completed_today = serializers.SerializerMethodField()
    current_streak = serializers.SerializerMethodField()
    best_streak = serializers.SerializerMethodField()
    week_progress = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = [
            "id",
            "name",
            "description",
            "schedule_type",
            "weekly_target",
            "start_date",
            "is_active",
            "is_archived",
            "color",
            "completed_today",
            "current_streak",
            "best_streak",
            "week_progress",
            "created_at",
            "updated_at",
        ]

    def get_completed_today(self, obj):
        """Check if habit is completed today."""
        from .services.streaks import get_completion_for_date

        return get_completion_for_date(obj, date.today())

    def get_current_streak(self, obj):
        """Get current streak."""
        from .services.streaks import calculate_current_streak

        return calculate_current_streak(obj, date.today())

    def get_best_streak(self, obj):
        """Get best streak."""
        from .services.streaks import calculate_best_streak

        return calculate_best_streak(obj)

    def get_week_progress(self, obj):
        """Get weekly progress (only for weekly habits)."""
        if obj.schedule_type != Habit.SCHEDULE_WEEKLY:
            return None

        from .services.streaks import get_week_progress

        return get_week_progress(obj, date.today())
