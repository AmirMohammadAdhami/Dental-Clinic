from django.shortcuts import render

# Create your views here.
def teamview(request):
    return render(request, 'blog/team.html')