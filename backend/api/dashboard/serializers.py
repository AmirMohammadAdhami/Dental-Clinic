from rest_framework import serializers
from backend.apps.accounts.models import User
from backend.apps.appointments.models import Appointment, Service
from backend.apps.blog.models import BeforeAfter
from ..services.serializers import ServiceSerializer
from ..gallery.serializers import GallerySerializer


class AppointmentSerializer(serializers.ModelSerializer):
    service_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ['id', 'service_name', 'doctor_name', 'status',
                  'prescription_file', 'tracking_code', 'appointment_date',
                  'created_at', 'updated_at']

    def get_service_name(self, obj):
        return obj.service.name

    def get_doctor_name(self, obj):
        return obj.doctor.user.full_name


class UserDashboardSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    phone = serializers.CharField(read_only=True)
    appointments = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()
    gallery = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'full_name', 'phone', 'appointments', 'services', 'gallery']

    def get_appointments(self, obj):
        return AppointmentSerializer(
            obj.appointments.select_related(
                'doctor__user', 'service'
            ).order_by('-created_at'),
            many=True
        ).data

    def get_services(self, obj):
        service_ids = obj.appointments.values_list('service_id', flat=True).distinct()
        return ServiceSerializer(
            Service.objects.filter(id__in=service_ids),
            many=True
        ).data

    def get_gallery(self, obj):
        return GallerySerializer(
            BeforeAfter.objects.filter(
                appointment__patient=obj
            ).select_related(
                'appointment__doctor__user', 'appointment__service'
            ).order_by('-created_at')[:4],
            many=True
        ).data