from django.shortcuts import render
from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.db.models import Prefetch

from backend.security.cache import CACHE_TTL, page_cache_key, render_cached_page
from backend.apps.blog.models import Article, ArticleMedia, BeforeAfter
from backend.apps.appointments.models import DoctorReview


def _author_photo(article):
    """Profile photo URL of an article's author (same fallback logic as
    ArticleListSerializer.get_profile_photo)."""
    try:
        photos = article.author.photos
        if photos and photos.profile_photo:
            return photos.profile_photo.url
    except Exception:
        pass
    return None


def _home_context():
    """Mirror the API semantics the home page JS consumed:
    - /api/doctors/       → first 20 doctors (newest first)
    - /api/assistants/    → first 20 assistants (newest first)
    - /api/before-afters/ → first 20 then .slice(-6) in JS
    - /api/doctor-reviews/→ first 20 approved then .slice(-12) in JS
    - /api/home-videos/   → articles of the first 20 that have a VIDEO media
                            item, then .slice(-6) in JS
    """
    from backend.api.doctors.views import _doctor_list_queryset
    from backend.apps.appointments.services import release_expired_reservations
    from backend.apps.doctors.models import Assistant

    # Doctors (same queryset the /api/doctors/ feed serves)
    release_expired_reservations()
    doctors = list(_doctor_list_queryset()[:20])

    # Assistants
    assistants = list(
        Assistant.objects.select_related('user').only(
            'id', 'speciality', 'blog_photo', 'user__first_name', 'user__last_name'
        ).order_by('-created_at')[:20]
    )

    # Before / After (JS did .slice(-6) on the first page of 20)
    ba_items = list(
        BeforeAfter.objects.select_related(
            'appointment__doctor__user',
            'appointment__patient',
            'appointment__service',
        ).order_by('-created_at')[:20]
    )

    # Patient reviews — rendered as dicts matching the old /api/doctor-reviews/
    # payload shape (full_name, service_name, stars for the star row).
    review_qs = (
        DoctorReview.objects
        .select_related(
            'appointment__doctor__user',
            'appointment__patient',
            'appointment__service',
        )
        .filter(status=DoctorReview.Status.APPROVED)
        .order_by('-created_at')
        .only(
            'id', 'content', 'status', 'created_at',
            'professionalism_rating', 'treatment_quality_rating', 'communication_rating',
            'appointment__doctor__user__first_name',
            'appointment__doctor__user__last_name',
            'appointment__first_name',
            'appointment__last_name',
            'appointment__patient__first_name',
            'appointment__patient__last_name',
            'appointment__service__id',
            'appointment__service__name',
        )[:20]
    )
    review_items = [
        {
            'content': r.content,
            'full_name': (
                (f"{r.appointment.patient.first_name} {r.appointment.patient.last_name}".strip()
                 if r.appointment.patient_id
                 else f"{r.appointment.first_name or ''} {r.appointment.last_name or ''}".strip())
                or None
            ),
            'service_name': r.appointment.service.name,
            # Same star math as home.js: round(avg of the three sub-ratings)
            'stars_range': range(max(0, min(5, round(
                (r.professionalism_rating + r.treatment_quality_rating + r.communication_rating) / 3
            )))),
        }
        for r in review_qs
    ]

    # Video blog cards: articles (of the first 20) that have a VIDEO media item
    videos_qs = (
        Article.objects.filter(is_published=True)
        .select_related('author__user', 'category')
        .prefetch_related(
            Prefetch('media', queryset=ArticleMedia.objects.all()),
            'author__photos',
        )
        .order_by('-created_at')
    )
    video_articles = []
    for article in list(videos_qs[:20]):
        media = list(article.media.all())
        first_video = next(
            (m for m in media
             if m.media_type == ArticleMedia.MediaTypes.VIDEO and (m.video_url or m.file)),
            None,
        )
        if not first_video:
            continue
        first_image = next(
            (m for m in media
             if m.media_type == ArticleMedia.MediaTypes.IMAGE and m.file),
            None,
        )
        video_articles.append({
            'article': article,
            'video_url':first_video.video_url or (first_video.processed_file.url if first_video.processed_file else ''),
            'cover_url': (first_image.file.url if first_image and first_image.file else ''),
            'author_photo': _author_photo(article),
        })

    return {
        'doctors': doctors,
        'assistants': assistants,
        # .slice(-6) / .slice(-12) semantics of the old JS consumers
        'before_afters': ba_items[-6:],
        'testimonials': review_items[-12:],
        'videos': video_articles[-6:],
    }


def home(request):
    return render_cached_page(
        request,
        'home/index.html',
        page_cache_key('home'),
        CACHE_TTL['static_pages'],
        _home_context,
    )


@require_GET
def robots_txt(request):
    scheme = 'https' if request.is_secure() else 'http'
    host = request.get_host()
    site_url = f'{scheme}://{host}'
    response = render(request, 'robots.txt', {'site_url': site_url})
    response['Content-Type'] = 'text/plain'
    return response
