from rest_framework import serializers

from backend.api.base_serializers import ArticleMediaSerializer
from backend.apps.appointments.models import DoctorReview
from backend.apps.blog.models import Article, Comment


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
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Article
        fields = ['id', 'category_name', 'title', 'profile_photo', 'full_name', 'author_specialty','author_university', 'updated_at',
                  'reading_time', 'files','abstract', 'content_blocks', 'author_bio',
                  'doctor_reviews', 'comments_count']

    def get_profile_photo(self, obj):
        try:
            return obj.author.photos.profile_photo.url if obj.author.photos and obj.author.photos.profile_photo else None
        except Exception:
            return None

    def get_comments_count(self, obj):
        from backend.apps.blog.models import Comment
        return Comment.objects.filter(article=obj, status=Comment.Status.APPROVED).count()

    def get_doctor_reviews(self, obj):
        return DoctorReviewArticleDetailSerializer(
            DoctorReview.objects.filter(
                appointment__service=obj.category,
                status=DoctorReview.Status.APPROVED,
            ).select_related('appointment__patient', 'appointment__service').order_by('-created_at')[:8],
            many=True,
        ).data


class ArticleCommentListSerializer(serializers.ModelSerializer):
    commenter_name = serializers.CharField(read_only=True)
    avatar_initial = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'commenter_name', 'avatar_initial', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_avatar_initial(self, obj):
        name = obj.commenter_name
        return name[0] if name else 'ن'


class ArticleCommentCreateSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=2000, trim_whitespace=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context.get('request')
        is_guest = not (request and request.user and request.user.is_authenticated)
        if is_guest:
            if not attrs.get('first_name', '').strip():
                raise serializers.ValidationError({'first_name': 'نام اجباری است.'})
            if not attrs.get('last_name', '').strip():
                raise serializers.ValidationError({'last_name': 'نام خانوادگی اجباری است.'})
        return attrs

    def create(self, validated_data):
        request = self.context['request']
        article = self.context['article']
        comment = Comment(
            article=article,
            content=validated_data['content'].strip(),
        )
        if request.user and request.user.is_authenticated:
            comment.user = request.user
        else:
            comment.guest_first_name = validated_data.get('first_name', '').strip()
            comment.guest_last_name = validated_data.get('last_name', '').strip()
        comment.save()
        return comment
