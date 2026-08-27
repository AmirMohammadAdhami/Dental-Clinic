from rest_framework.generics import ListAPIView
from backend.apps.blog.models import Article, ArticleMedia
from django.db.models import Prefetch
from .serializers import ArticleListSerializer


class ArticleListApiView(ListAPIView):
    serializer_class = ArticleListSerializer

    queryset = (
        Article.objects
        .select_related(
            'author__user',
            'category',
        )
        .prefetch_related(
            Prefetch(
                'media',
                queryset=ArticleMedia.objects.filter(
                    media_type=ArticleMedia.MediaTypes.VIDEO
                )
            )
        )
        .only(
            'id',
            'author__user__full_name',
            'title',
            'slug',
            'category__name',
            'is_published',
        )
        .filter(
            media__media_type=ArticleMedia.MediaTypes.VIDEO
        )
        .distinct()
    )
