from rest_framework import serializers
from backend.apps.blog.models import Article, ArticleMedia


class ArticleMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleMedia
        fields = ['file', 'video_url']


class ArticleListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    videos = serializers.SerializerMethodField()
    class Meta:
        model = Article
        fields = ['id', 'full_name','title', 'slug', 'videos','category_name', 'is_published']

    def get_full_name(self, obj):
        return obj.author.user.full_name

    def get_category_name(self, obj):
        return obj.category.name

    def get_videos(self, obj):
        return ArticleMediaSerializer(obj.media.all(), many=True).data