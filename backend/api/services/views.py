from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.generics import ListAPIView

from backend.api.services.serializers import ServiceSerializer
from backend.apps.appointments.models import Service
from backend.security.cache import CACHE_TTL


@method_decorator(cache_page(CACHE_TTL['services']), name='dispatch')
class ServiceListApiView(ListAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer