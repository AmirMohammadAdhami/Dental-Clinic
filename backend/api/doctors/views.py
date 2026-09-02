from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.generics import ListAPIView, RetrieveAPIView
from django.db.models.functions import Coalesce
from django.db.models import (
    Value, Avg, Q, F, FloatField, ExpressionWrapper, Count, OuterRef, Subquery,
)
from django.db.models import Prefetch

from .serializers import DoctorListSerializer, DoctorDetailSerializer
from backend.apps.appointments.services import release_expired_reservations
from backend.apps.doctors.models import Doctor
from backend.apps.appointments.models import Appointment, AppointmentSlot, DoctorReview
from backend.apps.blog.models import BeforeAfter
from backend.apps.doctors.models import Certificate
from backend.security.cache import CACHE_TTL

# Sort keys accepted by the ?sort= query param (used by the
# /dashboard/select-doctors/<service>/ page). Absent or unknown values keep
# the default queryset ordering so existing consumers are unaffected.
SORT_FIELDS = {
    'rating': '-average_rating',
    'experience': '-years_of_experience',
    'availability': 'first_available_at',
}


def _free_slots_subquery():
    """Earliest active, unbooked, future slot for a doctor (used for the
    'اولین نوبت خالی' badge and availability sorting)."""
    now = timezone.now()
    return (
        AppointmentSlot.objects
        .filter(
            doctor=OuterRef('pk'),
            is_active=True,
            start_time__gte=now,
        )
        .exclude(appointments__status__in=Appointment.BLOCKING_STATUSES)
        .order_by('start_time')
        .values('start_time')[:1]
    )


def _doctor_list_queryset():
    now = timezone.now()
    return (
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
            ),
            review_count=Count(
                'appointments__testimonials',
                filter=Q(
                    appointments__testimonials__status=DoctorReview.Status.APPROVED
                ),
                distinct=True,
            ),
            first_available_at=Subquery(_free_slots_subquery()),
        )        .only(
            'id', 'slug', 'speciality', 'university', 'working_days',
            'years_of_experience', 'bio',
            'user__first_name', 'user__last_name',
        )
        .order_by('-created_at')
    )


@method_decorator(cache_page(CACHE_TTL['doctors_list']), name='dispatch')
class DoctorListAPIView(ListAPIView):
    serializer_class = DoctorListSerializer

    def get_queryset(self):
        # Release expired 30-minute reservation holds so availability
        # annotations (first_available_at) are always accurate.
        release_expired_reservations()
        queryset = _doctor_list_queryset()

        # Optional: filter doctors by a service slug
        # (/dashboard/select-doctors/<service>/ page).
        service_slug = self.request.query_params.get('service')
        if service_slug:
            queryset = queryset.filter(services_offered__slug=service_slug).distinct()

        # Optional: server-side sorting ('rating' | 'availability' | 'experience').
        sort = self.request.query_params.get('sort')
        if sort in SORT_FIELDS:
            field = SORT_FIELDS[sort]
            if field == 'first_available_at':
                queryset = queryset.order_by(F('first_available_at').asc(nulls_last=True))
            else:
                queryset = queryset.order_by(field)

        return queryset


@method_decorator(cache_page(CACHE_TTL['doctor_detail']), name='dispatch')
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
                Prefetch(
                    'certificates',
                    queryset=Certificate.objects.order_by('date'),
                ),
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
                ),
                completed_appointments_count=Count(
                    'appointments',
                    filter=Q(appointments__status='DONE'),
                ),
            )
        )
