from rest_framework.throttling import SimpleRateThrottle, ScopedRateThrottle, AnonRateThrottle


class ThrottledError(Exception):
    """Raised when a manual DRF throttle check fails inside a plain Django view."""
    def __init__(self, detail='Too many requests. Please try again later.'):
        self.detail = detail
        super().__init__(detail)


def check_throttle(request, throttle):
    """Manually run a DRF throttle inside a plain Django function view.

    Raises PermissionDenied (403) if the rate limit is exceeded.
    """
    if not throttle.allow_request(request, None):
        raise ThrottledError()


def _session_or_ip(request, prefix):
    """Build a cache key from session phone_number, falling back to client IP."""
    phone = request.session.get('phone_number')
    if phone:
        return f'{prefix}:{phone}'
    return f'{prefix}:{throttle_ident(request)}'


def throttle_ident(request):
    """Extract client IP (honouring X-Forwarded-For behind a proxy)."""
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


class LoginThrottle(SimpleRateThrottle):
    """Throttle the login-sends-OTP view by client IP."""
    scope = 'login'

    def get_cache_key(self, request, view):
        return f'login:{throttle_ident(request)}'


class OtpThrottle(SimpleRateThrottle):
    """Throttle OTP verification by phone (session) or IP (no session)."""
    scope = 'otp'

    def get_cache_key(self, request, view):
        return _session_or_ip(request, 'otp')


class ResendOtpThrottle(SimpleRateThrottle):
    """Throttle OTP resend by phone (session) or IP (no session)."""
    scope = 'resend_otp'

    def get_cache_key(self, request, view):
        return _session_or_ip(request, 'resend_otp')


class AppointmentThrottle(ScopedRateThrottle):
    scope = 'appointments'



class CommentUserThrottle(ScopedRateThrottle):
    scope = 'comment_user'

    def allow_request(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return True
        return super().allow_request(request, view)


class CommentAnonThrottle(AnonRateThrottle):

    scope = 'comment_anon'

    def allow_request(self, request, view):
        if request.user and request.user.is_authenticated:
            return True
        return super().allow_request(request, view)