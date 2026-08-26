from rest_framework.generics import ListAPIView
from .serializers import DoctorSerializer
from backend.apps.doctors.models import Doctor


class DoctorListAPIView(ListAPIView):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
