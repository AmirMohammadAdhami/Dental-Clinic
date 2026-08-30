"""
Management command: send_upcoming_reminders
-------------------------------------------
Checks for appointments happening in the next 24 hours and sends a
reminder notification to the patient (if they have sms_reminder enabled).

Usage:
    python manage.py send_upcoming_reminders

Suggested cron (runs once every hour):
    0 * * * * cd /path/to/project && python manage.py send_upcoming_reminders
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta

from backend.apps.notifications.models import Notification, ReminderSetting


class Command(BaseCommand):
    help = "Send reminder notifications for appointments happening in the next 24 hours"

    def handle(self, *args, **options):
        from backend.apps.appointments.models import Appointment

        now = timezone.now()
        window_start = now
        window_end = now + timedelta(hours=24)

        upcoming = Appointment.objects.filter(
            status="RESERVED",
            appointment_date__gte=window_start,
            appointment_date__lte=window_end,
            patient__isnull=False,
        ).select_related("patient", "doctor__user", "service")

        sent_count = 0

        for appt in upcoming:
            # Check if patient has sms_reminder enabled
            try:
                setting = appt.patient.reminder_setting
                if not setting.sms_reminder:
                    continue
            except ReminderSetting.DoesNotExist:
                # No setting = use default (enabled)
                pass

            # Avoid duplicate reminders: skip if we already sent one today
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            already_sent = Notification.objects.filter(
                recipient=appt.patient,
                notification_type=Notification.NotificationType.CHECKUP_REMINDER,
                title="یادآوری نوبت ۲۴ ساعته ⏰",
                created_at__gte=today_start,
            ).exists()

            if already_sent:
                continue

            appt_date = appt.appointment_date
            doctor_name = str(appt.doctor.user)

            Notification.objects.create(
                recipient=appt.patient,
                title="یادآوری نوبت ۲۴ ساعته ⏰",
                message=(
                    f"یادآوری: نوبت شما با <strong>دکتر {doctor_name}</strong> "
                    f"فردا ساعت <strong>{appt_date.strftime('%H:%M')}</strong> "
                    f"است. لطفاً در وقت مقرر حضور داشته باشید."
                ),
                notification_type=Notification.NotificationType.CHECKUP_REMINDER,
                link=f"/appointments/{appt.tracking_code}/",
            )
            sent_count += 1

        self.stdout.write(
            self.style.SUCCESS(f"Done. {sent_count} reminder(s) sent.")
        )
