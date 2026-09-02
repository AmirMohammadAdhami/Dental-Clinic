from django.shortcuts import render
from django.views.decorators.cache import cache_page
from backend.security.cache import CACHE_TTL


@cache_page(CACHE_TTL['static_pages'])
def blog_index(request):
    """Render the main blog page."""
    return render(request, 'blog/blog.html')


def all_articles(request):
    """Render the all articles listing page."""
    return render(request, 'blog/all-articles.html')


def post_detail(request, slug):
    """Render a single blog post."""
    return render(request, 'blog/post.html')


@cache_page(CACHE_TTL['static_pages'])
def before_after(request):
    """Render the before/after gallery page."""
    return render(request, 'blog/before-after.html')