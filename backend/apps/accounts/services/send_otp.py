from django.conf import settings
from django.core.mail import send_mail


def send_verification_code(otp, phone_number):
    subject = "Dentora Dental Clinic Verification"

    message = (
        f"Hello,\n\n"
        f"Your verification code is:\n\n"
        f"{otp}\n\n"
        f"This code will expire in 10 minutes.\n\n"
        f"If you did not request a verification code, please ignore this email."
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[phone_number],
        fail_silently=False,
    )