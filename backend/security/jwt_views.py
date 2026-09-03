"""
JWT Token Views for Dentura.

Custom token obtain view for OTP-based authentication
(no username/password — users authenticate via SMS OTP).
"""

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieTokenObtainView(APIView):
    """
    Issue JWT tokens after OTP verification.

    This view is called AFTER the user has verified their OTP.
    The frontend passes the user_id (or phone number) and this view
    returns access + refresh tokens as httpOnly cookies.

    Usage flow:
      1. User verifies OTP → backend creates/logs in user
      2. Frontend calls POST /api/token/ with { "user_id": <id> }
      3. This view returns tokens as cookies + in response body
    """
    permission_classes = [AllowAny]
    authentication_classes = []  # No auth required — user just verified OTP

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'detail': 'user_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not user.is_active:
            return Response(
                {'detail': 'User account is disabled.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        response = Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.pk,
                'phone': user.phone,
                'full_name': user.full_name,
                'is_doctor': hasattr(user, 'doctor'),
            },
        }, status=status.HTTP_200_OK)

        # Set cookies
        self._set_access_cookie(response, str(refresh.access_token))
        self._set_refresh_cookie(response, str(refresh))

        return response

    def _set_access_cookie(self, response, token):
        jwt_settings = settings.SIMPLE_JWT
        response.set_cookie(
            key=jwt_settings.get('AUTH_COOKIE', 'access_token'),
            value=token,
            max_age=jwt_settings['ACCESS_TOKEN_LIFETIME'].total_seconds(),
            secure=jwt_settings.get('AUTH_COOKIE_SECURE', True),
            httponly=jwt_settings.get('AUTH_COOKIE_HTTPONLY', True),
            samesite=jwt_settings.get('AUTH_COOKIE_SAMESITE', 'Lax'),
            path='/',
        )

    def _set_refresh_cookie(self, response, token):
        jwt_settings = settings.SIMPLE_JWT
        response.set_cookie(
            key=jwt_settings.get('REFRESH_COOKIE', 'refresh_token'),
            value=token,
            max_age=jwt_settings['REFRESH_TOKEN_LIFETIME'].total_seconds(),
            secure=jwt_settings.get('REFRESH_COOKIE_SECURE', True),
            httponly=jwt_settings.get('REFRESH_COOKIE_HTTPONLY', True),
            samesite=jwt_settings.get('REFRESH_COOKIE_SAMESITE', 'Lax'),
            path='/',
        )


class CookieTokenRefreshView(APIView):
    """
    Refresh an expired access token using the refresh token cookie.

    POST /api/token/refresh/ → new access token in cookie
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(
            settings.SIMPLE_JWT.get('REFRESH_COOKIE', 'refresh_token')
        )
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token not found in cookies.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)
            new_refresh = str(refresh) if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS') else refresh_token
        except (InvalidToken, TokenError) as e:
            return Response(
                {'detail': 'Invalid or expired refresh token.', 'code': 'token_expired'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response({
            'access': new_access,
            'refresh': new_refresh,
        }, status=status.HTTP_200_OK)

        # Update access cookie
        jwt_settings = settings.SIMPLE_JWT
        response.set_cookie(
            key=jwt_settings.get('AUTH_COOKIE', 'access_token'),
            value=new_access,
            max_age=jwt_settings['ACCESS_TOKEN_LIFETIME'].total_seconds(),
            secure=jwt_settings.get('AUTH_COOKIE_SECURE', True),
            httponly=jwt_settings.get('AUTH_COOKIE_HTTPONLY', True),
            samesite=jwt_settings.get('AUTH_COOKIE_SAMESITE', 'Lax'),
            path='/',
        )

        # Update refresh cookie if rotated
        if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
            response.set_cookie(
                key=jwt_settings.get('REFRESH_COOKIE', 'refresh_token'),
                value=new_refresh,
                max_age=jwt_settings['REFRESH_TOKEN_LIFETIME'].total_seconds(),
                secure=jwt_settings.get('REFRESH_COOKIE_SECURE', True),
                httponly=jwt_settings.get('REFRESH_COOKIE_HTTPONLY', True),
                samesite=jwt_settings.get('REFRESH_COOKIE_SAMESITE', 'Lax'),
                path='/',
            )

        return response


class CookieTokenVerifyView(APIView):
    """
    Verify that the current access token is valid.

    GET /api/token/verify/ → 200 if valid, 401 if not
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        from rest_framework_simplejwt.authentication import JWTAuthentication

        token = request.COOKIES.get(
            settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token')
        )
        if not token:
            return Response(
                {'detail': 'No token provided.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            from rest_framework_simplejwt.tokens import AccessToken
            access_token = AccessToken(token)
            return Response({
                'valid': True,
                'user_id': access_token.get('user_id'),
            }, status=status.HTTP_200_OK)
        except (InvalidToken, TokenError):
            return Response(
                {'valid': False, 'detail': 'Invalid or expired token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class CookieTokenLogoutView(APIView):
    """
    Clear JWT cookies to log out the user.

    POST /api/token/logout/ → clears both access and refresh cookies
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        response = Response(
            {'detail': 'Successfully logged out.'},
            status=status.HTTP_200_OK,
        )

        jwt_settings = settings.SIMPLE_JWT
        response.delete_cookie(
            jwt_settings.get('AUTH_COOKIE', 'access_token'),
            path='/',
        )
        response.delete_cookie(
            jwt_settings.get('REFRESH_COOKIE', 'refresh_token'),
            path='/',
        )

        # Blacklist the refresh token if possible
        refresh_token = request.COOKIES.get(
            jwt_settings.get('REFRESH_COOKIE', 'refresh_token')
        )
        if refresh_token and settings.SIMPLE_JWT.get('BLACKLIST_AFTER_ROTATION'):
            try:
                from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
                from rest_framework_simplejwt.tokens import RefreshToken as RT

                # Try to blacklist
                try:
                    refresh = RT(refresh_token)
                    refresh.blacklist()
                except Exception:
                    pass  # Token may already be blacklisted or invalid
            except ImportError:
                # token_blacklist app not installed
                pass

        return response
