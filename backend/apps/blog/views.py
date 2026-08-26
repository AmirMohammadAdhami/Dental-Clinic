from django.shortcuts import render


def blog_index(request):
    """Render the main blog page."""
    return render(request, 'blog/blog.html')


def all_articles(request):
    """Render the all articles listing page."""
    return render(request, 'blog/all-articles.html')


def post_detail(request, slug):
    """Render a single blog post."""
    return render(request, 'blog/post.html')


def before_after(request):
    """Render the before/after gallery page."""
    return render(request, 'blog/before-after.html')