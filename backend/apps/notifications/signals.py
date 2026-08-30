from django.db.models.signals import post_save, pre_save, m2m_changed
from django.dispatch import receiver
from django.utils import timezone

from .models import Notification, ReminderSetting


# ═══════════════════════════════════════════════════════════════════════
# Helper
# ═══════════════════════════════════════════════════════════════════════

def _create_notification(recipient, title, message, notification_type, link=""):
    """Shortcut to create a notification, skipping if recipient is None."""
    if recipient is None:
        return
    Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        link=link,
    )


# ═══════════════════════════════════════════════════════════════════════
# Appointment signals
# ═══════════════════════════════════════════════════════════════════════

@receiver(pre_save, sender="appointments.Appointment")
def appointment_pre_save(sender, instance, **kwargs):
    """Capture old status before save so post_save can detect transitions."""
    if not instance.pk:
        return
    try:
        old = sender.objects.get(pk=instance.pk)
        instance._old_status = old.status
    except sender.DoesNotExist:
        instance._old_status = None


@receiver(post_save, sender="appointments.Appointment")
def appointment_post_save(sender, instance, created, **kwargs):
    """
    Fires on every Appointment save.
    Detects status transitions and creates appropriate notifications.
    """
    if not instance.patient:
        return

    doctor_name = str(instance.doctor.user)

    # ── New appointment created ──────────────────────────────────────
    if created:
        _create_notification(
            recipient=instance.patient,
            title="درخواست نوبت ثبت شد",
            message=(
                f"درخواست نوبت شما با <strong>دکتر {doctor_name}</strong> "
                f"برای {instance.appointment_date.strftime('%Y/%m/%d ساعت %H:%M')} "
                f"ثبت شد. کد پیگیری: {instance.tracking_code}"
            ),
            notification_type=Notification.NotificationType.APPOINTMENT,
            link=f"/appointment/{instance.tracking_code}",
        )
        return

    # ── Status changed ───────────────────────────────────────────────
    # We use the _state.adding trick: if the status field changed, react.
    # Since post_save runs after save, we check the current status.
    old_status = getattr(instance, "_old_status", None)

    if old_status == instance.status:
        return  # no change, skip

    if instance.status == "DONE":
        _create_notification(
            recipient=instance.patient,
            title="نوبت تکمیل شد",
            message=(
                f"نوبت شما با <strong>دکتر {doctor_name}</strong> "
                f"با موفقیت تکمیل شد."
            ),
            notification_type=Notification.NotificationType.APPOINTMENT,
            link=f"/appointment/{instance.tracking_code}",
        )

    elif instance.status == "CANCELLED":
        _create_notification(
            recipient=instance.patient,
            title="نوبت لغو شد ❌",
            message=(
                f"نوبت شما با <strong>دکتر {doctor_name}</strong> "
                f"لغو شد."
            ),
            notification_type=Notification.NotificationType.APPOINTMENT,
            link=f"/appointment/{instance.tracking_code}",
        )

        # Reset appointment back to PENDING and clear patient info
        # Using .update() to avoid re-triggering post_save signal
        sender.objects.filter(pk=instance.pk).update(
            status="PENDING",
            patient=None,
            first_name=None,
            last_name=None,
            national_code=None,
        )


# ═══════════════════════════════════════════════════════════════════════
# Prescription uploaded
# ═══════════════════════════════════════════════════════════════════════

@receiver(post_save, sender="appointments.Appointment")
def prescription_uploaded(sender, instance, **kwargs):
    """Notify patient when a prescription file is uploaded."""
    if not instance.patient or not instance.prescription_file:
        return

    # Only fire when prescription_file was just set (first time or changed)
    # We track this with a flag set in the view/serializer
    if getattr(instance, "_prescription_just_uploaded", False):
        doctor_name = str(instance.doctor.user)
        _create_notification(
            recipient=instance.patient,
            title="نسخه پزشکی جدید 📄",
            message=(
                f"نسخه پزشکی جدیدی از <strong>دکتر {doctor_name}</strong> "
                f"برای شما ثبت شد."
            ),
            notification_type=Notification.NotificationType.PRESCRIPTION,
            link=f"/appointment/{instance.tracking_code}",
        )


# ═══════════════════════════════════════════════════════════════════════
# BeforeAfter gallery image
# ═══════════════════════════════════════════════════════════════════════

@receiver(post_save, sender="blog.BeforeAfter")
def before_after_post_save(sender, instance, created, **kwargs):
    """Notify patient when a before/after gallery image is uploaded."""
    if not created:
        return

    patient = instance.appointment.patient
    if not patient:
        return

    _create_notification(
        recipient=patient,
        title="عکس جدید در گالری 🖼️",
        message="عکس جدیدی در <strong>گالری قبل/بعد</strong> شما قرار گرفت.",
        notification_type=Notification.NotificationType.GALLERY,
        link=f"/appointments/{instance.appointment.tracking_code}/",
    )




# ═══════════════════════════════════════════════════════════════════════
# DoctorReview created → notify doctor
# ═══════════════════════════════════════════════════════════════════════

# @receiver(post_save, sender="appointments.DoctorReview")
# def review_post_save(sender, instance, created, **kwargs):
#     """Notify doctor when a patient leaves a review."""
#     if not created:
#         return
#
#     doctor_user = instance.appointment.doctor.user
#
#     reviewer_name = (
#         instance.appointment.patient.full_name
#         if instance.appointment.patient
#         else f"{instance.appointment.first_name} {instance.appointment.last_name}"
#     )
#
#     _create_notification(
#         recipient=doctor_user,
#         title="نظر جدید بیمار ⭐",
#         message=f"<strong>{reviewer_name}</strong> نظری درباره نوبت شما ثبت کرد.",
#         notification_type=Notification.NotificationType.GENERAL,
#         link=f"/appointments/{instance.appointment.tracking_code}/",
#     )


# ═══════════════════════════════════════════════════════════════════════
# ReminderSetting auto-creation
# ═══════════════════════════════════════════════════════════════════════

@receiver(post_save, sender="accounts.User")
def create_reminder_setting(sender, instance, created, **kwargs):
    """Auto-create default ReminderSetting when a new user registers."""
    if created:
        ReminderSetting.objects.create(user=instance)
