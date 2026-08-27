from rest_framework.generics import ListAPIView

from backend.api.services.serializers import ServiceSerializer
from backend.apps.appointments.models import Service


class ServiceListApiView(ListAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer