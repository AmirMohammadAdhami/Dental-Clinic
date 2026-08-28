from rest_framework import serializers

from backend.api.base_serializers import ArticleMediaSerializer
from backend.api.doctors.serializers import DoctorReviewSerializer
from backend.apps.appointments.models import DoctorReview
from backend.apps.blog.models import Article


class DoctorReviewArticleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorReview
        fields = ['id', 'rating', 'content']


class ArticleListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='author.user.full_name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    files = ArticleMediaSerializer(source='media', many=True, read_only=True)
    profile_photo = serializers.SerializerMethodField()
    reading_time = serializers.IntegerField(read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'full_name', 'title', 'slug', 'special_article', 'abstract', 'view_count',
                  'files', 'category_name', 'profile_photo', 'reading_time', 'is_published', 'created_at']

    def get_profile_photo(self, obj):
        try:
            return obj.author.photos.profile_photo.url if obj.author.photos and obj.author.photos.profile_photo else None
        except Exception:
            return None


class ArticleDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    profile_photo = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='author.user.full_name', read_only=True)
    author_specialty = serializers.CharField(source='author.specialty', read_only=True)
    reading_time = serializers.IntegerField(read_only=True)
    files = ArticleMediaSerializer(source='media', many=True, read_only=True)
    author_bio = serializers.CharField(source='author.bio', read_only=True)
    doctor_reviews = DoctorReviewSerializer(source='category.appointments.testimonials', many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'category_name', 'title', 'profile_photo', 'full_name', 'author_specialty', 'updated_at',
                  'reading_time', 'files', 'content_blocks', 'author_bio',
                  'doctor_reviews']

    def get_profile_photo(self, obj):
        try:
            return obj.author.photos.profile_photo.url if obj.author.photos and obj.author.photos.profile_photo else None
        except Exception:
            return None
