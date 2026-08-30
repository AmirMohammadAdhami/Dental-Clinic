from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.timesince import timesince


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        APPOINTMENT = "APPOINTMENT", "Appointment"
        GALLERY = "GALLERY", "Gallery"
        PRESCRIPTION = "PRESCRIPTION", "Prescription"
        CHECKUP_REMINDER = "CHECKUP_REMINDER", "Checkup Reminder"
        INVOICE = "INVOICE", "Invoice"
        GENERAL = "GENERAL", "General"

    class IconColor(models.TextChoices):
        GREEN = "green", "Green"
        BLUE = "blue", "Blue"
        ORANGE = "orange", "Orange"

    # maps notification type → icon color
    TYPE_COLOR_MAP = {
        NotificationType.APPOINTMENT: IconColor.GREEN,
        NotificationType.GALLERY: IconColor.BLUE,
        NotificationType.PRESCRIPTION: IconColor.ORANGE,
        NotificationType.CHECKUP_REMINDER: IconColor.GREEN,
        NotificationType.INVOICE: IconColor.ORANGE,
        NotificationType.GENERAL: IconColor.BLUE,
    }

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=500, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.notification_type}] {self.title} → {self.recipient}"

    @property
    def icon_color(self):
        return self.TYPE_COLOR_MAP.get(self.notification_type, self.IconColor.BLUE)

    @property
    def time_since(self):
        """Returns Persian-friendly relative time like '۱۰ دقیقه پیش'."""
        delta = timezone.now() - self.created_at

        seconds = int(delta.total_seconds())
        if seconds < 60:
            return "همین الان"
        elif seconds < 3600:
            minutes = seconds // 60
            return self._fa_number(minutes) + " دقیقه پیش"
        elif seconds < 86400:
            hours = seconds // 3600
            return self._fa_number(hours) + " ساعت پیش"
        elif seconds < 604800:  # 7 days
            days = seconds // 86400
            if days == 1:
                return "دیروز"
            return self._fa_number(days) + " روز پیش"
        elif seconds < 2592000:  # 30 days
            weeks = seconds // 604800
            return self._fa_number(weeks) + " هفته پیش"
        else:
            months = seconds // 2592000
            return self._fa_number(months) + " ماه پیش"

    @staticmethod
    def _fa_number(n):
        """Convert integer to Persian/Arabic numerals."""
        persian_digits = "۰۱۲۳۴۵۶۷۸۹"
        return str(n).translate(str.maketrans("0123456789", persian_digits))


class ReminderSetting(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reminder_setting",
    )

    sms_reminder = models.BooleanField(
        default=True,
        help_text="Send SMS reminder 24 hours before appointment",
    )
    whatsapp_reminder = models.BooleanField(
        default=True,
        help_text="Send invoice and receipt via WhatsApp",
    )
    checkup_reminder = models.BooleanField(
        default=False,
        help_text="Send reminder for 6-month periodic checkup",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Reminder settings for {self.user}"
