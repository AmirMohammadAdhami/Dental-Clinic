from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from backend.apps.core import urls as core_urls
from backend.apps.blog import urls as blog_urls


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include(core_urls)),
    path('blog/', include(blog_urls)),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )