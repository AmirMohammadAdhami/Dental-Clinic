from rest_framework import serializers
from backend.apps.appointments.models import DoctorReview, Appointment


class DoctorReviewListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = DoctorReview
        fields = [
            'id', 'full_name', 'service_name', 'content',
            'professionalism_rating', 'treatment_quality_rating', 'communication_rating', 'status', 'created_at',
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


class DoctorReviewCreateSerializer(serializers.Serializer):
    appointment_id = serializers.IntegerField()
    professionalism_rating = serializers.IntegerField(min_value=1, max_value=5)
    treatment_quality_rating = serializers.IntegerField(min_value=1, max_value=5)
    communication_rating = serializers.IntegerField(min_value=1, max_value=5)
    content = serializers.CharField(max_length=2000, required=False, default='')

    def validate_appointment_id(self, value):
        user = self.context['request'].user
        try:
            appointment = Appointment.objects.get(id=value)
        except Appointment.DoesNotExist:
            raise serializers.ValidationError('نوبت مورد نظر یافت نشد.')

        if appointment.patient != user:
            raise serializers.ValidationError('شما اجازه نظر دادن برای این نوبت را ندارید.')

        if appointment.status != Appointment.Status.DONE:
            raise serializers.ValidationError('فقط برای نوبت‌های انجام‌شده امکان ثبت نظر وجود دارد.')

        if DoctorReview.objects.filter(appointment=appointment).exists():
            raise serializers.ValidationError('شما قبلاً برای این نوبت نظر ثبت کرده‌اید.')

        return value

    def create(self, validated_data):
        user = self.context['request'].user
        appointment = Appointment.objects.get(id=validated_data['appointment_id'])

        review = DoctorReview.objects.create(
            appointment=appointment,
            professionalism_rating=validated_data['professionalism_rating'],
            treatment_quality_rating=validated_data['treatment_quality_rating'],
            communication_rating=validated_data['communication_rating'],
            content=validated_data.get('content', ''),
            status=DoctorReview.Status.PENDING,
        )
        return review


