"""
JWT Authentication Middleware for Dentura.

Reads the access token from an httpOnly cookie and populates
``request.user`` + ``request.auth`` so that Django template views
using ``@login_required`` work seamlessly with JWT.

IMPORTANT: This middleware must run AFTER Django's AuthenticationMiddleware
so that ``request.user`` is already set (to either a session user or
AnonymousUser).
"""

from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class JWTAuthenticationMiddleware:
    """
    Middleware that authenticates users via JWT cookie.

    Runs AFTER ``AuthenticationMiddleware`` so that ``request.user``
    already exists (session user or AnonymousUser).

    If the user is AnonymousUser and a valid JWT cookie is present,
    it authenticates via JWT and sets ``request.user`` + ``request.auth``.

    Falls back to session auth if the cookie is missing or invalid —
    this keeps Django admin and session-based flows working.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.jwt_auth = JWTAuthentication()

    def __call__(self, request):
        # Skip JWT for admin and static/media paths
        if self._should_skip(request):
            return self.get_response(request)

        self._authenticate(request)
        return self.get_response(request)

    def _should_skip(self, request):
        path = request.path
        return (
            path.startswith('/admin/')
            or path.startswith('/static/')
            or path.startswith('/media/')
            or path == '/favicon.ico'
        )

    def _authenticate(self, request):
        """Try to authenticate via JWT cookie. Sets request.user if valid."""
        # AuthenticationMiddleware has already run — request.user exists
        # but might be AnonymousUser if no session auth.
        from django.contrib.auth.models import AnonymousUser

        # If already authenticated via session, don't override
        try:
            if request.user.is_authenticated:
                return
        except AttributeError:
            # request.user somehow not set — skip
            return

        # User is anonymous — try JWT
        token = self._get_token_from_cookie(request)
        if not token:
            return

        try:
            # Create a fake request with the token in the auth header
            # so DRF's JWTAuthentication can process it
            request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'
            user_auth_tuple = self.jwt_auth.authenticate(request)
            if user_auth_tuple is not None:
                request.user, request.auth = user_auth_tuple
        except (InvalidToken, TokenError):
            # Token expired or invalid — frontend should handle refresh
            pass
        except Exception:
            # Any other error — silently ignore, let session auth handle it
            pass

    def _get_token_from_cookie(self, request):
        """Extract access token from the httpOnly cookie."""
        return request.COOKIES.get(
            settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        )
