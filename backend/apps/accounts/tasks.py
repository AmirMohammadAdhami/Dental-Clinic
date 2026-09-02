"""
Celery tasks for the accounts app.

OTP sending is offloaded to a background worker so the login view
returns instantly — the user never waits for the SMS provider.
"""

import logging
from celery import shared_task
from backend.apps.accounts.services import send_otp

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def send_otp_task(self, otp_code: str, phone_number: str):
    """Send the OTP verification code via SMS (background).

    This task is dispatched from the login view so the HTTP response
    is returned immediately.  If the SMS provider fails, the task
    retries up to 3 times with a 10-second delay between attempts.

    In development ``send_otp.send_verification_code`` just prints
    the code to the console; in production it will call the real
    SMS gateway.
    """
    try:
        send_otp.send_verification_code(otp_code, phone_number)
        logger.info("OTP sent to %s", phone_number)
    except Exception as exc:
        logger.error("Failed to send OTP to %s: %s", phone_number, exc)
        raise self.retry(exc=exc)
