from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from backend.apps.blog.models import Article
from backend.apps.doctors.models import Doctor


class StaticViewSitemap(Sitemap):
    """Sitemap for static pages (homepage, blog listing, team, etc.)."""

    def items(self):
        return [
            'core:home',
            'blog:blog_index',
            'blog:all_articles',
            'blog:before_after',
            'doctors:team',
        ]

    def location(self, item):
        return reverse(item)

    def priority(self, item):
        if item == 'core:home':
            return 1.0
        if item in ('blog:blog_index', 'doctors:team'):
            return 0.8
        return 0.7


class ArticleSitemap(Sitemap):
    """Sitemap for published blog articles."""

    changefreq = 'weekly'
    priority = 0.6

    def items(self):
        return Article.objects.filter(is_published=True).select_related('author', 'category')

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse('blog:post_detail', args=[obj.slug])


class DoctorSitemap(Sitemap):
    """Sitemap for doctor profile pages."""

    changefreq = 'monthly'
    priority = 0.7

    def items(self):
        return Doctor.objects.select_related('user', 'photos')

    def lastmod(self, obj):
        return obj.updated_at

    def location(self, obj):
        return reverse('doctors:doctor_detail', args=[obj.slug])
