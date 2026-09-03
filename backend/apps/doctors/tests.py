from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from backend.apps.doctors.models import Doctor, DoctorTestimonial, DoctorPhotos, Certificate, Assistant
from backend.apps.appointments.models import Service, Appointment, DoctorReview

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


# In-memory cache so the SSR page-cache tests run without Redis
TEST_CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'test-dentura-doctors-cache',
        'TIMEOUT': 300,
    }
}


@override_settings(CACHES=TEST_CACHES)
class PublicPageSSRTest(TestCase):
    """Server-rendered doctors pages (hybrid SSR migration): raw HTML must
    contain the SEO-critical content + data-ssr markers."""

    def setUp(self):
        from django.core.cache import cache
        cache.clear()  # isolate the deterministic page cache between tests
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
        self.doctor.services_offered.add(self.service)

    def test_team_page_renders_doctor_cards_and_filters(self):
        response = self.client.get('/doctors/')
        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        self.assertIn('Ali Rezaei', html)
        self.assertIn('Dentist', html)
        self.assertIn('id="teamGrid"', html)
        self.assertIn('data-ssr="1"', html)
        # Service pill server-rendered
        self.assertIn('data-filter="Dental Cleaning"', html)

    def test_doctor_detail_renders_profile_and_jsonld(self):
        response = self.client.get('/doctors/' + self.doctor.slug + '/')
        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        # Hero name server-rendered
        self.assertIn('Ali Rezaei', html)
        self.assertIn('Dentist', html)
        self.assertIn('Experienced dentist', html)
        # Physician JSON-LD server-rendered
        self.assertIn('Physician', html)
        # SSR markers
        self.assertIn('data-ssr="1"', html)

    def test_doctor_detail_404_for_unknown_slug(self):
        response = self.client.get('/doctors/no-such-doctor/')
        self.assertEqual(response.status_code, 404)

    def test_doctor_detail_shows_reviews(self):
        patient = User.objects.create_user(
            phone='09123334455', national_code='3344556677',
            first_name='Nima', last_name='Karimi'
        )
        appointment = Appointment.objects.create(
            doctor=self.doctor, patient=patient, service=self.service,
            appointment_date=timezone.now() + timedelta(days=1), price=1000000,
        )
        DoctorReview.objects.create(
            appointment=appointment,
            professionalism_rating=5, treatment_quality_rating=5,
            communication_rating=4, status=DoctorReview.Status.APPROVED,
            content='Fantastic doctor!',
        )
        response = self.client.get('/doctors/' + self.doctor.slug + '/')
        html = response.content.decode()
        self.assertIn('Fantastic doctor!', html)
