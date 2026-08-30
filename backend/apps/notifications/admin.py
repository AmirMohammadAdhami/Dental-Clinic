from django.contrib import admin
from .models import Notification, ReminderSetting


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "recipient",
        "notification_type",
        "is_read",
        "created_at",
    )
    list_filter = ("is_read", "notification_type", "created_at")
    search_fields = ("title", "message", "recipient__phone")
    readonly_fields = ("created_at",)


@admin.register(ReminderSetting)
class ReminderSettingAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "sms_reminder",
        "whatsapp_reminder",
        "checkup_reminder",
        "updated_at",
    )
    list_filter = ("sms_reminder", "whatsapp_reminder", "checkup_reminder")
    search_fields = ("user__phone", "user__first_name", "user__last_name")
