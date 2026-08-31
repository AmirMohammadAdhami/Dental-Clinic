from rest_framework import serializers

from backend.api.base_serializers import ArticleMediaSerializer
from backend.apps.appointments.models import Appointment, Service, DoctorReview, MedicalRecord
from backend.apps.blog.models import Article, Comment
from backend.apps.doctors.models import Doctor, DoctorPhotos, Certificate


# ── Profile ──────────────────────────────────────────────────────

class DoctorPhotosSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorPhotos
        fields = ['profile_photo', 'blog_photo']


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name']


class CertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ['id', 'date', 'what', 'where']


class DoctorProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    phone = serializers.CharField(source='user.phone', read_only=True)
    doctor_photos = DoctorPhotosSerializer(source='photos', read_only=True)
    services_offered = ServiceSerializer(many=True, read_only=True)
    certificates = CertificateSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'slug', 'full_name', 'first_name', 'last_name', 'phone',
            'speciality', 'university', 'years_of_experience', 'bio',
            'working_days', 'medical_license_number',
            'doctor_photos', 'services_offered', 'certificates',
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        if user_data:
            for attr, value in user_data.items():
                setattr(user, attr, value)
            user.save()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


# ── Overview ──────────────────────────────────────────────────────

class TodayAppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ['id', 'patient_name', 'service_name', 'appointment_date', 'status']

    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.full_name
        return f"{obj.first_name or ''} {obj.last_name or ''}".strip() or 'ناشناخته'

    def get_service_name(self, obj):
        return obj.service.name if obj.service else ''


class TreatmentBreakdownSerializer(serializers.Serializer):
    service_name = serializers.CharField()
    count = serializers.IntegerField()


class MonthlyVisitsSerializer(serializers.Serializer):
    month = serializers.CharField()
    count = serializers.IntegerField()


class DoctorDashboardOverviewSerializer(serializers.Serializer):
    total_patients = serializers.IntegerField()
    total_appointments_year = serializers.IntegerField()
    average_rating = serializers.FloatField()
    published_articles_count = serializers.IntegerField()
    today_appointments = TodayAppointmentSerializer(many=True)
    treatment_breakdown = TreatmentBreakdownSerializer(many=True)
    monthly_visits = MonthlyVisitsSerializer(many=True)


# ── Appointments ──────────────────────────────────────────────────

class MedicalRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MedicalRecord
        fields = ['id', 'description']


class DoctorAppointmentListSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()
    medical_records = MedicalRecordSerializer(many=True, read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient_name', 'service_name', 'appointment_date',
            'status', 'prescription_text', 'prescription_file',
            'tracking_code', 'medical_records', 'created_at',
        ]

    def get_patient_name(self, obj):
        if obj.patient:
            return obj.patient.full_name
        return f"{obj.first_name or ''} {obj.last_name or ''}".strip() or 'ناشناخته'

    def get_service_name(self, obj):
        return obj.service.name if obj.service else ''


class PrescriptionUpdateSerializer(serializers.Serializer):
    prescription_text = serializers.CharField()

    def update(self, instance, validated_data):
        instance.prescription_text = validated_data['prescription_text']
        instance.save(update_fields=['prescription_text', 'updated_at'])
        return instance


# ── Articles ──────────────────────────────────────────────────────

class DoctorArticleListSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='category.name', read_only=True)
    files = ArticleMediaSerializer(source='media', many=True, read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'service_name', 'abstract',
            'is_published', 'view_count', 'files',
            'created_at', 'updated_at',
        ]


class DoctorArticleCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Article
        fields = [
            'id', 'title', 'category', 'abstract', 'content',
            'content_blocks', 'is_published',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user.doctor
        return super().create(validated_data)


class DoctorArticleDetailSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='category.name', read_only=True)
    files = ArticleMediaSerializer(source='media', many=True, read_only=True)

    class Meta:
        model = Article
        fields = [
            'id', 'title', 'slug', 'service_name', 'abstract', 'content',
            'content_blocks', 'is_published', 'view_count', 'files',
            'created_at', 'updated_at',
        ]


# ── Comments ──────────────────────────────────────────────────────

class CommentReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CommentChildSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'content', 'user_name', 'created_at']

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.full_name or f"{obj.user.first_name} {obj.user.last_name}"
        return ''


class DoctorCommentListSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    article_title = serializers.CharField(source='article.title', read_only=True)
    article_slug = serializers.CharField(source='article.slug', read_only=True)
    replies = CommentChildSerializer(many=True, read_only=True)

    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'user_name', 'status',
            'article_title', 'article_slug', 'replies', 'created_at',
        ]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.full_name or f"{obj.user.first_name} {obj.user.last_name}"
        return ''


# ── Reviews ───────────────────────────────────────────────────────

class DoctorReviewListSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = DoctorReview
        fields = [
            'id', 'patient_name', 'service_name', 'content',
            'professionalism_rating', 'treatment_quality_rating',
            'communication_rating', 'rating', 'created_at',
        ]

    def get_patient_name(self, obj):
        if obj.appointment.patient:
            return obj.appointment.patient.full_name
        return f"{obj.appointment.first_name or ''} {obj.appointment.last_name or ''}".strip() or 'ناشناخته'

    def get_service_name(self, obj):
        return obj.appointment.service.name if obj.appointment.service else ''


class DoctorReviewSummarySerializer(serializers.Serializer):
    total_reviews = serializers.IntegerField()
    average_rating = serializers.FloatField()
    rating_distribution = serializers.DictField()
    professionalism_avg = serializers.FloatField()
    treatment_quality_avg = serializers.FloatField()
    communication_avg = serializers.FloatField()
