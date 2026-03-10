from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from datetime import date, timedelta
from django.db.models import Q
from django.utils.dateparse import parse_date

from .models import Habit, HabitCheckin
from .serializers import (
    HabitSerializer,
    HabitCheckinSerializer,
    TodayHabitSerializer,
)
from .services.streaks import (
    get_completion_stats,
)


class HabitViewSet(viewsets.ModelViewSet):
    """CRUD operations for habits."""

    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter habits by current user."""
        queryset = Habit.objects.filter(user=self.request.user)

        # Filter by archived status
        archived = self.request.query_params.get("archived")
        if archived is not None:
            archived_bool = archived.lower() == "true"
            queryset = queryset.filter(is_archived=archived_bool)

        # Filter by active status
        active = self.request.query_params.get("active")
        if active is not None:
            active_bool = active.lower() == "true"
            queryset = queryset.filter(is_active=active_bool)

        return queryset

    def perform_create(self, serializer):
        """Create habit for current user."""
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        """Soft delete by archiving."""
        instance.is_archived = True
        instance.save()

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive a habit."""
        habit = self.get_object()
        habit.is_archived = True
        habit.save()
        return Response({"status": "habit archived"})

    @action(detail=True, methods=["post"])
    def unarchive(self, request, pk=None):
        """Unarchive a habit."""
        habit = self.get_object()
        habit.is_archived = False
        habit.save()
        return Response({"status": "habit unarchived"})


class HabitCheckinViewSet(viewsets.ViewSet):
    """Custom endpoint for toggling habit check-ins."""

    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        """Toggle completion for a habit on a specific date."""
        habit_id = request.data.get("habit_id")
        checkin_date_str = request.data.get("date")

        if not habit_id or not checkin_date_str:
            return Response(
                {"error": "habit_id and date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            checkin_date = parse_date(checkin_date_str)
            if not checkin_date:
                raise ValueError("Invalid date format")
        except (ValueError, TypeError):
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            habit = Habit.objects.get(id=habit_id, user=request.user)
        except Habit.DoesNotExist:
            return Response(
                {"error": "Habit not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if check-in already exists
        checkin = HabitCheckin.objects.filter(
            habit=habit, date=checkin_date
        ).first()

        if checkin:
            # Delete it (toggle off)
            checkin.delete()
            completed = False
        else:
            # Create it (toggle on)
            if checkin_date < habit.start_date:
                return Response(
                    {
                        "error": f"Cannot check-in before habit start date ({habit.start_date})"
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            HabitCheckin.objects.create(
                habit=habit, date=checkin_date, user=request.user
            )
            completed = True

        # Return updated habit with computed fields
        from .serializers import TodayHabitSerializer

        serializer = TodayHabitSerializer(habit)
        return Response(
            {**serializer.data, "completed": completed}, status=status.HTTP_200_OK
        )


class TodayView(APIView):
    """Get today's habits with completion and streak info."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get habits for a specific date (default today)."""
        date_str = request.query_params.get("date")

        if date_str:
            try:
                target_date = parse_date(date_str)
                if not target_date:
                    raise ValueError("Invalid date format")
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid date format. Use YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            target_date = date.today()

        # Get active, non-archived habits
        habits = Habit.objects.filter(
            user=request.user, is_active=True, is_archived=False, start_date__lte=target_date
        )

        serializer = TodayHabitSerializer(habits, many=True, context={"request": request})
        return Response(serializer.data)


class HabitCalendarView(APIView):
    """Get check-in calendar for a habit."""

    permission_classes = [IsAuthenticated]

    def get(self, request, habit_id):
        """Get check-in dates for a habit in a date range."""
        try:
            habit = Habit.objects.get(id=habit_id, user=request.user)
        except Habit.DoesNotExist:
            return Response(
                {"error": "Habit not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Parse date range
        from_str = request.query_params.get("from")
        to_str = request.query_params.get("to")

        if from_str:
            try:
                from_date = parse_date(from_str)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid 'from' date format"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            from_date = date.today() - timedelta(days=90)

        if to_str:
            try:
                to_date = parse_date(to_str)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid 'to' date format"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            to_date = date.today()

        # Get all check-in dates in range
        checkins = habit.checkins.filter(date__gte=from_date, date__lte=to_date)
        dates = [str(d) for d in checkins.values_list("date", flat=True).distinct()]

        return Response(
            {
                "habit_id": str(habit.id),
                "habit_name": habit.name,
                "from": str(from_date),
                "to": str(to_date),
                "dates": sorted(dates),
            }
        )


class InsightsView(APIView):
    """Get habit insights."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get insights for user's habits."""
        window_days = int(request.query_params.get("window_days", 30))
        window_days = min(window_days, 365)  # Cap at 1 year

        habits = Habit.objects.filter(
            user=request.user, is_active=True, is_archived=False
        )

        # Calculate stats for each habit
        habit_stats = []
        for habit in habits:
            stats = get_completion_stats(habit, days=window_days)
            habit_stats.append(
                {
                    "id": str(habit.id),
                    "name": habit.name,
                    "schedule_type": habit.schedule_type,
                    "completion_rate": stats["rate"],
                    "completed": stats["completed"],
                    "total": stats["total"],
                }
            )

        # Sort by completion rate
        habit_stats.sort(key=lambda x: x["completion_rate"], reverse=True)

        # Most consistent (top 3)
        most_consistent = habit_stats[:3]

        # At risk (completion rate < 50% or no check-ins in last N days)
        today = date.today()
        at_risk = []
        for stat in habit_stats:
            if stat["completion_rate"] < 50:
                at_risk.append(stat)

        at_risk = at_risk[:3]

        return Response(
            {
                "window_days": window_days,
                "most_consistent": most_consistent,
                "at_risk": at_risk,
                "total_habits": len(habit_stats),
            }
        )
