from rest_framework import serializers

from backend.api.base_serializers import ArticleMediaSerializer
from backend.apps.appointments.models import DoctorReview
from backend.apps.blog.models import Article


class DoctorReviewArticleDetailSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='appointment.service.name', read_only=True)

    class Meta:
        model = DoctorReview
        fields = ['id', 'rating', 'content', 'user_name', 'category_name']

    def get_user_name(self, obj):
        patient = obj.appointment.patient
        if patient:
            name = f"{patient.first_name} {patient.last_name}".strip()
            return name or patient.full_name or None
        name = f"{obj.appointment.first_name or ''} {obj.appointment.last_name or ''}".strip()
        return name or None


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
    author_specialty = serializers.CharField(source='author.speciality', read_only=True)
    author_university = serializers.CharField(source='author.university', read_only=True)
    reading_time = serializers.IntegerField(read_only=True)
    files = ArticleMediaSerializer(source='media', many=True, read_only=True)
    author_bio = serializers.CharField(source='author.bio', read_only=True)
    doctor_reviews = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ['id', 'category_name', 'title', 'profile_photo', 'full_name', 'author_specialty','author_university', 'updated_at',
                  'reading_time', 'files','abstract', 'content_blocks', 'author_bio',
                  'doctor_reviews']

    def get_profile_photo(self, obj):
        try:
            return obj.author.photos.profile_photo.url if obj.author.photos and obj.author.photos.profile_photo else None
        except Exception:
            return None

    def get_doctor_reviews(self, obj):
        return DoctorReviewArticleDetailSerializer(
            DoctorReview.objects.filter(
                appointment__service=obj.category,
                status=DoctorReview.Status.APPROVED,
            ).select_related('appointment__patient', 'appointment__service').order_by('-created_at')[:8],
            many=True,
        ).data
