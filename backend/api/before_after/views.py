from rest_framework.generics import ListAPIView
from backend.apps.blog.models import BeforeAfter
from .serializers import BeforeAfterSerializer

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
        'appointment__national_code',
        'appointment__patient__first_name',
        'appointment__patient__last_name',
        'appointment__patient__national_code',
        'appointment__service__name'
    ).order_by('-created_at')
    serializer_class = BeforeAfterSerializer