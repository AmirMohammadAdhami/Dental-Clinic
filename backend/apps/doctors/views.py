from django.shortcuts import render

# Create your views here.
def team(request):
    """Render the team/doctors listing page."""
    return render(request, 'blog/team.html')


def doctor_detail(request, slug):
    """Render a single doctor profile."""
    return render(request, 'blog/doctor.html')