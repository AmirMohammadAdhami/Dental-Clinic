from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.mixins import (ListModelMixin, RetrieveModelMixin)
from rest_framework.viewsets import GenericViewSet
from backend.apps.blog.models import Article, ArticleMedia, Comment
from backend.apps.appointments.models import DoctorReview
from django.db.models import Prefetch
from .serializers import ArticleListSerializer, ArticleDetailSerializer, ArticleCommentListSerializer, ArticleCommentCreateSerializer


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
                )
                .distinct()
            )


class ArticleCommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ArticleCommentCreateSerializer
        return ArticleCommentListSerializer

    def get_queryset(self):
        slug = self.kwargs.get('slug')
        return (
            Comment.objects
            .filter(article__slug=slug, status=Comment.Status.APPROVED, parent__isnull=True)
            .order_by('-created_at')
        )

    def get_article(self):
        slug = self.kwargs.get('slug')
        try:
            return Article.objects.get(slug=slug)
        except Article.DoesNotExist:
            return None

    def list(self, request, *args, **kwargs):
        article = self.get_article()
        if not article:
            return Response({'detail': 'مقاله یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        article = self.get_article()
        if not article:
            return Response({'detail': 'مقاله یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()
        return Response(
            ArticleCommentListSerializer(comment).data,
            status=status.HTTP_201_CREATED
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        slug = self.kwargs.get('slug')
        try:
            context['article'] = Article.objects.get(slug=slug)
        except Article.DoesNotExist:
            context['article'] = None
        return context
