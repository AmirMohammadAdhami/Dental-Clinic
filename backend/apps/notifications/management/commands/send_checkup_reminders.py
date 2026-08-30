"""
Management command: send_checkup_reminders
------------------------------------------
Checks for patients whose last completed appointment was ~6 months ago
and sends a checkup reminder notification (if they have checkup_reminder enabled).

Usage:
    python manage.py send_checkup_reminders

Suggested cron (runs once daily at 9 AM):
    0 9 * * * cd /path/to/project && python manage.py send_checkup_reminders
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from backend.apps.notifications.models import Notification, ReminderSetting


class Command(BaseCommand):
    help = "Send checkup reminders to patients whose last appointment was ~6 months ago"

    def handle(self, *args, **options):
        from backend.apps.appointments.models import Appointment

        now = timezone.now()

        # We look for patients whose most recent DONE appointment was
        # between 175-190 days ago (~6 months, with a small window).
        six_months_ago_start = now - timedelta(days=190)
        six_months_ago_end = now - timedelta(days=175)

        # Find all patients with a DONE appointment in that window
        recent_done = (
            Appointment.objects.filter(
                status="DONE",
                appointment_date__gte=six_months_ago_start,
                appointment_date__lte=six_months_ago_end,
                patient__isnull=False,
            )
            .select_related("patient", "doctor__user")
            .order_by("patient", "-appointment_date")
            .distinct("patient")
        )

        sent_count = 0

        for appt in recent_done:
            patient = appt.patient

            # Check if patient has checkup_reminder enabled
            try:
                setting = patient.reminder_setting
                if not setting.checkup_reminder:
                    continue
            except ReminderSetting.DoesNotExist:
                # No setting = use default (disabled for checkup)
                continue

            # Avoid duplicate reminders: skip if we already sent one in the last 30 days
            thirty_days_ago = now - timedelta(days=30)
            already_sent = Notification.objects.filter(
                recipient=patient,
                notification_type=Notification.NotificationType.CHECKUP_REMINDER,
                title__contains="چکاپ دوره‌ای",
                created_at__gte=thirty_days_ago,
            ).exists()

            if already_sent:
                continue

            doctor_name = str(appt.doctor.user)

            Notification.objects.create(
                recipient=patient,
                title="یادآوری چکاپ دوره‌ای 🩺",
                message=(
                    f"یادآوری: آخرین درمان شما با <strong>دکتر {doctor_name}</strong> "
                    f"حدود ۶ ماه پیش بود. زمان چکاپ دوره‌ای فرا رسیده است."
                ),
                notification_type=Notification.NotificationType.CHECKUP_REMINDER,
                link="/",
            )
            sent_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Done. {sent_count} checkup reminder(s) sent.")
        )
