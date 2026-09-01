from django.core.management.base import BaseCommand
from backend.apps.appointments.services import release_expired_reservations


class Command(BaseCommand):
    help = (
        'Release PENDING appointment reservations whose 30-minute window '
        'expired, making their slots available again.'
    )

    def handle(self, *args, **options):
        released = release_expired_reservations()
        self.stdout.write(self.style.SUCCESS(f'{released} expired reservation(s) released.'))
