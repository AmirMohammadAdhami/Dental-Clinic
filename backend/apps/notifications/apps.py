from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.apps.notifications'

    def ready(self):
        from backend.apps.notifications import signals
        signals._connect_medical_records_signal()
