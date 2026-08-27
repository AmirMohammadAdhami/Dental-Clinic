from rest_framework.generics import ListAPIView
from backend.apps.blog.models import Article, ArticleMedia
from django.db.models import Prefetch
from .serializers import ArticleListSerializer


class ArticleListApiView(ListAPIView):
    serializer_class = ArticleListSerializer

    queryset = (
        Article.objects
        .select_related('author__user', 'category')
        .prefetch_related(
            Prefetch(
                'media',
                queryset=ArticleMedia.objects.all()

            )
        )
        .only(
            'id', 'title', 'slug', 'is_published',
            'author__user__full_name',
            'category__name','created_at',
        )
        .distinct()
    )
