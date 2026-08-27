from rest_framework import serializers

from backend.apps.blog.models import Article, ArticleMedia


class ArticleMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleMedia
        fields = ['media_type', 'file', 'video_url']


class ArticleListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='author.user.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    files = ArticleMediaSerializer(source='media', many=True, read_only=True)
    profile_photo = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ['id', 'full_name', 'title', 'slug', 'special_article', 'abstract', 'view_count',
                  'files', 'category_name', 'profile_photo', 'is_published', 'created_at']

    def get_profile_photo(self, obj):
        try:
            return obj.author.photos.profile_photo.url if obj.author.photos and obj.author.photos.profile_photo else None
        except Exception:
            return None


