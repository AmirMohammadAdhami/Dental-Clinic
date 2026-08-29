from .base import *

# Use console email backend in development (prints to terminal)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'