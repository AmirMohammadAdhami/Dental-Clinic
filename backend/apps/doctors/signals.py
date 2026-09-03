"""
Dentura — doctors app signals.

Invalidate the server-rendered pages that embed doctor data whenever a
doctor profile changes.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver

from backend.security.cache import invalidate_doctor_detail
import logging

from .models import Doctor

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Doctor)
def doctor_post_save(sender, instance, **kwargs):
    """Doctor profile changed → refresh the doctor page + pages listing him."""
    try:
        invalidate_doctor_detail(instance.slug)
    except Exception:
        logger.exception('Failed to invalidate doctor cache for %s', instance.pk)
