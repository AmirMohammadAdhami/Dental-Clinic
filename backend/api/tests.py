from django.test import TestCase, RequestFactory, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from backend.apps.doctors.models import Doctor
from backend.apps.appointments.models import Service, Appointment
from backend.apps.blog.models import Article
from backend.api.doctor_dashboard.permissions import IsDoctorUser

User = get_user_model()

# In-memory cache so API tests don't require a running Redis (@cache_page views)
TEST_CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'test-dentura-api-cache',
        'TIMEOUT': 300,
    }
}


class IsDoctorUserPermissionTest(TestCase):
    """Tests for IsDoctorUser permission."""

    def setUp(self):
        self.factory = RequestFactory()
        self.permission = IsDoctorUser()

    def test_permission_denied_for_anonymous(self):
        request = self.factory.get('/api/doctor-dashboard/overview/')
        request.user = None
        self.assertFalse(self.permission.has_permission(request, None))

    def test_permission_denied_for_regular_user(self):
        user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890'
        )
        request = self.factory.get('/api/doctor-dashboard/overview/')
        request.user = user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_permission_granted_for_doctor(self):
        user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890'
        )
        doctor = Doctor.objects.create(
            user=user,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=10,
            bio='Experienced dentist',
            medical_license_number='ML12345'
        )
        request = self.factory.get('/api/doctor-dashboard/overview/')
        request.user = user
        self.assertTrue(self.permission.has_permission(request, None))


@override_settings(CACHES=TEST_CACHES)
class DoctorListAPITest(APITestCase):
    """Tests for DoctorListAPIView."""

    def setUp(self):
        self.client = APIClient()
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

    def test_doctor_list_get(self):
        response = self.client.get('/api/doctors/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_doctor_list_contains_expected_fields(self):
        response = self.client.get('/api/doctors/')
        doctor_data = response.data['results'][0]
        self.assertIn('slug', doctor_data)
        self.assertIn('speciality', doctor_data)
        self.assertIn('university', doctor_data)


@override_settings(CACHES=TEST_CACHES)
class ServiceListAPITest(APITestCase):
    """Tests for ServiceListApiView."""

    def setUp(self):
        self.client = APIClient()
        self.service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )

    def test_service_list_get(self):
        response = self.client.get('/api/services/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_service_list_contains_name(self):
        response = self.client.get('/api/services/')
        service_data = response.data['results'][0]
        self.assertEqual(service_data['name'], 'Dental Cleaning')


@override_settings(CACHES=TEST_CACHES)
class DoctorDashboardOverviewAPITest(APITestCase):
    """Tests for DoctorDashboardOverviewView."""

    def setUp(self):
        self.client = APIClient()
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

    def test_overview_requires_authentication(self):
        response = self.client.get('/api/doctor-dashboard/overview/')
        # DRF returns 403 by default for unauthenticated requests
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_overview_requires_doctor_role(self):
        self.client.force_authenticate(user=self.user)
        # User is not a doctor yet
        user2 = User.objects.create_user(
            phone='09129999999',
            national_code='9999999999'
        )
        self.client.force_authenticate(user=user2)
        response = self.client.get('/api/doctor-dashboard/overview/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_overview_returns_data_for_doctor(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/doctor-dashboard/overview/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_patients', response.data)
        self.assertIn('total_appointments_year', response.data)
        self.assertIn('average_rating', response.data)
        self.assertIn('published_articles_count', response.data)


@override_settings(CACHES=TEST_CACHES)
class DoctorAppointmentsListAPITest(APITestCase):
    """Tests for DoctorAppointmentsListView."""

    def setUp(self):
        self.client = APIClient()
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

    def test_appointments_list_requires_authentication(self):
        response = self.client.get('/api/doctor-dashboard/appointments/')
        # DRF returns 403 by default for unauthenticated requests
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_appointments_list_returns_data(self):
        Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/doctor-dashboard/appointments/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_appointments_list_filter_by_status(self):
        Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000,
            status='PENDING'
        )
        Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=2),
            price=600000,
            status='DONE'
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/doctor-dashboard/appointments/?status=PENDING')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


@override_settings(CACHES=TEST_CACHES)
class DoctorDashboardProfileAPITest(APITestCase):
    """Tests for DoctorProfileView."""

    def setUp(self):
        self.client = APIClient()
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

    def test_profile_requires_authentication(self):
        response = self.client.get('/api/doctor-dashboard/profile/')
        # DRF returns 403 by default for unauthenticated requests
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_profile_returns_data(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/doctor-dashboard/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('speciality', response.data)
        self.assertIn('full_name', response.data)

    def test_profile_update(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.put(
            '/api/doctor-dashboard/profile/',
            {'bio': 'Updated bio', 'years_of_experience': 15},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.doctor.refresh_from_db()
        self.assertEqual(self.doctor.bio, 'Updated bio')
        self.assertEqual(self.doctor.years_of_experience, 15)


@override_settings(CACHES=TEST_CACHES)
class UserDashboardAPITest(APITestCase):
    """Tests for UserDashboardAPIView."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )

    def test_dashboard_requires_authentication(self):
        response = self.client.get('/api/dashboard/me/')
        # DRF returns 403 by default for unauthenticated requests
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_dashboard_returns_user_data(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/dashboard/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('full_name', response.data)
        self.assertIn('phone', response.data)
        self.assertIn('appointments', response.data)
