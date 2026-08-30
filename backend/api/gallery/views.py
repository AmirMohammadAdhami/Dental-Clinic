from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import GallerySerializer
from backend.apps.blog.models import BeforeAfter


class GalleryListApiView(ListAPIView):
    serializer_class = GallerySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BeforeAfter.objects.filter(
            appointment__patient=self.request.user
        ).select_related(
            'appointment__doctor__user',
            'appointment__patient',
            'appointment__service',
        ).order_by('-created_at')