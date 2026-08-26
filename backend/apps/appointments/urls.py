from django.urls import path
from backend.apps.appointments import views


app_name = 'dashboard'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('appointments/', views.appointments, name='appointments'),
    path('appointment/<str:tracking_code>', views.appointment, name='appointment'),
    path('finalize_information/<str:tracking_code>', views.finalize_information, name='finalize_information'),
    path('gallery/', views.gallery , name='gallery'),
    path('notifications/', views.notifications, name='notifications'),
    path('select-doctors/<str:service>', views.select_doctors, name='select_doctors'),
]