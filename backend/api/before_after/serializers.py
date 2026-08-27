from rest_framework import serializers
from backend.apps.blog.models import BeforeAfter



class BeforeAfterSerializer(serializers.ModelSerializer):
    doctor_name = serializers.SerializerMethodField()
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = BeforeAfter
        fields = [
            'id',
            'before_image',
            'after_image',
            'description',
            'doctor_name',
            'patient_name',
            'created_at',
            'updated_at',
        ]

    def get_doctor_name(self, obj):
        doctor = obj.appointment.doctor
        return f'{doctor.user.first_name} {doctor.user.last_name}'.strip()

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
