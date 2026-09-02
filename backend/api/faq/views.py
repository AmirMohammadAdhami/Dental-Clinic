from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.generics import ListAPIView
from backend.apps.blog.models import FAQ
from backend.security.cache import CACHE_TTL
from .serializers import FAQSerializer


@method_decorator(cache_page(CACHE_TTL['faqs']), name='dispatch')
class FAQListApiView(ListAPIView):
    queryset = FAQ.objects.only('id', 'question', 'answer_text', 'categories')
    serializer_class = FAQSerializer