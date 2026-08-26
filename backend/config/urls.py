from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from backend.apps.core import urls as core_urls
from backend.apps.blog import urls as blog_urls
from backend.apps.accounts import urls as accounts_urls
from backend.apps.appointments import urls as appointments_urls
from backend.apps.doctors import urls as doctors_urls
from backend.api import urls as api_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(core_urls)),
    path('blog/', include(blog_urls)),
    path('accounts/', include(accounts_urls)),
    path('dashboard/', include(appointments_urls)),
    path('doctors/', include(doctors_urls)),
    path('api/', include(api_urls)),
    path('api-auth/', include("rest_framework.urls"))
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )