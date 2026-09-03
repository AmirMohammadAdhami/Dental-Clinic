import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

app = Celery('backend')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix in settings.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')

@app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(
        300.0,
        sender.signature(
            'backend.apps.appointments.tasks.release_expired_reservations_task'
        ),
        name='release expired reservations',
    )

    sender.add_periodic_task(
        300.0,
        sender.signature(
            'backend.apps.appointments.tasks.mark_completed_appointments_task'
        ),
        name='mark completed appointments',
    )