from rest_framework.generics import ListAPIView
from .serializers import DoctorSerializer
from backend.apps.doctors.models import Doctor
from backend.apps.appointments.models import Testimonial
from django.db.models.functions import Coalesce
from django.db.models import Value


from django.db.models import Avg, Q

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
                        appointments__testimonials__status=Testimonial.Status.APPROVED
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

    serializer_class = DoctorSerializer
