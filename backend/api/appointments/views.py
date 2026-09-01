from django.db import transaction
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from backend.apps.appointments.models import Appointment
from .serializers import AppointmentCreateSerializer


class AppointmentCreateAPIView(CreateAPIView):
    """
    POST /api/appointments/
    Body: {"slot": <slot_id>, "service": "<service_slug>"}

    Books a slot for the logged-in patient (Plan B): creates a PENDING
    appointment and returns a real tracking code. The frontend then
    redirects to /dashboard/finalize_information/<tracking_code>/.
    """

    serializer_class = AppointmentCreateSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()
        return Response(
            serializer.to_representation(appointment),
            status=http_status.HTTP_201_CREATED,
        )
