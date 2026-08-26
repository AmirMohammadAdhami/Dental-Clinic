from django.shortcuts import render

# Create your views here.
def auth(request):
    return render(request, 'auth/auth.html')

def login(request):
    return render(request, 'auth/login.html')

def login_info(request):
    return render(request, 'auth/login-info.html')

def otp(request):
    return render(request, 'auth/otp.html')