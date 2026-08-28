from rest_framework import serializers

from backend.api.articles.serializers import ArticleMediaSerializer
from backend.apps.appointments.models import Service, DoctorReview
from backend.apps.blog.models import BeforeAfter, Article
from backend.apps.doctors.models import Doctor, DoctorPhotos, Certificate


class DoctorPhotosSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorPhotos
        fields = ['profile_photo', 'blog_photo']


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name']


class DoctorListSerializer(serializers.ModelSerializer):
    doctor_photos = DoctorPhotosSerializer(source='photos', read_only=True)
    services_offered = ServiceSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    rating = serializers.FloatField(source='average_rating', read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'slug', 'full_name', 'speciality', 'university', 'years_of_experience', 'rating',
                  'working_days', 'bio', 'services_offered', 'doctor_photos']

    def get_full_name(self, obj):
        return obj.user.first_name + ' ' + obj.user.last_name


class DoctorCertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ['date', 'what', 'where']


class BeforeAfterDoctorSerializer(serializers.ModelSerializer):
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = BeforeAfter
        fields = ['id',
                  'before_image',
                  'after_image',
                  'description',
                  'service_name', ]

    def get_service_name(self, obj):
        return obj.appointment.service.name


class DoctorArticlesSerializer(serializers.ModelSerializer):
    files = ArticleMediaSerializer(source='media', many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'files', 'is_published']


class DoctorReviewSerializer(serializers.ModelSerializer):
    service_name = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()

    class Meta:
        model = DoctorReview
        fields = ['id', 'service_name', 'content', 'rating', 'professionalism_rating',
                  'treatment_quality_rating', 'communication_rating', 'status', 'created_at']

    def get_service_name(self, obj):
        return obj.appointment.service.name

    def get_rating(self, obj):
        return obj.rating


class DoctorDetailSerializer(serializers.ModelSerializer):
    doctor_photos = DoctorPhotosSerializer(source='photos', read_only=True)
    services_offered = ServiceSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    rating = serializers.FloatField(source='average_rating', read_only=True)
    certificates = DoctorCertificateSerializer(many=True, read_only=True)
    before_after = serializers.SerializerMethodField()
    articles = DoctorArticlesSerializer(many=True, read_only=True)
    doctor_testimonial = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = [
            'id', 'slug', 'full_name', 'speciality', 'university',
            'years_of_experience', 'working_days', 'rating', 'bio',
            'certificates', 'before_after', 'articles', 'doctor_testimonial',
            'doctor_photos', 'services_offered', 'reviews',
        ]

    def get_full_name(self, obj):
        return obj.user.first_name + ' ' + obj.user.last_name

    def get_before_after(self, obj):
        """Collect BeforeAfter images from the doctor's appointments."""
        return BeforeAfterDoctorSerializer(
            BeforeAfter.objects.filter(appointment__doctor=obj),
            many=True,
        ).data

    def get_doctor_testimonial(self, obj):
        if hasattr(obj, 'testimonial') and obj.testimonial:
            return obj.testimonial.video.url if obj.testimonial.video else None
        return None

    def get_reviews(self, obj):
        """Collect approved reviews from the doctor's appointments."""
        reviews = DoctorReview.objects.filter(
            appointment__doctor=obj,
            status=DoctorReview.Status.APPROVED,
        )
        return DoctorReviewSerializer(reviews, many=True).data
