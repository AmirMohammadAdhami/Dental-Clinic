from .base import *

# Use console email backend in development (prints to terminal).
# Override MAILERS (not EMAIL_BACKEND) — Django 6 forbids the deprecated
# EMAIL_BACKEND setting when MAILERS is defined in base settings.
MAILERS = {
    'default': {
        'BACKEND': 'django.core.mail.backends.console.EmailBackend',
    },
}