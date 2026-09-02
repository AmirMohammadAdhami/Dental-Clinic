from .base import *

# Swagger / OpenAPI
INSTALLED_APPS.extend(['drf_spectacular',])

REST_FRAMEWORK.update({
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
})

SPECTACULAR_SETTINGS = {
    'TITLE': 'Dentura Project',
    'DESCRIPTION': 'a dental clinic project',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}