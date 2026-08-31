from django.urls import path
from backend.apps.doctors import views

app_name = 'doctors'

urlpatterns = [
    # Doctor Dashboard (must be above <str:slug>/ to avoid catch-all)
    path('dashboard/', views.doctor_dashboard_analytics, name='doctor_dashboard_analytics'),
    path('dashboard/appointments/', views.doctor_dashboard_appointments, name='doctor_dashboard_appointments'),
    path('dashboard/articles/', views.doctor_dashboard_articles, name='doctor_dashboard_articles'),
    path('dashboard/article-editor/', views.doctor_dashboard_article_editor, name='doctor_dashboard_article_editor'),
    path('dashboard/comments/', views.doctor_dashboard_comments, name='doctor_dashboard_comments'),
    path('dashboard/reviews/', views.doctor_dashboard_reviews, name='doctor_dashboard_reviews'),
    path('dashboard/profile/', views.doctor_dashboard_profile, name='doctor_dashboard_profile'),

    # Public (slug must be last - it catches everything)
    path('', views.team, name='team'),
    path('<str:slug>/', views.doctor_detail, name='doctor_detail'),
]
