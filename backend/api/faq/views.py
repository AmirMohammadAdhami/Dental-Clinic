from rest_framework.generics import ListAPIView
from backend.apps.blog.models import FAQ
from .serializers import FAQSerializer

class FAQListApiView(ListAPIView):
    queryset = FAQ.objects.only('id', 'question', 'answer_text', 'categories')
    serializer_class = FAQSerializer