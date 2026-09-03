from django.shortcuts import render, get_object_or_404
from django.db.models import Prefetch

from backend.security.cache import (
    CACHE_TTL, page_cache_key, render_cached_page, article_comments_key,
)
from backend.apps.blog.models import Article, ArticleMedia, Comment, FAQ, BeforeAfter
from backend.apps.appointments.models import Service, DoctorReview


# ── Public pages (hybrid SSR + deterministic page cache) ─────────────

def _blog_index_context():
    """Seed for the blog landing page — mirrors /api/faqs/ + /api/services/
    semantics the page JS consumed."""
    faqs = (
        FAQ.objects
        .only('id', 'question', 'answer_text')
        .prefetch_related('categories')
    )
    services = Service.objects.all()
    return {'faqs': faqs, 'services': services}


def blog_index(request):
    """Render the main blog page."""
    return render_cached_page(
        request,
        'blog/blog.html',
        page_cache_key('blog_index'),
        CACHE_TTL['static_pages'],
        _blog_index_context,
    )


def _all_articles_context():
    """Seed for the articles listing — mirrors the /api/home-videos/ list
    response (first 20 published articles, newest first) the page JS consumed."""
    articles_qs = (
        Article.objects.filter(is_published=True)
        .select_related('author__user', 'category')
        .prefetch_related(
            Prefetch('media', queryset=ArticleMedia.objects.all()),
            'author__photos',
        )
        .order_by('-created_at')
    )
    articles = list(articles_qs[:20])

    featured = next((a for a in articles if a.special_article), None)
    popular = sorted(articles, key=lambda a: a.view_count or 0, reverse=True)[:7]

    return {
        'services': Service.objects.all(),
        'featured_article': featured,
        'articles': articles,
        'popular_articles': popular,
    }


def all_articles(request):
    """Render the all articles listing page."""
    return render_cached_page(
        request,
        'blog/all-articles.html',
        page_cache_key('all_articles'),
        CACHE_TTL['article_detail'],
        _all_articles_context,
    )


def _article_detail_context(article):
    """Seed for the article page — mirrors the old ArticleDetailSerializer
    (files, approved comment tree, category doctor reviews <= 8, SEO fields)."""
    files = list(article.media.all())

    # Approved top-level comments with their approved replies — same shape
    # ArticleCommentListSerializer produced.
    comments = (
        Comment.objects
        .filter(article=article, status=Comment.Status.APPROVED, parent__isnull=True)
        .select_related('user')
        .prefetch_related(
            Prefetch(
                'children',
                queryset=Comment.objects.filter(status=Comment.Status.APPROVED).select_related('user'),
            ),
        )
        .order_by('-created_at')
    )

    # Approved doctor reviews for the article's category (<= 8, newest first)
    # — dicts matching the shape the old DoctorReviewArticleDetailSerializer produced.
    doctor_reviews_qs = (
        DoctorReview.objects
        .filter(
            appointment__service=article.category,
            status=DoctorReview.Status.APPROVED,
        )
        .select_related('appointment__patient', 'appointment__service')
        .order_by('-created_at')[:8]
    )
    doctor_reviews = [
        {
            'content': r.content,
            'rating': r.rating,
            'patient_name': (
                (f"{r.appointment.patient.first_name} {r.appointment.patient.last_name}".strip()
                 if r.appointment.patient_id
                 else f"{r.appointment.first_name or ''} {r.appointment.last_name or ''}".strip())
                or None
            ),
            'service_name': r.appointment.service.name,
        }
        for r in doctor_reviews_qs
    ]

    # TOC entries from heading blocks (index counts only headings — same
    # numbering render_content_blocks injects via heading_index).
    toc = []
    heading_index = 0
    for block in article.content_blocks or []:
        if block.get('type') == 'heading':
            heading_index += 1
            data = block.get('data') or {}
            toc.append({
                'index': heading_index,
                'level': str(data.get('level') or 2),
                'text': data.get('text') or '',
            })

    # First IMAGE media item -> og:image (mirrors post.js addArticleJsonLd)
    og_image = None
    for f in files:
        if f.media_type == ArticleMedia.MediaTypes.IMAGE and f.file:
            og_image = f.file.url
            break

    author = article.author
    author_photo = None
    try:
        if author.photos and author.photos.profile_photo:
            author_photo = author.photos.profile_photo.url
    except Exception:
        pass

    return {
        'article': article,
        'files': files,
        'comments': comments,
        'doctor_reviews': doctor_reviews,
        'toc': toc,
        'article_og_image': og_image,
        'author': author,
        'author_photo': author_photo,
    }


def post_detail(request, slug):
    """Render a single blog post (server-rendered, cached 10 min)."""
    article = get_object_or_404(
        Article.objects
        .select_related('author__user', 'category')
        .prefetch_related('media'),
        slug=slug,
        is_published=True,
    )
    return render_cached_page(
        request,
        'blog/post.html',
        page_cache_key('post_article', slug),
        CACHE_TTL['article_detail'],
        lambda: _article_detail_context(article),
    )


def _before_after_context():
    """Seed for the before/after gallery — mirrors /api/before-afters/
    (first 20, same select_related) the page JS consumed."""
    items = list(
        BeforeAfter.objects.select_related(
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
            'appointment__patient__first_name',
            'appointment__patient__last_name',
            'appointment__service__name'
        ).order_by('-created_at')[:20]
    )
    from backend.api.before_after.serializers import BeforeAfterSerializer
    items_json = BeforeAfterSerializer(items, many=True).data

    # Unique service names (order-preserving) for the filter pills — same
    # logic buildFilters() used in before-after.js
    ba_service_names = []
    for it in items:
        name = it.appointment.service.name
        if name and name not in ba_service_names:
            ba_service_names.append(name)

    return {
        'items': items,
        # SSR only renders rows that actually have both images (a row missing
        # a file would 500 on .url — the old JS path rendered an empty string)
        'first_page_items': [it for it in items if it.before_image and it.after_image][:9],
        'items_json': items_json,
        'ba_service_names': ba_service_names,
        'services': Service.objects.all(),
    }


def before_after(request):
    """Render the before/after gallery page."""
    return render_cached_page(
        request,
        'blog/before-after.html',
        page_cache_key('before_after'),
        CACHE_TTL['static_pages'],
        _before_after_context,
    )
