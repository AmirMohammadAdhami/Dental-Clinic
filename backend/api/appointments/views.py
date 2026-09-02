from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from backend.api.constants import RESERVATION_TTL_MINUTES
from backend.apps.appointments.models import Appointment
from backend.apps.appointments.services import release_expired_reservations
from backend.security.throttle import AppointmentThrottle
from backend.security.cache import (
    cache, invalidate_doctor_list, invalidate_doctor_detail,
    availability_key, doctor_list_key,
)
from .serializers import (
    AppointmentCreateSerializer,
    AppointmentDetailSerializer,
    AppointmentDetailResponseSerializer,
)


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
    throttle_classes = [AppointmentThrottle]

    def create(self, request, *args, **kwargs):
        release_expired_reservations()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()

        # Invalidate cached doctor list (rating annotation changed)
        # and the specific doctor's availability cache.
        invalidate_doctor_list()
        invalidate_doctor_detail(appointment.doctor.slug)
        cache.delete(availability_key(appointment.doctor.slug))

        return Response(
            serializer.to_representation(appointment),
            status=http_status.HTTP_201_CREATED,
        )


class AppointmentDetailAPIView(RetrieveUpdateAPIView):
    """
    GET/PATCH /api/appointments/<tracking_code>/

    API for the finalize-information page. Owner-only (appointment.patient
    must be the logged-in user).

    GET:  returns the appointment + available medical records. If the
          reservation is still PENDING, the 30-minute timer starts (or
          restarts) now — i.e. when the patient loads the page.

    PATCH: confirms the reservation. Booking mode:
           - "self":  identity stays on the patient account only
                      (first_name/last_name/national_code are NOT saved).
           - "other": saves first_name/last_name/national_code on the
                      appointment; `patient` remains the logged-in user.
           Also syncs medical_records + additional_notes, then sets
           status=PENDING -> RESERVED and clears the expiry.
    """

    permission_classes = [IsAuthenticated]
    lookup_field = 'tracking_code'
    lookup_url_kwarg = 'tracking_code'

    def get_queryset(self):
        release_expired_reservations()
        return (
            Appointment.objects
            .select_related('doctor__user', 'doctor__photos', 'service', 'patient')
            .filter(patient=self.request.user)
        )

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return AppointmentDetailSerializer
        return AppointmentDetailResponseSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # The 30-minute timer starts when the patient loads this page.
        if instance.status == Appointment.Status.PENDING:
            if instance.expires_at is None or instance.expires_at < timezone.now():
                instance.expires_at = timezone.now() + timedelta(
                    minutes=RESERVATION_TTL_MINUTES
                )
                instance.save(update_fields=['expires_at', 'updated_at'])

        return Response(
            AppointmentDetailResponseSerializer(instance).data,
            status=http_status.HTTP_200_OK,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        if instance.status != Appointment.Status.PENDING:
            return Response(
                {'detail': 'این نوبت قابل تایید نیست (رزرو دیگری انجام شده است).'},
                status=http_status.HTTP_409_CONFLICT,
            )
        if instance.expires_at and instance.expires_at < timezone.now():
            release_expired_reservations()
            instance.refresh_from_db()
            return Response(
                {'detail': 'زمان رزرو به پایان رسید. لطفاً نوبت دیگری انتخاب کنید.'},
                status=http_status.HTTP_409_CONFLICT,
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        appointment = serializer.save()

        # Appointment confirmed → slot is now occupied.
        # Invalidate doctor list and availability caches.
        invalidate_doctor_list()
        invalidate_doctor_detail(appointment.doctor.slug)
        cache.delete(availability_key(appointment.doctor.slug))

        return Response(
            AppointmentDetailResponseSerializer(appointment).data,
            status=http_status.HTTP_200_OK,
        )
