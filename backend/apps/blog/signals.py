from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Comment


@receiver(pre_save, sender=Comment)
def doctor_comments(sender, instance, **kwargs):
    """Auto-approve comments written by doctors on their own articles."""
    if instance.user is None:
        return
    try:
        if hasattr(instance.user, 'doctor') and instance.user.doctor:
            instance.status = "APPROVED"
    except Exception:
        pass