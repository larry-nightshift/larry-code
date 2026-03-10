"""Recurrence calculation and status logic for maintenance tasks."""

from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from maintenance.models import MaintenanceTask


def compute_next_due_date(task: MaintenanceTask, from_date: date = None) -> date:
    """
    Compute the next due date for a maintenance task.

    Args:
        task: MaintenanceTask instance
        from_date: Reference date for calculation (defaults to task.start_date)

    Returns:
        Calculated next due date
    """
    if from_date is None:
        from_date = task.start_date

    # Add interval based on recurrence type
    if task.recurrence_type == MaintenanceTask.RECURRENCE_EVERY_N_DAYS:
        delta = timedelta(days=task.interval)
        next_due = from_date + delta
    elif task.recurrence_type == MaintenanceTask.RECURRENCE_EVERY_N_WEEKS:
        delta = timedelta(weeks=task.interval)
        next_due = from_date + delta
    elif task.recurrence_type == MaintenanceTask.RECURRENCE_EVERY_N_MONTHS:
        next_due = from_date + relativedelta(months=task.interval)
    elif task.recurrence_type == MaintenanceTask.RECURRENCE_EVERY_N_YEARS:
        next_due = from_date + relativedelta(years=task.interval)
    else:
        raise ValueError(f"Unknown recurrence type: {task.recurrence_type}")

    return next_due


def compute_next_due_date_from_strategy(task: MaintenanceTask, today: date = None) -> date:
    """
    Compute next due date based on task strategy.

    If FROM_START_DATE: compute schedule anchored at start_date and advance until >= today.
    If FROM_LAST_COMPLETION: compute from last completion date.

    Args:
        task: MaintenanceTask instance
        today: Reference date (defaults to today)

    Returns:
        Calculated next due date
    """
    if today is None:
        today = date.today()

    if task.due_strategy == MaintenanceTask.STRATEGY_FROM_LAST_COMPLETION:
        # Calculate from last completion date if it exists
        if task.last_completed_date:
            return compute_next_due_date(task, task.last_completed_date)
        # Otherwise fall back to start date
        return compute_next_due_date(task, task.start_date)

    elif task.due_strategy == MaintenanceTask.STRATEGY_FROM_START_DATE:
        # Calculate schedule anchored at start_date, advance until >= today
        next_due = compute_next_due_date(task, task.start_date)

        # Keep advancing until next_due >= today
        while next_due < today:
            next_due = compute_next_due_date(task, next_due)

        return next_due

    else:
        raise ValueError(f"Unknown strategy: {task.due_strategy}")


def compute_status(next_due: date, today: date = None, grace_days: int = 0) -> str:
    """
    Compute task status based on due date and grace period.

    Status values:
    - OVERDUE: today > next_due
    - DUE_SOON: today >= (next_due - grace_days) AND today <= next_due
    - UPCOMING: within next 30 days but not due soon
    - SCHEDULED: further out

    Args:
        next_due: The next due date
        today: Reference date (defaults to today)
        grace_days: Number of days before due to show as "due soon"

    Returns:
        Status string
    """
    if today is None:
        today = date.today()

    if today > next_due:
        return "OVERDUE"

    grace_threshold = next_due - timedelta(days=grace_days)
    if today >= grace_threshold and today <= next_due:
        return "DUE_SOON"

    thirty_days_out = today + timedelta(days=30)
    if next_due <= thirty_days_out:
        return "UPCOMING"

    return "SCHEDULED"
