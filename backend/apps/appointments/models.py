from django.db import models
from ..accounts.models import User
import secrets
from django.core.validators import MinValueValidator, MaxValueValidator


# Create your models here.
class Service(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.ImageField(upload_to='services/icons/')
    badge = models.CharField(null=True, blank=True, max_length=25)

    def __str__(self):
        return self.name


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

    patient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments', null=True, blank=True)
    first_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    national_code = models.CharField(null=True, blank=True, max_length=10)

    tracking_code = models.CharField(max_length=20, unique=True, editable=False)

    appointment_date = models.DateTimeField()

    service = models.ForeignKey(Service, on_delete=models.DO_NOTHING, related_name='appointments')

    price = models.DecimalField(max_digits=12, decimal_places=0)

    prescription_file = models.FileField(upload_to='appointments/prescriptions/', null=True, blank=True)

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
