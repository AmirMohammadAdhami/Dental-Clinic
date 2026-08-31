from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from backend.apps.notifications.models import Notification, ReminderSetting

User = get_user_model()


class NotificationModelTest(TestCase):
    """Tests for Notification model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )

    def test_notification_str(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test Notification',
            message='This is a test notification'
        )
        self.assertIn('Test Notification', str(notification))
        self.assertIn(str(self.user), str(notification))

    def test_notification_default_type_general(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test',
            message='Test message'
        )
        self.assertEqual(notification.notification_type, Notification.NotificationType.GENERAL)

    def test_notification_type_choices(self):
        self.assertEqual(Notification.NotificationType.APPOINTMENT, 'APPOINTMENT')
        self.assertEqual(Notification.NotificationType.GALLERY, 'GALLERY')
        self.assertEqual(Notification.NotificationType.PRESCRIPTION, 'PRESCRIPTION')
        self.assertEqual(Notification.NotificationType.CHECKUP_REMINDER, 'CHECKUP_REMINDER')
        self.assertEqual(Notification.NotificationType.INVOICE, 'INVOICE')
        self.assertEqual(Notification.NotificationType.GENERAL, 'GENERAL')

    def test_notification_icon_color_choices(self):
        self.assertEqual(Notification.IconColor.GREEN, 'green')
        self.assertEqual(Notification.IconColor.BLUE, 'blue')
        self.assertEqual(Notification.IconColor.ORANGE, 'orange')

    def test_notification_icon_color_property(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Appointment',
            message='You have an appointment',
            notification_type=Notification.NotificationType.APPOINTMENT
        )
        self.assertEqual(notification.icon_color, 'green')

    def test_notification_icon_color_default_blue(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='General',
            message='General notification'
        )
        self.assertEqual(notification.icon_color, 'blue')

    def test_notification_is_read_default_false(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test',
            message='Test message'
        )
        self.assertFalse(notification.is_read)

    def test_notification_ordering(self):
        notif1 = Notification.objects.create(
            recipient=self.user,
            title='First',
            message='First notification',
            created_at=timezone.now() - timedelta(hours=1)
        )
        notif2 = Notification.objects.create(
            recipient=self.user,
            title='Second',
            message='Second notification',
            created_at=timezone.now()
        )
        notifications = list(Notification.objects.filter(recipient=self.user))
        self.assertEqual(notifications[0], notif2)
        self.assertEqual(notifications[1], notif1)

    def test_notification_time_since_just_now(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test',
            message='Test message'
        )
        self.assertEqual(notification.time_since, 'همین الان')

    def test_notification_time_since_minutes(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test',
            message='Test message'
        )
        Notification.objects.filter(pk=notification.pk).update(
            created_at=timezone.now() - timedelta(minutes=10)
        )
        notification.refresh_from_db()
        self.assertIn('دقیقه پیش', notification.time_since)

    def test_notification_time_since_hours(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test',
            message='Test message'
        )
        Notification.objects.filter(pk=notification.pk).update(
            created_at=timezone.now() - timedelta(hours=2)
        )
        notification.refresh_from_db()
        self.assertIn('ساعت پیش', notification.time_since)

    def test_notification_time_since_yesterday(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test',
            message='Test message'
        )
        Notification.objects.filter(pk=notification.pk).update(
            created_at=timezone.now() - timedelta(days=1)
        )
        notification.refresh_from_db()
        self.assertEqual(notification.time_since, 'دیروز')

    def test_notification_time_since_days(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test',
            message='Test message'
        )
        Notification.objects.filter(pk=notification.pk).update(
            created_at=timezone.now() - timedelta(days=3)
        )
        notification.refresh_from_db()
        self.assertIn('روز پیش', notification.time_since)

    def test_notification_time_since_weeks(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test',
            message='Test message'
        )
        Notification.objects.filter(pk=notification.pk).update(
            created_at=timezone.now() - timedelta(weeks=2)
        )
        notification.refresh_from_db()
        self.assertIn('هفته پیش', notification.time_since)

    def test_notification_time_since_months(self):
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test',
            message='Test message'
        )
        Notification.objects.filter(pk=notification.pk).update(
            created_at=timezone.now() - timedelta(days=60)
        )
        notification.refresh_from_db()
        self.assertIn('ماه پیش', notification.time_since)

    def test_notification_fa_number(self):
        self.assertEqual(Notification._fa_number(1), '۱')
        self.assertEqual(Notification._fa_number(10), '۱۰')
        self.assertEqual(Notification._fa_number(99), '۹۹')


class ReminderSettingTest(TestCase):
    """Tests for ReminderSetting model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        # ReminderSetting is auto-created by signal on user creation
        self.setting = ReminderSetting.objects.get(user=self.user)

    def test_reminder_setting_str(self):
        self.assertIn(str(self.user), str(self.setting))

    def test_reminder_setting_defaults(self):
        self.assertTrue(self.setting.sms_reminder)
        self.assertFalse(self.setting.checkup_reminder)

    def test_reminder_setting_one_to_one_with_user(self):
        user2 = User.objects.create_user(
            phone='09129999999',
            national_code='9999999999',
            first_name='Sara',
            last_name='Hosseini'
        )
        setting2 = ReminderSetting.objects.get(user=user2)
        self.assertNotEqual(self.setting.user, setting2.user)
