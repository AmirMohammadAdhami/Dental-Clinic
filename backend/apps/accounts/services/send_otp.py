import logging
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def send_verification_code(otp, phone_number):
    subject = "Dentora Dental Clinic Verification"

    message = (
        f"Hello,\n\n"
        f"Your verification code is:\n\n"
        f"{otp}\n\n"
        f"This code will expire in 10 minutes.\n\n"
        f"If you did not request a verification code, please ignore this email."
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@dentura.ir'),
            recipient_list=[phone_number],
            fail_silently=False,
        )
    except Exception as e:
        logger.error(f"Failed to send OTP to {phone_number}: {e}")
        # Don't crash — OTP is already created in the database