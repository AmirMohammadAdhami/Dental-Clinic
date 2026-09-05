import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import (
    Prefetch, Avg, Q, F, FloatField, Value, Count, ExpressionWrapper,
)
from django.db.models.functions import Coalesce

from backend.apps.appointments.models import Service, DoctorReview, Appointment
from backend.apps.blog.models import BeforeAfter
from backend.apps.blog.widgets import BLOCK_TYPES
from backend.apps.doctors.models import Doctor, Certificate
from backend.security.cache import CACHE_TTL, page_cache_key, render_cached_page


def _doctor_average_rating_annotation():
    """Same average-rating annotation DoctorDetailAPIView used."""
    return Coalesce(
        Avg(
            ExpressionWrapper(
                (F('appointments__testimonials__professionalism_rating')
                 + F('appointments__testimonials__treatment_quality_rating')
                 + F('appointments__testimonials__communication_rating')) / 3.0,
                output_field=FloatField(),
            ),
            filter=Q(
                appointments__testimonials__status=DoctorReview.Status.APPROVED
            ),
        ),
        Value(0.0),
    )


# ── Public pages ──

def _team_context():
    """Seed for the team page — mirrors the /api/doctors/ feed (first 20,
    same queryset) plus services for the filter pills / dropdown.
    Only services that have at least one doctor offering them are shown."""
    from backend.api.doctors.views import _doctor_list_queryset
    from backend.apps.appointments.services import release_expired_reservations

    release_expired_reservations()
    return {
        'doctors': _doctor_list_queryset()[:20],
        'services': Service.objects.filter(doctors_offered__isnull=False).distinct(),
    }


def team(request):
    """Render the team/doctors listing page."""
    return render_cached_page(
        request,
        'blog/team.html',
        page_cache_key('team'),
        CACHE_TTL['doctors_list'],
        _team_context,
    )


def _doctor_detail_context(doctor):
    """Seed for the doctor profile page — mirrors the old DoctorDetailAPIView
    prefetches (reviews, before/after, certificates, articles <= 4)."""
    approved_reviews_qs = DoctorReview.objects.filter(
        status=DoctorReview.Status.APPROVED,
    ).select_related(
        'appointment__doctor__user',
        'appointment__patient',
        'appointment__service',
    )
    doctor = (
        Doctor.objects
        .select_related('user', 'testimonial')
        .prefetch_related(
            'photos',
            'services_offered',
            Prefetch('certificates', queryset=Certificate.objects.order_by('date')),
            'articles__media',
            Prefetch(
                'appointments__before_after',
                queryset=BeforeAfter.objects.select_related('appointment__service'),
                to_attr='_prefetched_before_after',
            ),
        )
        .annotate(
            average_rating=_doctor_average_rating_annotation(),
            completed_appointments_count=Count(
                'appointments',
                filter=Q(appointments__status=Appointment.Status.DONE),
            ),
        )
        .get(pk=doctor.pk)
    )

    # Reviews — same shape DoctorReviewSerializer produced (the JS review card
    # renders service_name as the reviewer name; preserved deliberately).
    reviews = [
        {
            'service_name': r.appointment.service.name,
            'content': r.content,
            'rating': r.rating,
            'created_at': r.created_at,
            'stars_range': range(max(0, min(5, round(r.rating or 0)))),
        }
        for r in approved_reviews_qs.filter(appointment__doctor=doctor).order_by('-created_at')
    ]

    # Before / After gallery + unique service names for the filter pills
    ba_qs = BeforeAfter.objects.filter(
        appointment__doctor=doctor,
    ).select_related('appointment__service').order_by('-created_at')
    all_ba_items = [
        {
            'description': ba.description,
            'before_image': ba.before_image.url,
            'after_image': ba.after_image.url,
            'service_name': ba.appointment.service.name,
        }
        for ba in ba_qs
    ]
    ba_service_names = []
    for item in all_ba_items:
        if item['service_name'] and item['service_name'] not in ba_service_names:
            ba_service_names.append(item['service_name'])

    # Show max 3 before/after items in the detail page
    before_after_items = all_ba_items[:3]
    ba_has_more = len(all_ba_items) > 3

    # Articles (max 4, newest first) with first video/image for the cards
    articles = []
    for a in doctor.articles.all()[:4]:
        media = list(a.media.all())
        first_video = next(
            (m for m in media if m.media_type == 'VIDEO' and (m.video_url or m.file)),
            None,
        )
        first_image = next(
            (m for m in media if m.media_type == 'IMAGE' and m.file),
            None,
        )
        articles.append({
            'title': a.title,
            'slug': a.slug,
            'is_video': first_video is not None,
            'video_url': (first_video.video_url or first_video.file.url) if first_video else '',
            'cover_url': first_image.file.url if first_image else '/static/images/home-video-preview/preview-1.jpg',
        })

    # Testimonial video URL (JS reads it to fill the video player)
    testimonial_video_url = ''
    try:
        if doctor.testimonial and doctor.testimonial.video:
            testimonial_video_url = doctor.testimonial.video.url
    except Exception:
        pass

    return {
        'doctor': doctor,
        'reviews': reviews,
        'before_after_items': before_after_items,
        'ba_has_more': ba_has_more,
        'ba_service_names': ba_service_names,
        'articles': articles,
        'articles_has_more': doctor.articles.count() > 4,
        'certificates': doctor.certificates.all(),
        'testimonial_video_url': testimonial_video_url,
    }


def doctor_detail(request, slug):
    """Render a single doctor profile (server-rendered, cached 5 min)."""
    doctor = get_object_or_404(Doctor, slug=slug)
    return render_cached_page(
        request,
        'blog/doctor.html',
        page_cache_key('doctor', slug),
        CACHE_TTL['doctor_detail'],
        lambda: _doctor_detail_context(doctor),
    )


# ── Doctor Dashboard pages ──

def _require_doctor(request):
    """Return True if user is authenticated and has a Doctor profile, else redirect."""
    if not request.user.is_authenticated:
        return redirect('accounts:login')
    if not hasattr(request.user, 'doctor'):
        return redirect('dashboard:dashboard')
    return True


@login_required
def doctor_dashboard_analytics(request):
    check = _require_doctor(request)
    if check is not True:
        return check
    return render(request, 'doctor_dashboard/analytics.html', {'active_page': 'analytics'})


@login_required
def doctor_dashboard_appointments(request):
    check = _require_doctor(request)
    if check is not True:
        return check
    return render(request, 'doctor_dashboard/appointments.html', {'active_page': 'appointments'})


@login_required
def doctor_dashboard_articles(request):
    check = _require_doctor(request)
    if check is not True:
        return check
    return render(request, 'doctor_dashboard/articles.html', {'active_page': 'articles'})


@login_required
def doctor_dashboard_article_editor(request):
    check = _require_doctor(request)
    if check is not True:
        return check
    article_id = request.GET.get('id')
    services = Service.objects.all().order_by('name')
    return render(request, 'doctor_dashboard/article_editor.html', {
        'active_page': 'articles',
        'article_id': int(article_id) if article_id and article_id.isdigit() else None,
        'services': services,
        'block_schema': json.dumps(BLOCK_TYPES, ensure_ascii=False),
    })


@login_required
def doctor_dashboard_comments(request):
    check = _require_doctor(request)
    if check is not True:
        return check
    return render(request, 'doctor_dashboard/comments.html', {'active_page': 'comments'})


@login_required
def doctor_dashboard_reviews(request):
    check = _require_doctor(request)
    if check is not True:
        return check
    return render(request, 'doctor_dashboard/reviews.html', {'active_page': 'reviews'})


@login_required
def doctor_dashboard_profile(request):
    check = _require_doctor(request)
    if check is not True:
        return check
    return render(request, 'doctor_dashboard/profile.html', {'active_page': 'profile'})