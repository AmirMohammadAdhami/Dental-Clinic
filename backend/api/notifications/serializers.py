from rest_framework import serializers
from backend.apps.notifications.models import Notification, ReminderSetting


class NotificationSerializer(serializers.ModelSerializer):
    icon_color = serializers.CharField(read_only=True)
    time_since = serializers.CharField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "notification_type",
            "icon_color",
            "is_read",
            "link",
            "time_since",
            "created_at",
        ]


class ReminderSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReminderSetting
        fields = [
            "id",
            "sms_reminder",
            "checkup_reminder",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]
