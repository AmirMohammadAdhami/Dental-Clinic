from rest_framework import serializers
from backend.apps.blog.models import BeforeAfter


class GallerySerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = BeforeAfter
        fields = [
            'id',
            'before_image',
            'after_image',
            'description',
            'service_name',
            'doctor_name',
            'created_at',
            'updated_at',
        ]

    def get_doctor_name(self, obj):
        doctor = obj.appointment.doctor
        return f'{doctor.user.first_name} {doctor.user.last_name}'.strip()

    def get_service_name(self, obj):
        return obj.appointment.service.name
