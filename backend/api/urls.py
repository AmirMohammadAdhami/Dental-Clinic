from django.urls import path

from backend.api.assistants.views import AssistantListAPIView
from backend.api.doctors.views import DoctorListAPIView
from backend.api.before_after.views import BeforeAfterListApiView

app_name = 'api'

urlpatterns = [
    path('doctors/', DoctorListAPIView.as_view(), name='doctor-list'),
    path('assistants/', AssistantListAPIView.as_view(), name='assistant-list'),
    path('before-afters/', BeforeAfterListApiView.as_view(), name='before-after-list'),
]