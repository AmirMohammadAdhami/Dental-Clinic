from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.generics import ListAPIView

from backend.api.assistants.serializers import AssistantSerializer
from backend.apps.doctors.models import Assistant
from backend.security.cache import CACHE_TTL


@method_decorator(cache_page(CACHE_TTL['assistants']), name='dispatch')
class AssistantListAPIView(ListAPIView):
    queryset = Assistant.objects.select_related('user').only(
        'id', 'speciality', 'blog_photo', 'user__first_name', 'user__last_name'
    ).order_by('-created_at')
    serializer_class = AssistantSerializer