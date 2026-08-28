from rest_framework.generics import ListAPIView, RetrieveAPIView
from .serializers import DoctorListSerializer, DoctorDetailSerializer
from backend.apps.doctors.models import Doctor
from backend.apps.appointments.models import DoctorReview
from backend.apps.blog.models import BeforeAfter
from django.db.models.functions import Coalesce
from django.db.models import Value, Avg, Q, F, FloatField, ExpressionWrapper
from django.db.models import Prefetch


class DoctorListAPIView(ListAPIView):
    queryset = (
        Doctor.objects
        .select_related('user')
        .prefetch_related(
            'services_offered',
            'photos',
        )
        .annotate(
            average_rating=Coalesce(
                Avg(
                    ExpressionWrapper(
                        (F('appointments__testimonials__professionalism_rating')
                         + F('appointments__testimonials__treatment_quality_rating')
                         + F('appointments__testimonials__communication_rating')) / 3.0,
                        output_field=FloatField(),
                    ),
                    filter=Q(
                        appointments__testimonials__status=DoctorReview.Status.APPROVED
                    )
                ),
                Value(0.0)
            )
        )
        .only(
            'id',
            'slug',
            'speciality',
            'university',
            'working_days',
            'years_of_experience',
            'bio',
            'user__first_name',
            'user__last_name',
        )
    )

    serializer_class = DoctorListSerializer


class DoctorDetailAPIView(RetrieveAPIView):
    lookup_field = 'slug'
    serializer_class = DoctorDetailSerializer

    def get_queryset(self):
        approved_reviews = DoctorReview.objects.filter(
            status=DoctorReview.Status.APPROVED
        )
        return (
            Doctor.objects
            .select_related('user', 'testimonial')
            .prefetch_related(
                'photos',
                'services_offered',
                'certificates',
                'articles__media',
                Prefetch(
                    'appointments__before_after',
                    queryset=BeforeAfter.objects.select_related('appointment__service'),
                    to_attr='_prefetched_before_after',
                ),
                Prefetch(
                    'appointments__testimonials',
                    queryset=approved_reviews,
                    to_attr='_prefetched_reviews',
                ),
            )
            .annotate(
                average_rating=Coalesce(
                    Avg(
                        ExpressionWrapper(
                            (F('appointments__testimonials__professionalism_rating')
                             + F('appointments__testimonials__treatment_quality_rating')
                             + F('appointments__testimonials__communication_rating')) / 3.0,
                            output_field=FloatField(),
                        ),
                        filter=Q(
                            appointments__testimonials__status=DoctorReview.Status.APPROVED
                        )
                    ),
                    Value(0.0)
                )
            )
        )
