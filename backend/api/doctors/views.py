from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from .serializers import DoctorListSerializer, DoctorDetailSerializer
from backend.apps.doctors.models import Doctor
from backend.apps.appointments.models import DoctorReview
from django.db.models.functions import Coalesce
from django.db.models import Value, Avg, Q


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
                    'appointments__testimonials__rating',
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
        return (
            Doctor.objects
            .select_related('user', 'testimonial')
            .prefetch_related(
                'photos',
                'services_offered',
                'certificates',
                'articles__media',
            )
            .annotate(
                average_rating=Coalesce(
                    Avg(
                        'appointments__testimonials__rating',
                        filter=Q(
                            appointments__testimonials__status=DoctorReview.Status.APPROVED
                        )
                    ),
                    Value(0.0)
                )
            )
        )
