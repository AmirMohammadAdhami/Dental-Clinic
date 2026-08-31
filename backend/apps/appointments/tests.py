from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from backend.apps.appointments.models import Service, Appointment, DoctorReview, MedicalRecord
from backend.apps.doctors.models import Doctor

User = get_user_model()


class ServiceModelTest(TestCase):
    """Tests for Service model."""

    def test_service_str_returns_name(self):
        service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )
        self.assertEqual(str(service), 'Dental Cleaning')

    def test_service_badge_optional(self):
        service = Service.objects.create(
            name='Teeth Whitening',
            description='Professional whitening',
            badge='Popular'
        )
        self.assertEqual(service.badge, 'Popular')

    def test_service_badge_can_be_null(self):
        service = Service.objects.create(
            name='Root Canal',
            description='Root canal treatment'
        )
        self.assertIsNone(service.badge)


class MedicalRecordModelTest(TestCase):
    """Tests for MedicalRecord model."""

    def test_medical_record_str(self):
        record = MedicalRecord.objects.create(description='Diabetes')
        self.assertEqual(str(record), 'Diabetes')


class AppointmentModelTest(TestCase):
    """Tests for Appointment model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.doctor = Doctor.objects.create(
            user=self.user,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=10,
            bio='Experienced dentist',
            medical_license_number='ML12345'
        )
        self.service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )
        self.patient = User.objects.create_user(
            phone='09129999999',
            national_code='9999999999',
            first_name='Sara',
            last_name='Hosseini'
        )

    def test_appointment_save_generates_tracking_code(self):
        appointment = Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )
        self.assertIsNotNone(appointment.tracking_code)
        self.assertTrue(appointment.tracking_code.startswith('DNT-'))

    def test_appointment_tracking_code_unique(self):
        apt1 = Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )
        apt2 = Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=2),
            price=600000
        )
        self.assertNotEqual(apt1.tracking_code, apt2.tracking_code)

    def test_appointment_str(self):
        appointment = Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )
        self.assertIn(self.user.last_name, str(appointment))
        self.assertIn('DNT-', str(appointment))

    def test_appointment_default_status_pending(self):
        appointment = Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )
        self.assertEqual(appointment.status, Appointment.Status.PENDING)

    def test_appointment_status_choices(self):
        self.assertEqual(Appointment.Status.PENDING, 'PENDING')
        self.assertEqual(Appointment.Status.RESERVED, 'RESERVED')
        self.assertEqual(Appointment.Status.DONE, 'DONE')
        self.assertEqual(Appointment.Status.CANCELLED, 'CANCELLED')

    def test_appointment_without_patient(self):
        appointment = Appointment.objects.create(
            doctor=self.doctor,
            first_name='Guest',
            last_name='Patient',
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )
        self.assertIsNone(appointment.patient)
        self.assertEqual(appointment.first_name, 'Guest')

    def test_appointment_medical_records(self):
        record1 = MedicalRecord.objects.create(description='Diabetes')
        record2 = MedicalRecord.objects.create(description='Hypertension')
        appointment = Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )
        appointment.medical_records.add(record1, record2)
        self.assertEqual(appointment.medical_records.count(), 2)


class DoctorReviewModelTest(TestCase):
    """Tests for DoctorReview model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.doctor = Doctor.objects.create(
            user=self.user,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=10,
            bio='Experienced dentist',
            medical_license_number='ML12345'
        )
        self.service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )
        self.patient = User.objects.create_user(
            phone='09129999999',
            national_code='9999999999',
            first_name='Sara',
            last_name='Hosseini'
        )
        self.appointment = Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )

    def test_review_save_calculates_rating(self):
        review = DoctorReview.objects.create(
            appointment=self.appointment,
            content='Great doctor!',
            professionalism_rating=5,
            treatment_quality_rating=4,
            communication_rating=5
        )
        self.assertEqual(review.rating, (5 + 4 + 5) / 3)

    def test_review_status_choices(self):
        self.assertEqual(DoctorReview.Status.PENDING, 'PENDING')
        self.assertEqual(DoctorReview.Status.APPROVED, 'APPROVED')
        self.assertEqual(DoctorReview.Status.REJECTED, 'REJECTED')

    def test_review_str_with_patient(self):
        review = DoctorReview.objects.create(
            appointment=self.appointment,
            content='Great doctor!',
            professionalism_rating=5,
            treatment_quality_rating=4,
            communication_rating=5
        )
        self.assertEqual(str(review), 'Sara Hosseini')

    def test_review_str_without_patient(self):
        appointment = Appointment.objects.create(
            doctor=self.doctor,
            first_name='Guest',
            last_name='Patient',
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )
        review = DoctorReview.objects.create(
            appointment=appointment,
            content='Good service!',
            professionalism_rating=4,
            treatment_quality_rating=3,
            communication_rating=4
        )
        self.assertEqual(str(review), 'Guest Patient')

    def test_review_default_status_pending(self):
        review = DoctorReview.objects.create(
            appointment=self.appointment,
            content='Nice!',
            professionalism_rating=3,
            treatment_quality_rating=3,
            communication_rating=3
        )
        self.assertEqual(review.status, DoctorReview.Status.PENDING)
