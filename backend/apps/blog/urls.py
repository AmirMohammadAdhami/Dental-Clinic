from django.urls import path
from .views import teamview


app_name = 'blog'

urlpatterns = [
    path('team/', teamview, name='team'),
]