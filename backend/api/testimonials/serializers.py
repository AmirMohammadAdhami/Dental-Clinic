from rest_framework import serializers
from backend.apps.appointments.models import Testimonial


class TestimonialSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = [
            'id',
            'full_name',
            'service_name',
            'content',
            'rating',
            'status',
            'created_at',
        ]

    def get_full_name(self, obj):
        try:
            appointment = obj.appointment
            if appointment.patient:
                return f"{appointment.patient.first_name} {appointment.patient.last_name}".strip()
            elif appointment.first_name or appointment.last_name:
                return f"{appointment.first_name} {appointment.last_name}".strip()
        except Exception:
            pass
        return ''

    def get_service_name(self, obj):
        try:
            return obj.appointment.service.name
        except Exception:
            return ''

    def validate(self, data):
        if data['rating'] > 5 or data['rating'] < 1:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return data