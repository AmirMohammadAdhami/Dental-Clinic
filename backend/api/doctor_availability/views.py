from datetime import datetime, time, timedelta
from collections import defaultdict

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status as http_status
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.api.constants import DEPOSIT_PRICE
from backend.apps.doctors.models import Doctor
from backend.apps.appointments.models import Appointment, AppointmentSlot
from .serializers import AvailabilitySlotSerializer


class DoctorAvailabilityAPIView(APIView):
    """
    GET /api/doctors/<slug>/availability/?days=30

    Returns the doctor's registered appointment slots for the next `days`
    days (default 30, clamped 1..60) starting today.

    Day states (rendered by the frontend):
      - "closed":    no slots registered for that day at all -> تعطیل
      - "full":      slots exist but every one is booked    -> پر
      - "available": at least one unbooked slot             -> selectable

    Slot states:
      - is_booked=true  -> gray, not reservable
      - is_booked=false -> selectable

    Slots come only from what the admin/receptionist actually registered —
    there is no fixed/default schedule.
    """

    MIN_DAYS = 1
    MAX_DAYS = 60
    DEFAULT_DAYS = 30

    def get(self, request, slug):
        doctor = get_object_or_404(Doctor.objects.select_related('user'), slug=slug)

        try:
            days = int(request.query_params.get('days', self.DEFAULT_DAYS))
        except (TypeError, ValueError):
            days = self.DEFAULT_DAYS
        days = max(self.MIN_DAYS, min(days, self.MAX_DAYS))

        today = timezone.localdate()
        range_end = today + timedelta(days=days - 1)

        start_dt = timezone.make_aware(datetime.combine(today, time.min))
        end_dt = timezone.make_aware(datetime.combine(range_end, time.max))

        slots = (
            AppointmentSlot.objects
            .filter(doctor=doctor, is_active=True, start_time__range=(start_dt, end_dt))
            .order_by('start_time')
        )

        booked_ids = set(
            Appointment.objects
            .filter(slot__in=slots, status__in=Appointment.BLOCKING_STATUSES)
            .values_list('slot_id', flat=True)
        )

        slots_by_date = defaultdict(list)
        for slot in slots:
            slots_by_date[timezone.localtime(slot.start_time).date()].append(slot)

        days_payload = []
        for offset in range(days):
            date = today + timedelta(days=offset)
            day_slots = slots_by_date.get(date, [])

            slot_items = []
            for slot in day_slots:
                slot._is_booked = slot.id in booked_ids
                slot_items.append(AvailabilitySlotSerializer(slot).data)

            if not day_slots:
                day_status = 'closed'
            elif all(item['is_booked'] for item in slot_items):
                day_status = 'full'
            else:
                day_status = 'available'

            days_payload.append({
                'date': date.isoformat(),
                'status': day_status,
                'slots': slot_items,
            })

        return Response({
            'doctor': {
                'slug': doctor.slug,
                'full_name': doctor.user.full_name,
                'speciality': doctor.speciality,
            },
            'deposit_price': DEPOSIT_PRICE,
            'range': {
                'from': today.isoformat(),
                'to': range_end.isoformat(),
                'days': days,
            },
            'days': days_payload,
        }, status=http_status.HTTP_200_OK)
