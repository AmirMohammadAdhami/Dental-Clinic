from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta
from backend.apps.accounts.models import OTPCode

User = get_user_model()


class UserManagerTest(TestCase):
    """Tests for UserManager."""

    def test_create_user_success(self):
        user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.assertEqual(user.phone, '09121234567')
        self.assertEqual(user.national_code, '1234567890')
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_without_phone_raises_error(self):
        with self.assertRaises(ValueError) as cm:
            User.objects.create_user(
                phone='',
                national_code='1234567890'
            )
        self.assertIn('Phone number is required', str(cm.exception))

    def test_create_user_without_national_code_raises_error(self):
        with self.assertRaises(ValueError) as cm:
            User.objects.create_user(
                phone='09121234567',
                national_code=''
            )
        self.assertIn('National code is required', str(cm.exception))

    def test_create_user_sets_unusable_password(self):
        user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890'
        )
        self.assertFalse(user.has_usable_password())

    def test_create_superuser(self):
        user = User.objects.create_superuser(
            phone='09121234567',
            national_code='1234567890'
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)

    def test_create_user_unique_phone(self):
        User.objects.create_user(
            phone='09121234567',
            national_code='1111111111'
        )
        with self.assertRaises(Exception):
            User.objects.create_user(
                phone='09121234567',
                national_code='2222222222'
            )

    def test_create_user_unique_national_code(self):
        User.objects.create_user(
            phone='09121234567',
            national_code='1234567890'
        )
        with self.assertRaises(Exception):
            User.objects.create_user(
                phone='09129999999',
                national_code='1234567890'
            )


class UserModelTest(TestCase):
    """Tests for User model."""

    def test_user_str_returns_full_name(self):
        user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.assertEqual(str(user), 'Ali Rezaei')

    def test_user_save_auto_generates_full_name(self):
        user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.assertEqual(user.full_name, 'Ali Rezaei')

    def test_user_full_name_updates_on_save(self):
        user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        user.first_name = 'Mohammad'
        user.save()
        self.assertEqual(user.full_name, 'Mohammad Rezaei')

    def test_user_username_field_is_phone(self):
        self.assertEqual(User.USERNAME_FIELD, 'phone')

    def test_user_required_fields(self):
        self.assertIn('national_code', User.REQUIRED_FIELDS)
        self.assertIn('first_name', User.REQUIRED_FIELDS)
        self.assertIn('last_name', User.REQUIRED_FIELDS)

    def test_user_default_is_active(self):
        user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890'
        )
        self.assertTrue(user.is_active)

    def test_user_default_is_staff_false(self):
        user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890'
        )
        self.assertFalse(user.is_staff)


class OTPCodeTest(TestCase):
    """Tests for OTPCode model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890'
        )
        self.otp = OTPCode.objects.create(
            phone_number='09121234567',
            code='12345',
            expires_at=timezone.now() + timedelta(minutes=5)
        )

    def test_otp_is_valid_when_not_expired_not_used_under_attempts(self):
        self.assertTrue(self.otp.is_valid())

    def test_otp_is_expired(self):
        otp = OTPCode.objects.create(
            phone_number='09121234567',
            code='12345',
            expires_at=timezone.now() - timedelta(minutes=1)
        )
        self.assertTrue(otp.is_expired())
        self.assertFalse(otp.is_valid())

    def test_otp_is_used(self):
        self.otp.is_used = True
        self.otp.save()
        self.assertFalse(self.otp.is_valid())

    def test_otp_max_attempts_reached(self):
        self.otp.attempts = OTPCode.MAX_ATTEMPTS
        self.otp.save()
        self.assertFalse(self.otp.is_valid())

    def test_otp_attempts_below_max_is_valid(self):
        self.otp.attempts = OTPCode.MAX_ATTEMPTS - 1
        self.otp.save()
        self.assertTrue(self.otp.is_valid())

    def test_otp_max_attempts_constant(self):
        self.assertEqual(OTPCode.MAX_ATTEMPTS, 5)



