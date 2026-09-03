from celery import shared_task

from .services import mark_completed_appointments, release_expired_reservations


@shared_task
def mark_completed_appointments_task():
    """
    Celery task to mark RESERVED appointments as DONE.
    Scheduled to run every 5 minutes via Celery Beat.
    """
    count = mark_completed_appointments()
    return f'{count} appointment(s) marked as DONE.'


@shared_task
def release_expired_reservations_task():
    count = release_expired_reservations()
    return f'{count} appointment(s) slot(s) opened.'
