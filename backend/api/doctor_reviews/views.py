from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import status as http_status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.api.doctor_reviews.serializers import (
    DoctorReviewListSerializer,
    DoctorReviewCreateSerializer,
)
from backend.apps.appointments.models import DoctorReview
from backend.security.cache import CACHE_TTL, cache, invalidate_reviews, invalidate_doctor_detail


@method_decorator(cache_page(CACHE_TTL['doctor_reviews']), name='dispatch')
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
            .order_by('-created_at')
            .only(
                'id', 'content', 'status', 'created_at',
                'professionalism_rating', 'treatment_quality_rating', 'communication_rating',
                'appointment__doctor__user__first_name',
                'appointment__doctor__user__last_name',
                'appointment__first_name',
                'appointment__last_name',
                'appointment__patient__first_name',
                'appointment__patient__last_name',
                'appointment__service__id',
                'appointment__service__name',
            )
        )


class DoctorReviewCreateApiView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DoctorReviewCreateSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        review = serializer.save()

        # New review → invalidate reviews list and affected doctor's caches.
        invalidate_reviews()
        invalidate_doctor_detail(review.appointment.doctor.slug)

        return Response(
            {
                'id': review.id,
                'status': review.status,
                'message': 'نظر شما با موفقیت ثبت شد و پس از بررسی نمایش داده خواهد شد.',
            },
            status=http_status.HTTP_201_CREATED,
        )
