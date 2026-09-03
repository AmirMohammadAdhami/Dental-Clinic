from rest_framework import serializers

from backend.apps.blog.models import Comment


class CommentReplyPublicSerializer(serializers.ModelSerializer):
    commenter_name = serializers.CharField(read_only=True)
    avatar_initial = serializers.SerializerMethodField()
    avatar_photo = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'commenter_name', 'avatar_initial', 'avatar_photo', 'created_at']

    def get_avatar_initial(self, obj):
        name = obj.commenter_name
        return name[0] if name else 'ن'

    def get_avatar_photo(self, obj):
        if obj.user and hasattr(obj.user, 'doctor'):
            try:
                doctor = obj.user.doctor
                if hasattr(doctor, 'photos') and doctor.photos and doctor.photos.profile_photo:
                    return doctor.photos.profile_photo.url
            except Exception:
                pass
        return None


class ArticleCommentListSerializer(serializers.ModelSerializer):
    commenter_name = serializers.CharField(read_only=True)
    avatar_initial = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'commenter_name', 'avatar_initial', 'created_at', 'replies']
        read_only_fields = ['id', 'created_at']

    def get_avatar_initial(self, obj):
        name = obj.commenter_name
        return name[0] if name else 'ن'

    def get_replies(self, obj):
        children = obj.children.filter(status=Comment.Status.APPROVED).select_related('user').order_by('created_at')
        return CommentReplyPublicSerializer(children, many=True).data


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
