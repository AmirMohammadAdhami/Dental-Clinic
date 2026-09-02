"""
Dentura — Cache helpers

Central place for TTL constants, cache‑key builders and invalidation
routines used across the API views.

Usage in views:
    from backend.security.cache import cache, CACHE_TTL, invalidate_doctor_list
    from django.views.decorators.cache import cache_page

    @cache_page(CACHE_TTL['doctors_list'])
    def get(self, request):
        ...

    # After a write:
    invalidate_doctor_list()
"""

from django.core.cache import cache  # noqa: re-export for convenience

# ── TTL constants (seconds) ────────────────────────────────────
CACHE_TTL = {
    # Static / semi-static (admin-only changes)
    'services':          60 * 60,        # 1 hour
    'faqs':              60 * 60,        # 1 hour
    'assistants':        30 * 60,        # 30 min
    'before_afters':     30 * 60,        # 30 min
    'home_videos':       30 * 60,        # 30 min
    'static_pages':      15 * 60,        # 15 min (public HTML pages)

    # Semi-dynamic (user-generated content)
    'doctors_list':      2 * 60,         # 2 min  (heavy annotations)
    'doctor_detail':     5 * 60,         # 5 min  (heavy annotations)
    'doctor_reviews':    5 * 60,         # 5 min
    'article_detail':    10 * 60,        # 10 min
    'article_comments':  1 * 60,         # 1 min  (new comments arrive often)

    # Real-time — NOT cached
    # 'availability':    None
    # 'notifications':   None
    # 'dashboard_me':    None
}

# ── Cache key prefixes ─────────────────────────────────────────
_PREFIX = 'dentura'


def _key(namespace, *parts):
    """Build a namespaced cache key: dentura:namespace:part1:part2"""
    tokens = [_PREFIX, namespace] + [str(p) for p in parts]
    return ':'.join(tokens)


# ── Key builders ───────────────────────────────────────────────

def doctor_list_key(service_slug=None, sort=None):
    """Key for the paginated doctor list endpoint."""
    suffix = f':{service_slug or "all"}:{sort or "default"}'
    return _key('doctors', 'list' + suffix)


def doctor_detail_key(slug):
    return _key('doctors', 'detail', slug)


def availability_key(slug, days=30):
    return _key('doctors', 'avail', slug, days)


def reviews_list_key():
    return _key('reviews', 'list')


def article_detail_key(slug):
    return _key('articles', 'detail', slug)


def article_comments_key(slug):
    return _key('articles', 'comments', slug)


# ── Invalidation helpers ───────────────────────────────────────
# Each invalidator clears all cache keys that depend on the
# changed data.  Call them after a successful write (POST/PATCH/DELETE).

def invalidate_doctor_list():
    """Call after a review is approved/rejected or a doctor profile changes."""
    # Clear all common doctor-list key variants.
    cache.delete_many([
        doctor_list_key(),
        doctor_list_key(service_slug='all'),
        doctor_list_key(sort='rating'),
        doctor_list_key(sort='availability'),
        doctor_list_key(sort='experience'),
    ])


def invalidate_doctor_detail(slug):
    """Call after a doctor's profile, articles, or reviews change."""
    cache.delete(doctor_detail_key(slug))
    # Doctor list also shows this doctor's rating
    invalidate_doctor_list()


def invalidate_reviews():
    """Call after a new review is approved."""
    cache.delete(reviews_list_key())
    invalidate_doctor_list()


def invalidate_article(slug):
    """Call after an article is edited or a new comment is approved."""
    cache.delete(article_detail_key(slug))
    cache.delete(article_comments_key(slug))


def invalidate_blog_listing():
    """Call after an article is published, unpublished, or edited."""
    # Invalidate the paginated blog listing endpoint
    cache.delete(_key('articles', 'list', 'all'))
    # Invalidate the /blog/ static page (keyed by Django's cache_page)
    from django.core.cache import cache as _cache
    _cache.delete('views.decorators.cache.cache_page./blog/.GET.dentura')
    _cache.delete('views.decorators.cache.cache_page./blog/before_after/.GET.dentura')


def invalidate_all():
    """Nuclear option — clear everything.  Use from Django admin or management commands."""
    cache.clear()
