from django.urls import path
from backend.apps.accounts import views

app_name = 'accounts'

urlpatterns = [
    #Auth Urls
    path('auth/', views.auth, name='auth'),
    path('login/', views.login, name='login'),
    path('login-info/', views.login_info, name='login_info'),
    path('otp/', views.login_info, name='otp'),
]