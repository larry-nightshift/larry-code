"""Streak calculation service for habits."""

from datetime import date, timedelta
from django.db.models import Q


def get_all_checkins_for_habit(habit, from_date=None, to_date=None):
    """Get all check-in dates for a habit, optionally within a date range."""
    checkins = habit.checkins.all()

    if from_date:
        checkins = checkins.filter(date__gte=from_date)
    if to_date:
        checkins = checkins.filter(date__lte=to_date)

    return sorted(set(checkins.values_list("date", flat=True)))


def get_completion_for_date(habit, target_date):
    """Check if habit has a check-in on a specific date."""
    return habit.checkins.filter(date=target_date).exists()


def calculate_current_streak(habit, today):
    """Calculate current streak for a habit (stops at first gap)."""
    if habit.schedule_type == "DAILY":
        return _calculate_daily_streak(habit, today)
    else:  # WEEKLY
        return _calculate_weekly_streak(habit, today)


def _calculate_daily_streak(habit, today):
    """Calculate daily streak: consecutive days with check-ins."""
    checkins = get_all_checkins_for_habit(habit)
    checkin_set = set(checkins)

    # Start from today and go backwards
    current_date = today
    streak = 0

    # Go backwards until we hit a gap
    while current_date >= habit.start_date:
        if current_date in checkin_set:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            # If we haven't found any checkins yet, keep looking back
            if streak == 0:
                current_date -= timedelta(days=1)
            else:
                # Gap found, stop
                break

    return streak


def _calculate_weekly_streak(habit, today):
    """Calculate weekly streak: consecutive weeks meeting weekly target."""
    from datetime import datetime, timezone

    checkins = get_all_checkins_for_habit(habit)

    if not checkins:
        return 0

    # Use ISO week (Monday=0, Sunday=6)
    current_date = today
    streak = 0

    # Go backwards by weeks
    while True:
        # Get Monday of the current week (ISO week)
        monday = current_date - timedelta(days=current_date.weekday())

        # Get all check-ins in this week
        week_checkins = [d for d in checkins if monday <= d <= monday + timedelta(days=6)]

        if len(week_checkins) >= habit.weekly_target:
            streak += 1
            # Move to the previous week
            current_date = monday - timedelta(days=1)
        else:
            # Target not met, streak ends
            break

        # Stop if we've gone before the habit's start date
        if monday < habit.start_date:
            break

    return streak


def calculate_best_streak(habit, max_lookback_days=365):
    """Calculate the longest streak ever for a habit."""
    from datetime import date as date_class

    today = date_class.today()
    lookback_date = today - timedelta(days=max_lookback_days)
    from_date = max(lookback_date, habit.start_date)

    checkins = get_all_checkins_for_habit(habit, from_date=from_date, to_date=today)

    if not checkins:
        return 0

    if habit.schedule_type == "DAILY":
        return _calculate_best_daily_streak(habit, checkins)
    else:  # WEEKLY
        return _calculate_best_weekly_streak(habit, checkins)


def _calculate_best_daily_streak(habit, checkins):
    """Find longest consecutive sequence of check-in dates."""
    if not checkins:
        return 0

    checkin_set = set(checkins)
    best_streak = 0
    current_streak = 0
    current_date = checkins[0]

    for checkin_date in checkins:
        if current_date is None:
            current_date = checkin_date
            current_streak = 1
        elif checkin_date == current_date + timedelta(days=1):
            # Consecutive
            current_streak += 1
            current_date = checkin_date
        else:
            # Gap found
            best_streak = max(best_streak, current_streak)
            current_streak = 1
            current_date = checkin_date

    # Don't forget the last streak
    best_streak = max(best_streak, current_streak)
    return best_streak


def _calculate_best_weekly_streak(habit, checkins):
    """Find longest sequence of weeks meeting target."""
    if not checkins:
        return 0

    # Group check-ins by ISO week
    weeks = {}
    for checkin_date in checkins:
        monday = checkin_date - timedelta(days=checkin_date.weekday())
        week_key = monday.isocalendar()[:2]  # (year, week_number)
        if week_key not in weeks:
            weeks[week_key] = 0
        weeks[week_key] += 1

    # Find longest consecutive sequence of weeks meeting target
    best_streak = 0
    current_streak = 0
    last_week_key = None

    for week_key in sorted(weeks.keys()):
        if weeks[week_key] >= habit.weekly_target:
            if (
                last_week_key is None
                or (week_key[0], week_key[1]) == (last_week_key[0], last_week_key[1] + 1)
                or (week_key[0], week_key[1])
                == (last_week_key[0] + 1, 1)  # Year boundary
            ):
                current_streak += 1
            else:
                best_streak = max(best_streak, current_streak)
                current_streak = 1
            last_week_key = week_key
        else:
            best_streak = max(best_streak, current_streak)
            current_streak = 0
            last_week_key = None

    best_streak = max(best_streak, current_streak)
    return best_streak


def get_week_progress(habit, today):
    """Get current week progress for a weekly habit."""
    # Get Monday of the current week
    monday = today - timedelta(days=today.weekday())

    # Get all check-ins in this week
    week_checkins = habit.checkins.filter(
        date__gte=monday, date__lte=monday + timedelta(days=6)
    ).count()

    return {
        "completed": week_checkins,
        "target": habit.weekly_target,
        "display": f"{week_checkins}/{habit.weekly_target}",
    }


def get_completion_stats(habit, days=30):
    """Get completion rate for a habit over a time period."""
    from datetime import date as date_class

    today = date_class.today()
    start_date = max(today - timedelta(days=days), habit.start_date)

    total_days = (today - start_date).days + 1
    checkins = habit.checkins.filter(date__gte=start_date, date__lte=today).count()

    return {
        "completed": checkins,
        "total": total_days,
        "rate": round((checkins / total_days) * 100, 1) if total_days > 0 else 0,
    }
