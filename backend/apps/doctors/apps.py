from django.apps import AppConfig


class DoctorsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'backend.apps.doctors'

    def ready(self):
        from backend.apps.doctors import signals  # noqa: F401
