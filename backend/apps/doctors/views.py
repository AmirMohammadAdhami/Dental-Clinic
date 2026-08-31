import json
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from backend.apps.appointments.models import Service
from backend.apps.blog.widgets import BLOCK_TYPES


# ── Public pages ──

def team(request):
    """Render the team/doctors listing page."""
    return render(request, 'blog/team.html')


def doctor_detail(request, slug):
    """Render a single doctor profile."""
    return render(request, 'blog/doctor.html')


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