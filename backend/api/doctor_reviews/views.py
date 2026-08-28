from rest_framework.generics import ListAPIView

from backend.api.doctor_reviews.serializers import DoctorReviewListSerializer
from backend.apps.appointments.models import DoctorReview


class DoctorReviewListApiView(ListAPIView):
    serializer_class = DoctorReviewListSerializer

    def get_queryset(self):
        return (
            DoctorReview.objects
            .select_related(
                'appointment__doctor__user',
                'appointment__patient',
                'appointment__service',
            )
            .filter(status=DoctorReview.Status.APPROVED)
            .only(
                'id', 'content', 'status', 'created_at',
                'professionalism_rating', 'treatment_quality_rating',
                'communication_rating',
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
            )
        )
