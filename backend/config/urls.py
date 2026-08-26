from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from backend.apps.core import urls as core_urls


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(core_urls), name='home'),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )