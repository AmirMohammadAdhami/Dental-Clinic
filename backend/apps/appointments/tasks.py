from celery import shared_task

from .services import mark_completed_appointments


@shared_task
def mark_completed_appointments_task():
    """
    Celery task to mark RESERVED appointments as DONE.
    Scheduled to run every 5 minutes via Celery Beat.
    """
    count = mark_completed_appointments()
    return f'{count} appointment(s) marked as DONE.'
