from django.contrib import admin
from django.urls import path, include
from django.contrib.sitemaps.views import sitemap
from django.conf.urls.static import static
from django.conf import settings
from backend.apps.core import urls as core_urls
from backend.apps.core.views import robots_txt
from backend.apps.core.sitemaps import StaticViewSitemap, ArticleSitemap, DoctorSitemap
from backend.apps.blog import urls as blog_urls
from backend.apps.accounts import urls as accounts_urls
from backend.apps.appointments import urls as appointments_urls
from backend.apps.doctors import urls as doctors_urls
from backend.api import urls as api_urls
from backend.security.jwt_views import (
    CookieTokenObtainView,
    CookieTokenRefreshView,
    CookieTokenVerifyView,
    CookieTokenLogoutView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView, SpectacularRedocView,
)

sitemaps = {
    'static': StaticViewSitemap,
    'articles': ArticleSitemap,
    'doctors': DoctorSitemap,
}

urlpatterns = [
    path('admin/', admin.site.urls),
    path('robots.txt', robots_txt, name='robots_txt'),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('', include(core_urls)),
    path('blog/', include(blog_urls)),
    path('accounts/', include(accounts_urls)),
    path('dashboard/', include(appointments_urls)),
    path('doctors/', include(doctors_urls)),
    path('api/', include(api_urls)),
    path('api-auth/', include("rest_framework.urls")),

    # ── JWT Authentication Endpoints ──
    path('api/token/', CookieTokenObtainView.as_view(), name='jwt-token-obtain'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='jwt-token-refresh'),
    path('api/token/verify/', CookieTokenVerifyView.as_view(), name='jwt-token-verify'),
    path('api/token/logout/', CookieTokenLogoutView.as_view(), name='jwt-token-logout'),

    # YOUR PATTERNS
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Optional UI:
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )