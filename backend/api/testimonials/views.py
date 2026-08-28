from rest_framework.generics import ListAPIView

from backend.api.testimonials.serializers import TestimonialSerializer
from backend.apps.appointments.models import DoctorReview


class TestimonialListApiView(ListAPIView):
    queryset = DoctorReview.objects.select_related(
        'appointment__doctor__user',
        'appointment__patient',
        'appointment__service'
    ).only(
        'id', 'content', 'rating', 'status', 'created_at',
        'appointment__doctor__user__first_name',
        'appointment__doctor__user__last_name',
        'appointment__first_name',
        'appointment__last_name',
        'appointment__national_code',
        'appointment__patient__first_name',
        'appointment__patient__last_name',
        'appointment__patient__national_code',
        'appointment__service__id',
        'appointment__service__name',
        'appointment__service__description',
    ).filter(status=DoctorReview.Status.APPROVED)
    serializer_class = TestimonialSerializer