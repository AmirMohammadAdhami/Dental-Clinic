from rest_framework import serializers
from backend.apps.appointments.models import DoctorReview


class DoctorReviewListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = DoctorReview
        fields = [
            'id', 'full_name', 'service_name', 'content',
            'professionalism_rating', 'treatment_quality_rating',
            'communication_rating', 'status', 'created_at',
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
