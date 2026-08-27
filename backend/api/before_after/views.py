from rest_framework.generics import ListAPIView
from backend.apps.blog.models import BeforeAfter
from .serializers import BeforeAfterSerializer

class BeforeAfterListApiView(ListAPIView):
    queryset = BeforeAfter.objects.all()
    serializer_class = BeforeAfterSerializer