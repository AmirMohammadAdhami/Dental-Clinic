from django.shortcuts import render
from django.views.decorators.cache import cache_page
from backend.security.cache import CACHE_TTL


@cache_page(CACHE_TTL['static_pages'])
def home(request):
    return render(request, template_name='home/index.html')