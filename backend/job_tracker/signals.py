from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import Application, Activity


@receiver(pre_save, sender=Application)
def track_status_change(sender, instance, **kwargs):
    """Track the old status before save."""
    if instance.pk:
        try:
            old_instance = Application.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except Application.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Application)
def create_status_change_activity(sender, instance, created, **kwargs):
    """Auto-create Activity entry when status changes."""
    # Skip if this is a new application
    if created:
        return

    old_status = getattr(instance, "_old_status", None)

    # Only create if status actually changed
    if old_status and old_status != instance.status:
        old_display = dict(Application.STATUS_CHOICES).get(old_status, old_status)
        new_display = instance.get_status_display()
        title = f"Status changed: {old_display} → {new_display}"

        Activity.objects.create(
            user=instance.user,
            application=instance,
            activity_type=Activity.TYPE_NOTE,
            title=title,
            is_system=True,
            activity_date=timezone.now(),
        )
