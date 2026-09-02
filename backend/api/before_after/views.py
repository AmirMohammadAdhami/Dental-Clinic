from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.generics import ListAPIView
from backend.apps.blog.models import BeforeAfter
from backend.security.cache import CACHE_TTL
from .serializers import BeforeAfterSerializer


@method_decorator(cache_page(CACHE_TTL['before_afters']), name='dispatch')
class BeforeAfterListApiView(ListAPIView):
    queryset = BeforeAfter.objects.select_related(
        'appointment__doctor__user',
        'appointment__patient',
        'appointment__service',
    ).only(
        'id', 'before_image', 'after_image', 'description',
        'created_at', 'updated_at',
        'appointment__doctor__user__first_name',
        'appointment__doctor__user__last_name',
        'appointment__first_name',
        'appointment__last_name',
        'appointment__patient__first_name',
        'appointment__patient__last_name',
        'appointment__service__name'
    ).order_by('-created_at')
    serializer_class = BeforeAfterSerializer