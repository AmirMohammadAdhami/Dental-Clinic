from django.core.management.base import BaseCommand
from backend.apps.appointments.services import mark_completed_appointments


class Command(BaseCommand):
    help = (
        'Mark RESERVED appointments as DONE 30 minutes after their '
        'appointment time has passed.'
    )

    def handle(self, *args, **options):
        completed = mark_completed_appointments()
        self.stdout.write(self.style.SUCCESS(f'{completed} appointment(s) marked as DONE.'))
