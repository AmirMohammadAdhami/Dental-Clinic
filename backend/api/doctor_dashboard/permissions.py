from rest_framework.permissions import BasePermission


class IsDoctorUser(BasePermission):
    """Allow access only to authenticated users who have a Doctor profile."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and hasattr(request.user, 'doctor')
        )
