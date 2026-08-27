from rest_framework import serializers
from backend.apps.appointments.models import Testimonial



class TestimonialSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    service = serializers.SerializerMethodField()
    class Meta:
        model = Testimonial
        fields = [
            'id',
            'patient_name',
            'service',
            'content',
            'rating',
            'status',
            'created_at',
        ]

    def get_patient_name(self, obj):
        appointment = obj.appointment

        if appointment.patient:
            patient = appointment.patient
            return {
                'first_name': patient.first_name,
                'last_name': patient.last_name,
                'national_code': patient.national_code,
            }
        else:
            return {
                'first_name': appointment.first_name,
                'last_name': appointment.last_name,
                'national_code': appointment.national_code,
            }

    def get_service(self, obj):
        service = obj.appointment.service
        return {
            'id': service.id,
            'name': service.name,
            'description': service.description,
        }

    def validate(self, data):
        if data['rating'] > 5 or data['rating'] < 1:
            raise serializers.ValidationError('Rating must be between 1 and 5')
        return data