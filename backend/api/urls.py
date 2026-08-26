from django.urls import path

from backend.api.assistants.views import AssistantListAPIView
from backend.api.doctors.views import DoctorListAPIView

app_name = 'api'

urlpatterns = [
    path('doctors/', DoctorListAPIView.as_view(), name='doctor-list'),
    path('assistants/', AssistantListAPIView.as_view(), name='assistant-list'),
]