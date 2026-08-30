from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.apps.notifications.models import Notification, ReminderSetting
from .serializers import NotificationSerializer, ReminderSettingSerializer


class NotificationListAPIView(generics.ListAPIView):
    """
    GET /api/notifications/
    Returns all notifications for the authenticated user, newest first.
    Supports ?unread=true query param to filter only unread.
    """

    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Notification.objects.filter(
            recipient=self.request.user,
        ).order_by("-created_at")

        # Optional filter: only unread
        unread = self.request.query_params.get("unread")
        if unread is not None and unread.lower() in ("true", "1"):
            qs = qs.filter(is_read=False)

        return qs


class NotificationMarkReadAPIView(APIView):
    """
    PATCH /api/notifications/<id>/read/
    Mark a single notification as read.
    """

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            notif = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        notif.is_read = True
        notif.save(update_fields=["is_read"])

        return Response({"detail": "Notification marked as read."})


class NotificationMarkAllReadAPIView(APIView):
    """
    POST /api/notifications/mark-all-read/
    Mark all notifications as read for the authenticated user.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).update(is_read=True)

        return Response({"detail": f"{updated} notification(s) marked as read."})


class ReminderSettingAPIView(generics.RetrieveUpdateAPIView):
    """
    GET/PATCH /api/reminders/settings/
    Retrieve or update reminder settings for the authenticated user.
    """

    serializer_class = ReminderSettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        setting, _ = ReminderSetting.objects.get_or_create(
            user=self.request.user,
        )
        return setting
