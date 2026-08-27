from rest_framework import serializers
from backend.apps.blog.models import Article, ArticleMedia


class ArticleMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleMedia
        fields = ['media_type','file','video_url']


class ArticleListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='author.user.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    files = ArticleMediaSerializer(source='media', many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'full_name', 'title', 'slug', 'files', 'category_name', 'is_published']