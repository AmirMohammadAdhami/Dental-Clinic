from django.test import TestCase


class CoreAppTest(TestCase):
    """Tests for core app."""

    def test_core_app_import(self):
        """Test that core app can be imported."""
        from backend.apps.core import apps
        self.assertTrue(hasattr(apps, 'CoreConfig'))
