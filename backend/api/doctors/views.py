from rest_framework.generics import ListAPIView
from .serializers import DoctorSerializer
from backend.apps.doctors.models import Doctor


class DoctorListAPIView(ListAPIView):
    queryset = Doctor.objects.select_related('user').prefetch_related(
        'services_offered', 'photos'
    ).only(
        'id', 'slug', 'speciality', 'university', 'years_of_experience', 'bio',
        'user__first_name', 'user__last_name'
    )
    serializer_class = DoctorSerializer
