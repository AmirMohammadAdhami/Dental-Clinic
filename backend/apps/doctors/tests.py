from django.test import TestCase
from django.contrib.auth import get_user_model
from backend.apps.doctors.models import Doctor, DoctorTestimonial, DoctorPhotos, Certificate, Assistant
from backend.apps.appointments.models import Service

User = get_user_model()


class DoctorModelTest(TestCase):
    """Tests for Doctor model."""

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

    def test_doctor_str_returns_name(self):
        self.assertEqual(str(self.doctor), 'Ali Rezaei')

    def test_doctor_save_auto_generates_slug(self):
        self.assertIsNotNone(self.doctor.slug)
        self.assertIn('ali', self.doctor.slug.lower())

    def test_doctor_slug_unique(self):
        user2 = User.objects.create_user(
            phone='09129999999',
            national_code='9999999999',
            first_name='Mohammad',
            last_name='Karimi'
        )
        doctor2 = Doctor.objects.create(
            user=user2,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=5,
            bio='Another dentist',
            medical_license_number='ML99999'
        )
        self.assertNotEqual(self.doctor.slug, doctor2.slug)

    def test_doctor_slug_when_provided(self):
        doctor = Doctor.objects.create(
            user=User.objects.create_user(
                phone='09125555555',
                national_code='5555555555',
                first_name='Test',
                last_name='Doctor'
            ),
            slug='custom-slug',
            speciality='Cardiologist',
            university='Shiraz University',
            years_of_experience=15,
            bio='Cardiologist bio',
            medical_license_number='ML55555'
        )
        self.assertEqual(doctor.slug, 'custom-slug')

    def test_doctor_services_offered(self):
        service1 = Service.objects.create(
            name='Cleaning',
            description='Dental cleaning'
        )
        service2 = Service.objects.create(
            name='Whitening',
            description='Teeth whitening'
        )
        self.doctor.services_offered.add(service1, service2)
        self.assertEqual(self.doctor.services_offered.count(), 2)

    def test_doctor_working_days_default(self):
        doctor = Doctor.objects.create(
            user=User.objects.create_user(
                phone='09126666666',
                national_code='6666666666',
                first_name='Test',
                last_name='Doctor2'
            ),
            speciality='General',
            university='Isfahan University',
            years_of_experience=3,
            bio='General doctor',
            medical_license_number='ML66666'
        )
        self.assertIn('شنبه', doctor.working_days)


class DoctorTestimonialTest(TestCase):
    """Tests for DoctorTestimonial model."""

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

    def test_doctor_can_have_one_testimonial(self):
        testimonial = DoctorTestimonial.objects.create(
            doctor=self.doctor
        )
        self.assertEqual(self.doctor.testimonial, testimonial)


class DoctorPhotosTest(TestCase):
    """Tests for DoctorPhotos model."""

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

    def test_doctor_can_have_one_photos(self):
        photos = DoctorPhotos.objects.create(
            doctor=self.doctor
        )
        self.assertEqual(self.doctor.photos, photos)


class CertificateTest(TestCase):
    """Tests for Certificate model."""

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

    def test_doctor_can_have_multiple_certificates(self):
        cert1 = Certificate.objects.create(
            doctor=self.doctor,
            date='2020-01-01',
            what='Dental Surgery',
            where='Tehran University'
        )
        cert2 = Certificate.objects.create(
            doctor=self.doctor,
            date='2021-06-15',
            what='Orthodontics',
            where='Shiraz University'
        )
        self.assertEqual(self.doctor.certificates.count(), 2)


class AssistantModelTest(TestCase):
    """Tests for Assistant model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Sara',
            last_name='Ahmadi'
        )
        self.assistant = Assistant.objects.create(
            user=self.user,
            speciality='Dental Assistant'
        )

    def test_assistant_str_returns_name(self):
        self.assertEqual(str(self.assistant), 'Sara Ahmadi')

    def test_assistant_one_to_one_with_user(self):
        user2 = User.objects.create_user(
            phone='09129999999',
            national_code='9999999999',
            first_name='Maryam',
            last_name='Hosseini'
        )
        assistant2 = Assistant.objects.create(
            user=user2,
            speciality='Nurse'
        )
        self.assertNotEqual(self.assistant.user, assistant2.user)
