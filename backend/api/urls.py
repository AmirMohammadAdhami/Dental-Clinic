from django.urls import path

from backend.api.dashboard.views import UserDashboardAPIView
from backend.api.doctors.views import DoctorListAPIView
from backend.api.doctor_availability.views import DoctorAvailabilityAPIView
from backend.api.appointments.views import AppointmentCreateAPIView, AppointmentDetailAPIView
from backend.api.gallery.views import GalleryListApiView
from backend.api.services.views import ServiceListApiView
from backend.api.doctor_reviews.views import DoctorReviewListApiView, DoctorReviewCreateApiView
from backend.api.articles.views import ArticleCommentListCreateView
from backend.api.notifications.views import (
    NotificationListAPIView,
    NotificationMarkReadAPIView,
    NotificationMarkAllReadAPIView,
    ReminderSettingAPIView,
)
from backend.api.doctor_dashboard.views import (
    DoctorDashboardOverviewView,
    DoctorAppointmentsListView,
    DoctorAppointmentPrescriptionView,
    DoctorArticleListCreateView,
    DoctorArticleDetailView,
    DoctorArticleMediaUploadView,
    DoctorCommentListView,
    DoctorCommentReplyView,
    DoctorReviewListView,
    DoctorProfileView,
)



app_name = 'api'

urlpatterns = [
    path('doctors/', DoctorListAPIView.as_view(), name='doctor-list'),
    path('doctors/<str:slug>/availability/', DoctorAvailabilityAPIView.as_view(), name='doctor-availability'),

    path('appointments/', AppointmentCreateAPIView.as_view(), name='appointment-create'),
    path('appointments/<str:tracking_code>/', AppointmentDetailAPIView.as_view(), name='appointment-detail'),

    # Dashboard Gallery
    path('gallery/', GalleryListApiView.as_view(), name='gallery-list'),
    path('doctor-reviews/', DoctorReviewListApiView.as_view(), name='doctor-review-list'),
    path('doctor-reviews/create/', DoctorReviewCreateApiView.as_view(), name='doctor-review-create'),
    path('articles/<str:slug>/comments/', ArticleCommentListCreateView.as_view(), name='article-comments'),
    path('services/', ServiceListApiView.as_view(), name='service-list'),
    path('dashboard/me/', UserDashboardAPIView.as_view(), name='user-dashboard'),


    # Notifications
    path('notifications/', NotificationListAPIView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', NotificationMarkReadAPIView.as_view(), name='notification-mark-read'),
    path('notifications/mark-all-read/', NotificationMarkAllReadAPIView.as_view(), name='notification-mark-all-read'),

    # Reminder Settings
    path('reminders/settings/', ReminderSettingAPIView.as_view(), name='reminder-settings'),

    # -- Doctor Dashboard API --
    path('doctor-dashboard/overview/', DoctorDashboardOverviewView.as_view(), name='doctor-dashboard-overview'),
    path('doctor-dashboard/appointments/', DoctorAppointmentsListView.as_view(), name='doctor-dashboard-appointments'),
    path('doctor-dashboard/appointments/<int:pk>/prescription/', DoctorAppointmentPrescriptionView.as_view(), name='doctor-dashboard-prescription'),
    path('doctor-dashboard/articles/', DoctorArticleListCreateView.as_view(), name='doctor-dashboard-articles'),
    path('doctor-dashboard/articles/<int:pk>/', DoctorArticleDetailView.as_view(), name='doctor-dashboard-article-detail'),
    path('doctor-dashboard/articles/<int:article_id>/media/', DoctorArticleMediaUploadView.as_view(), name='doctor-dashboard-article-media'),
    path('doctor-dashboard/articles/<int:article_id>/media/<int:media_id>/', DoctorArticleMediaUploadView.as_view(), name='doctor-dashboard-article-media-detail'),
    path('doctor-dashboard/comments/', DoctorCommentListView.as_view(), name='doctor-dashboard-comments'),
    path('doctor-dashboard/comments/<int:pk>/reply/', DoctorCommentReplyView.as_view(), name='doctor-dashboard-comment-reply'),
    path('doctor-dashboard/reviews/', DoctorReviewListView.as_view(), name='doctor-dashboard-reviews'),
    path('doctor-dashboard/profile/', DoctorProfileView.as_view(), name='doctor-dashboard-profile'),
]
