from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from backend.apps.blog.models import Article, Comment
from backend.security.cache import cache, invalidate_article, article_comments_key, CACHE_TTL
from .serializers import ArticleCommentListSerializer, ArticleCommentCreateSerializer
from ...security.throttle import CommentAnonThrottle, CommentUserThrottle


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
