from .base import *

# Use console email backend in development (prints to terminal).
# Override MAILERS (not EMAIL_BACKEND) — Django 6 forbids the deprecated
# EMAIL_BACKEND setting when MAILERS is defined in base settings.
SMS_BACKEND = "console"

INSTALLED_APPS.extend(['drf_spectacular',])

REST_FRAMEWORK.update({
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
})

SPECTACULAR_SETTINGS = {
    'TITLE': 'Dentura Project',
    'DESCRIPTION': 'a dental clinic project',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # OTHER SETTINGS
}