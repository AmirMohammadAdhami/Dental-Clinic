from django.urls import path
from backend.api.dashboard.views import UserDashboardAPIView
from backend.api.assistants.views import AssistantListAPIView
from backend.api.doctors.views import DoctorListAPIView, DoctorDetailAPIView
from backend.api.before_after.views import BeforeAfterListApiView
from backend.api.faq.views import FAQListApiView
from backend.api.services.views import ServiceListApiView
from backend.api.doctor_reviews.views import DoctorReviewListApiView
from backend.api.articles.views import ArticleListApiView
from backend.api.notifications.views import (
    NotificationListAPIView,
    NotificationMarkReadAPIView,
    NotificationMarkAllReadAPIView,
    ReminderSettingAPIView,
)

app_name = 'api'

urlpatterns = [
    path('doctors/', DoctorListAPIView.as_view(), name='doctor-list'),
    path('doctors/<str:slug>/', DoctorDetailAPIView.as_view(), name='doctor-detail'),
    path('assistants/', AssistantListAPIView.as_view(), name='assistant-list'),
    path('before-afters/', BeforeAfterListApiView.as_view(), name='before-after-list'),
    path('doctor-reviews/', DoctorReviewListApiView.as_view(), name='doctor-review-list'),
    path('home-videos/', ArticleListApiView.as_view({'get': 'list'}), name='home-video-list'),
    path('home-videos/<str:slug>/', ArticleListApiView.as_view({'get': 'retrieve'}), name='home-video-detail'),
    path('articles/<str:slug>/', ArticleListApiView.as_view({'get': 'retrieve'}), name='article-detail'),
    path('services/', ServiceListApiView.as_view(), name='service-list'),
    path('faqs/', FAQListApiView.as_view(), name='faq-list'),
    path('dashboard/me/', UserDashboardAPIView.as_view(), name='user-dashboard'),

    # Notifications
    path('notifications/', NotificationListAPIView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', NotificationMarkReadAPIView.as_view(), name='notification-mark-read'),
    path('notifications/mark-all-read/', NotificationMarkAllReadAPIView.as_view(), name='notification-mark-all-read'),

    # Reminder Settings
    path('reminders/settings/', ReminderSettingAPIView.as_view(), name='reminder-settings'),
]
