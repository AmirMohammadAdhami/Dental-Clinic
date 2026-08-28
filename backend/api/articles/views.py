from rest_framework.mixins import (ListModelMixin, RetrieveModelMixin)
from rest_framework.viewsets import GenericViewSet
from backend.apps.blog.models import Article, ArticleMedia
from backend.apps.appointments.models import DoctorReview
from django.db.models import Prefetch
from .serializers import ArticleListSerializer, ArticleDetailSerializer


class ArticleListApiView(ListModelMixin, RetrieveModelMixin,GenericViewSet):
    lookup_field = 'slug'
    def get_serializer_class(self):
        if self.action == 'list':
            return ArticleListSerializer
        elif self.action == 'retrieve':
            return ArticleDetailSerializer

    def get_queryset(self):
        if self.action == 'list':
            return (
                Article.objects
                .select_related('author__user', 'category')
                .prefetch_related(
                    Prefetch(
                        'media',
                        queryset=ArticleMedia.objects.all()
                    ),
                    'author__photos',
                )
                .only(
                    'id', 'title', 'slug', 'abstract', 'view_count', 'is_published', 'special_article',
                    'author__user__full_name',
                    'category__name', 'created_at',
                )
                .distinct()
            )
        elif self.action == 'retrieve':
            return (
                Article.objects
                .select_related('author__user', 'category')
                .prefetch_related(
                    'media',
                    Prefetch(
                        'category__appointments__testimonials',
                        queryset=DoctorReview.objects.select_related('appointment__service'),
                    ),
                )
                .distinct()
            )
