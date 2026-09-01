from django.db import models
from django.utils import timezone
from ..accounts.models import User
import secrets
from django.core.validators import MinValueValidator, MaxValueValidator


# Create your models here.
class Service(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
        allow_unicode=True,
    )
    description = models.TextField()
    icon = models.ImageField(upload_to='services/icons/')
    badge = models.CharField(null=True, blank=True, max_length=25)

    def __str__(self):
        return self.name


class AppointmentSlot(models.Model):
    """
    A bookable time slot registered for a doctor by the admin/receptionist.

    Slots can be created for any date and any time of day — there is no
    fixed/default schedule. A slot becomes "booked" while an active
    appointment (PENDING/RESERVED) holds it.
    """

    doctor = models.ForeignKey(
        'doctors.Doctor',
        on_delete=models.CASCADE,
        related_name='slots',
    )
    start_time = models.DateTimeField()
    duration_minutes = models.PositiveSmallIntegerField(default=30)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        indexes = [
            models.Index(fields=['doctor', 'start_time']),
        ]

    def __str__(self):
        return f'{self.doctor} — {self.start_time:%Y-%m-%d %H:%M}'

    @property
    def is_booked(self):
        """True while an active appointment (PENDING/RESERVED) holds this slot."""
        return self.appointments.filter(
            status__in=Appointment.BLOCKING_STATUSES,
        ).exists()

    @property
    def local_start_time(self):
        """start_time in the project's local timezone (settings.TIME_ZONE)."""
        return timezone.localtime(self.start_time)


class MedicalRecord(models.Model):
    description = models.CharField(max_length=100)

    def __str__(self):
        return self.description


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", 'Pending'
        RESERVED = "RESERVED", 'Reserved'
        DONE = "DONE", 'Done'
        CANCELLED = "CANCELLED", 'Cancelled'

    doctor = models.ForeignKey('doctors.Doctor', on_delete=models.CASCADE, related_name='appointments')

    # Statuses that occupy an AppointmentSlot (used for availability checks).
    BLOCKING_STATUSES = [Status.PENDING, Status.RESERVED]

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments', null=True, blank=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    national_code = models.CharField(null=True, blank=True, max_length=10)

    tracking_code = models.CharField(max_length=20, unique=True, editable=False)

    appointment_date = models.DateTimeField()

    service = models.ForeignKey(Service, on_delete=models.DO_NOTHING, related_name='appointments')

    # The slot this appointment was booked into (null for appointments
    # created without a slot, e.g. legacy/phone bookings).
    slot = models.ForeignKey(
        'appointments.AppointmentSlot',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments',
    )

    price = models.DecimalField(max_digits=12, decimal_places=0)

    prescription_file = models.FileField(upload_to='appointments/prescriptions/', null=True, blank=True)

    prescription_text = models.TextField(blank=True, default='')

    # Patient's own notes from the finalize-information page
    # ("توضیحات تکمیلی") — distinct from prescription_text (doctor's field).
    additional_notes = models.TextField(blank=True, default='')

    # While the appointment is PENDING (not yet confirmed on the
    # finalize-information page), the held slot is released after this
    # deadline. Null once the reservation is confirmed (RESERVED).
    expires_at = models.DateTimeField(null=True, blank=True)

    medical_records = models.ManyToManyField(MedicalRecord, blank=True, related_name='appointments')

    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.tracking_code:
            self.tracking_code = self.generate_tracking_code()
        super().save(*args, **kwargs)

    @staticmethod
    def generate_tracking_code():
        return f"DNT-{secrets.token_hex(4).upper()}"

    def __str__(self):
        return f'{self.doctor.user.last_name}-{self.tracking_code}'


class DoctorReview(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='testimonials'
    )

    content = models.TextField()

    professionalism_rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ]
    )

    treatment_quality_rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ]
    )

    communication_rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ]
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    rating = models.FloatField(validators=[MinValueValidator(1), MaxValueValidator(5)], null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.rating = (self.professionalism_rating + self.treatment_quality_rating + self.communication_rating) / 3
        super().save(*args, **kwargs)

    def __str__(self):
        if self.appointment.patient:
            return (
                f"{self.appointment.patient.first_name} "
                f"{self.appointment.patient.last_name}"
            )

        return f"{self.appointment.first_name} {self.appointment.last_name}"
