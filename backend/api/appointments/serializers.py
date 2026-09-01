from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from backend.api.constants import DEPOSIT_PRICE
from backend.apps.appointments.models import Appointment, AppointmentSlot, Service


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """
    Creates a PENDING appointment when the patient confirms a slot on the
    /dashboard/select-doctors/<service>/ page (Plan B flow).

    The patient is always the logged-in user; the "book for someone else"
    flow belongs to the finalize-information page task.
    """

    slot = serializers.PrimaryKeyRelatedField(
        queryset=AppointmentSlot.objects.filter(is_active=True),
    )
    service = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=Service.objects.all(),
    )

    class Meta:
        model = Appointment
        fields = ['slot', 'service']
        read_only_fields = ['tracking_code', 'status']

    def validate_slot(self, slot):
        if not slot.is_active:
            raise serializers.ValidationError('این نوبت دیگر فعال نیست.')
        if slot.start_time <= timezone.now():
            raise serializers.ValidationError('زمان این نوبت گذشته است.')
        if slot.appointments.filter(
            status__in=Appointment.BLOCKING_STATUSES,
        ).exists():
            raise serializers.ValidationError('این نوبت قبلاً رزرو شده است.')
        return slot

    def validate_service(self, service):
        if not service.slug:
            raise serializers.ValidationError('این خدمت قابل رزرو آنلاین نیست.')
        return service

    def validate(self, attrs):
        slot, service = attrs['slot'], attrs['service']
        if not slot.doctor.services_offered.filter(pk=service.pk).exists():
            raise serializers.ValidationError(
                'این دندان‌پزشک خدمت انتخاب‌شده را ارائه نمی‌دهد.'
            )
        return attrs

    def create(self, validated_data):
        slot = validated_data['slot']
        service = validated_data['service']
        user = self.context['request'].user

        # Re-check booking state under a row lock to prevent double booking.
        with transaction.atomic():
            slot = AppointmentSlot.objects.select_for_update().get(pk=slot.pk)
            if slot.appointments.filter(
                status__in=Appointment.BLOCKING_STATUSES,
            ).exists():
                raise serializers.ValidationError({'slot': 'این نوبت قبلاً رزرو شده است.'})

            appointment = Appointment.objects.create(
                doctor=slot.doctor,
                patient=user,
                first_name=user.first_name,
                last_name=user.last_name,
                national_code=user.national_code,
                tracking_code=Appointment.generate_tracking_code(),
                appointment_date=slot.start_time,
                service=service,
                slot=slot,
                price=DEPOSIT_PRICE,
                status=Appointment.Status.PENDING,
            )
        return appointment

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'tracking_code': instance.tracking_code,
            'status': instance.status,
            'appointment_date': instance.appointment_date,
            'price': instance.price,
            'service': instance.service.name,
            'doctor': instance.doctor.user.full_name,
        }
