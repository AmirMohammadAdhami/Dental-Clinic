from django.urls import path
from backend.apps.accounts import views

app_name = 'accounts'

urlpatterns = [
    # Auth URLs
    path('login/', views.login_user, name='login'),
    path('otp/', views.otp, name='otp'),
    path('login-info/', views.login_info, name='login-info'),
    path('resend-otp/', views.resend_otp, name='resend-otp'),
]