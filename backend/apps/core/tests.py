from django.test import TestCase, override_settings
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from backend.apps.doctors.models import Doctor, Assistant
from backend.apps.appointments.models import Service, Appointment, DoctorReview
from backend.apps.blog.models import Article, ArticleMedia

User = get_user_model()

# In-memory cache so page-cache tests run without Redis
TEST_CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'test-dentura-cache',
        'TIMEOUT': 300,
    }
}


@override_settings(CACHES=TEST_CACHES)
class HomePageSSRTest(TestCase):
    """The home page must server-render SEO-critical content (doctors,
    assistants, before/after, testimonials, video cards) with data-ssr markers."""

    def setUp(self):
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
        self.assistant_user = User.objects.create_user(
            phone='09121112233',
            national_code='1122334455',
            first_name='Sara',
            last_name='Ahmadi'
        )
        self.assistant = Assistant.objects.create(
            user=self.assistant_user,
            speciality='Dental Assistant',
            blog_photo=SimpleUploadedFile('ast.jpg', b'x' * 100, content_type='image/jpeg'),
        )

    def test_home_renders_doctor_and_assistant_cards(self):
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        # Doctor name + university server-rendered (SEO critical)
        self.assertIn('Ali Rezaei', html)
        self.assertIn('Tehran University', html)
        # Assistant server-rendered
        self.assertIn('Sara Ahmadi', html)
        # SSR markers
        self.assertIn('data-ssr="1"', html)
        self.assertIn('id="doctorsTrack"', html)
        self.assertIn('id="assistantsTrack"', html)

    def test_home_renders_service_name_and_review(self):
        service = Service.objects.create(
            name='Laminate', description='Laminate treatment'
        )
        patient = User.objects.create_user(
            phone='09123334455', national_code='3344556677',
            first_name='Nima', last_name='Karimi'
        )
        appointment = Appointment.objects.create(
            doctor=self.doctor, patient=patient, service=service,
            appointment_date=timezone.now() + timedelta(days=1), price=1000000,
        )
        DoctorReview.objects.create(
            appointment=appointment,
            professionalism_rating=5, treatment_quality_rating=5,
            communication_rating=4, status=DoctorReview.Status.APPROVED,
            content='Great treatment!',
        )
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        self.assertIn('Great treatment!', html)
        self.assertIn('Nima Karimi', html)

    def test_home_second_hit_served_from_cache(self):
        response1 = self.client.get('/')
        # Mutate data WITHOUT invalidation — the cached page must still serve
        # the old HTML (proves the deterministic page cache is in play).
        self.assistant.speciality = 'Senior Nurse'
        self.assistant.save()
        response2 = self.client.get('/')
        self.assertEqual(response1.content, response2.content)
