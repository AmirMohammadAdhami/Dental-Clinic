from rest_framework import serializers

from backend.apps.appointments.models import Service
from backend.apps.doctors.models import Doctor, DoctorPhotos

class DoctorPhotosSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorPhotos
        fields = ['profile_photo', 'blog_photo']


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name']


class DoctorSerializer(serializers.ModelSerializer):
    doctor_photos = DoctorPhotosSerializer(source='photos', read_only=True)
    services_offered = ServiceSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = ['id', 'slug', 'full_name', 'speciality', 'university', 'years_of_experience', 'bio', 'services_offered', 'doctor_photos']

    def get_full_name(self, obj):
        return obj.user.first_name + ' ' + obj.user.last_name