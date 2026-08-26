from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    path('', views.blog_index, name='blog_index'),
    path('articles/', views.all_articles, name='all_articles'),
    path('article/<slug:slug>/', views.post_detail, name='post_detail'),
    path('team/', views.team, name='team'),
    path('doctor/<slug:slug>/', views.doctor_detail, name='doctor_detail'),
    path('before-after/', views.before_after, name='before_after'),
]