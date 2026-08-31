from rest_framework.generics import ListAPIView, RetrieveAPIView
from .serializers import DoctorListSerializer, DoctorDetailSerializer
from backend.apps.doctors.models import Doctor
from backend.apps.appointments.models import DoctorReview, Appointment
from backend.apps.blog.models import BeforeAfter
from backend.apps.doctors.models import Certificate
from django.db.models.functions import Coalesce
from django.db.models import Value, Avg, Q, F, FloatField, ExpressionWrapper, Count
from django.db.models import Prefetch
from django.utils.dateparse import parse_date
from datetime import date, timedelta


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
            ),
            _review_count_annot=Count(
                'appointments__testimonials',
                filter=Q(appointments__testimonials__status=DoctorReview.Status.APPROVED),
            ),
            _completed_count_annot=Count(
                'appointments',
                filter=Q(appointments__status=Appointment.Status.DONE),
            ),
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

    def get_queryset(self):
        qs = super().get_queryset()
        service = self.request.query_params.get('service')
        if service:
            qs = qs.filter(services_offered__name__icontains=service)
        return qs.distinct()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        qs = self.get_queryset()
        # Prefetch annotations onto instances for serializer efficiency
        doctor_map = {}
        for doc in qs:
            doctor_map[doc.id] = doc
        ctx['_doctor_annotations'] = doctor_map
        return ctx

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        # Store annotation values on instances for the serializer
        for doc in qs:
            doc._review_count = getattr(doc, '_review_count_annot', 0)
            doc._completed_count = getattr(doc, '_completed_count_annot', 0)
        return super().list(request, *args, **kwargs)


class DoctorAvailabilityAPIView(RetrieveAPIView):
    """Return available time slots for a specific doctor on a given date."""
    lookup_field = 'slug'
    serializer_class = DoctorDetailSerializer  # not used, we override list

    def get_queryset(self):
        return Doctor.objects.all()

    def get(self, request, *args, **kwargs):
        from rest_framework.response import Response
        doctor = self.get_object()
        date_str = request.query_params.get('date')
        if not date_str:
            return Response({'error': 'date query parameter is required (YYYY-MM-DD)'}, status=400)

        target_date = parse_date(date_str)
        if not target_date:
            return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)

        # Define standard time slots (30-min intervals)
        MORNING_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30']
        AFTERNOON_SLOTS = ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30']

        # Get booked slots for this doctor on this date
        booked_times = set(
            Appointment.objects.filter(
                doctor=doctor,
                appointment_date__date=target_date,
                status__in=[Appointment.Status.PENDING, Appointment.Status.RESERVED],
            ).values_list('appointment_date__hour', 'appointment_date__minute')
        )

        def slot_available(time_str):
            h, m = map(int, time_str.split(':'))
            return (h, m) not in booked_times

        # Check if it's a working day
        is_working = DoctorListSerializer._is_working_day(doctor, target_date)

        morning = [{'time': t, 'available': is_working and slot_available(t)} for t in MORNING_SLOTS]
        afternoon = [{'time': t, 'available': is_working and slot_available(t)} for t in AFTERNOON_SLOTS]

        return Response({
            'date': date_str,
            'is_working_day': is_working,
            'doctor': {
                'slug': doctor.slug,
                'full_name': doctor.user.first_name + ' ' + doctor.user.last_name,
            },
            'morning_slots': morning,
            'afternoon_slots': afternoon,
        })


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
