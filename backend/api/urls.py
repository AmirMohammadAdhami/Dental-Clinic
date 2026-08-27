from django.urls import path

from backend.api.assistants.views import AssistantListAPIView
from backend.api.doctors.views import DoctorListAPIView
from backend.api.before_after.views import BeforeAfterListApiView
from backend.api.faq.views import FAQListApiView
from backend.api.services.views import ServiceListApiView
from backend.api.testimonials.views import TestimonialListApiView
from backend.api.articles_videos.views import ArticleListApiView

app_name = 'api'

urlpatterns = [
    path('doctors/', DoctorListAPIView.as_view(), name='doctor-list'),
    path('assistants/', AssistantListAPIView.as_view(), name='assistant-list'),
    path('before-afters/', BeforeAfterListApiView.as_view(), name='before-after-list'),
    path('testimonials/', TestimonialListApiView.as_view(), name='testimonial-list'),
    path('home-videos/', ArticleListApiView.as_view(), name='home-video-list'),
    path('services/', ServiceListApiView.as_view(), name='service-list'),
    path('faqs/', FAQListApiView.as_view(), name='faq-list'),
]