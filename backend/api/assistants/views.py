from rest_framework.generics import ListAPIView

from backend.api.assistants.serializers import AssistantSerializer
from backend.apps.doctors.models import Assistant


class AssistantListAPIView(ListAPIView):
    queryset = Assistant.objects.all()
    serializer_class = AssistantSerializer