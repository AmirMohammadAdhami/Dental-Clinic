from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    path('', views.blog_index, name='blog_index'),
    path('articles/', views.all_articles, name='all_articles'),
    path('article/<str:slug>/', views.post_detail, name='post_detail'),
    path('before_after/', views.before_after, name='before_after'),
]