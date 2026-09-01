"""Business-logic services for the appointments app."""
from datetime import timedelta

from django.utils import timezone

from backend.api.constants import RESERVATION_TTL_MINUTES
from .models import Appointment


def release_expired_reservations():
    """
    Release PENDING reservations whose 30-minute window has passed:
    they become CANCELLED and their slot becomes available again.

    Called lazily by the booking/availability/appointment-detail APIs and
    available as the `release_expired_reservations` management command for
    scheduled setups.
    """
    expired = Appointment.objects.filter(
        status=Appointment.Status.PENDING,
        expires_at__isnull=False,
        expires_at__lt=timezone.now(),
    )
    count = expired.update(status=Appointment.Status.CANCELLED, slot=None)
    return count


def mark_completed_appointments():
    """
    Mark RESERVED appointments as DONE 30 minutes after their
    appointment_date has passed.

    Available as the `mark_completed_appointments` management command
    for scheduled setups (e.g. cron every 5 minutes).
    """
    cutoff = timezone.now() - timedelta(minutes=30)
    done = Appointment.objects.filter(
        status=Appointment.Status.RESERVED,
        appointment_date__lt=cutoff,
    )
    count = done.update(status=Appointment.Status.DONE)
    return count
