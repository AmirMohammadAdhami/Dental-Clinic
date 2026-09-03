from rest_framework import serializers

from backend.api.base_serializers import ArticleMediaSerializer
from backend.apps.appointments.models import Service
from backend.apps.blog.models import Article
from backend.apps.doctors.models import Doctor, DoctorPhotos


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
    review_count = serializers.IntegerField(read_only=True)
    first_available_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Doctor
        fields = ['id', 'slug', 'full_name', 'speciality', 'university', 'years_of_experience', 'rating',
                  'review_count', 'first_available_at',
                  'working_days', 'bio', 'services_offered', 'doctor_photos']

    def get_full_name(self, obj):
        return obj.user.first_name + ' ' + obj.user.last_name

