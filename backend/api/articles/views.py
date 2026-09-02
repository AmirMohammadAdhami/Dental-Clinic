from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.mixins import (ListModelMixin, RetrieveModelMixin)
from rest_framework.viewsets import GenericViewSet
from backend.apps.blog.models import Article, ArticleMedia, Comment
from django.db.models import Prefetch
from backend.security.cache import CACHE_TTL, cache, invalidate_article, article_comments_key
from .serializers import ArticleListSerializer, ArticleDetailSerializer, ArticleCommentListSerializer, ArticleCommentCreateSerializer
from ...security.throttle import CommentAnonThrottle,CommentUserThrottle


@method_decorator(cache_page(CACHE_TTL['article_detail']), name='dispatch')
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
                .order_by('-created_at')
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
    throttle_classes = [CommentAnonThrottle, CommentUserThrottle]
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
        slug = self.kwargs.get('slug')

        # Check cache first
        cache_key = article_comments_key(slug)
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            cache.set(cache_key, response.data, CACHE_TTL['article_comments'])
        return response

    def create(self, request, *args, **kwargs):
        article = self.get_article()
        if not article:
            return Response({'detail': 'مقاله یافت نشد.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save()

        # New comment → invalidate this article's comments cache.
        invalidate_article(article.slug)

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
