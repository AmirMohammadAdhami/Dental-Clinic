from rest_framework import serializers
from backend.apps.blog.models import ArticleMedia


class ArticleMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArticleMedia
        fields = ['media_type', 'file', 'video_url']
