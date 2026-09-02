from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_GET
from backend.security.cache import CACHE_TTL


@cache_page(CACHE_TTL['static_pages'])
def home(request):
    return render(request, template_name='home/index.html')


@require_GET
def robots_txt(request):
    scheme = 'https' if request.is_secure() else 'http'
    host = request.get_host()
    site_url = f'{scheme}://{host}'
    response = render(request, 'robots.txt', {'site_url': site_url})
    response['Content-Type'] = 'text/plain'
    return response