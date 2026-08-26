from django.urls import path
from backend.apps.doctors import views

app_name = 'doctors'

urlpatterns = [
    path('', views.team, name='team'),
    path('<slug:slug>/', views.doctor_detail, name='doctor_detail'),
]