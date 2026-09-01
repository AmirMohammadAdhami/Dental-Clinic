import re
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from backend.api.constants import DEPOSIT_PRICE, RESERVATION_TTL_MINUTES
from backend.apps.appointments.models import Appointment, AppointmentSlot, MedicalRecord, Service


class AppointmentCreateSerializer(serializers.ModelSerializer):
    """
    Creates a PENDING appointment when the patient confirms a slot on the
    /dashboard/select-doctors/<service>/ page (Plan B flow).

    The appointment is booked for the logged-in user: only `patient` is set —
    first_name/last_name/national_code are intentionally left empty and are
    filled later on the finalize-information page if the booking is for
    someone else. The reservation hold expires after RESERVATION_TTL_MINUTES.
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
                # first_name/last_name/national_code are intentionally NOT set
                # here — the finalize-information page fills them if the
                # booking is for someone else.
                tracking_code=Appointment.generate_tracking_code(),
                appointment_date=slot.start_time,
                service=service,
                slot=slot,
                price=DEPOSIT_PRICE,
                status=Appointment.Status.PENDING,
                expires_at=timezone.now() + timedelta(minutes=RESERVATION_TTL_MINUTES),
            )
        return appointment

    def to_representation(self, instance):
        return {
            'id': instance.id,
            'tracking_code': instance.tracking_code,
            'status': instance.status,
            'appointment_date': instance.appointment_date,
            'price': instance.price,
            'expires_at': instance.expires_at,
            'service': instance.service.name,
            'doctor': instance.doctor.user.full_name,
        }



class AppointmentDetailSerializer(serializers.ModelSerializer):
    """
    PATCH body for the finalize-information page
    (/dashboard/finalize_information/<tracking_code>/).
    """

    booking_for = serializers.ChoiceField(choices=['self', 'other'])
    medical_record_ids = serializers.PrimaryKeyRelatedField(
        queryset=MedicalRecord.objects.all(),
        many=True,
        required=False,
    )

    class Meta:
        model = Appointment
        fields = [
            'booking_for',
            'first_name', 'last_name', 'national_code',
            'medical_record_ids', 'additional_notes',
        ]

    # ---------- validation ----------

    def validate_national_code(self, value):
        if value and not re.fullmatch(r'\d{10}', value.strip()):
            raise serializers.ValidationError('کد ملی باید ۱۰ رقم باشد.')
        return value

    def validate(self, attrs):
        if attrs.get('booking_for') == 'other':
            for field in ('first_name', 'last_name', 'national_code'):
                if not (attrs.get(field) or '').strip():
                    raise serializers.ValidationError(
                        {field: 'برای رزرو برای دیگری این فیلد الزامی است.'}
                    )
        return attrs

    # ---------- update ----------

    def update(self, instance, validated_data):
        medical_records = validated_data.pop('medical_record_ids', None)
        booking_for = validated_data.pop('booking_for', 'self')

        if booking_for == 'other':
            # The `patient` account stays = logged-in user; the other
            # person's identity is stored on the appointment itself.
            instance.first_name = validated_data.get('first_name', '').strip()
            instance.last_name = validated_data.get('last_name', '').strip()
            instance.national_code = validated_data.get('national_code', '').strip()
        else:
            # Booking for myself: identity lives on the user account only —
            # do not save first_name/last_name/national_code.
            instance.first_name = ''
            instance.last_name = ''
            instance.national_code = None

        if 'additional_notes' in validated_data:
            instance.additional_notes = validated_data['additional_notes']

        if medical_records is not None:
            instance.medical_records.set(medical_records)

        # Reservation confirmed: firmly hold the slot (no more expiry).
        instance.status = Appointment.Status.RESERVED
        instance.expires_at = None
        instance.save()
        return instance


class AppointmentDetailResponseSerializer(serializers.Serializer):
    """Read-only representation returned by GET (and after PATCH)."""

    def to_representation(self, instance):
        user = instance.patient
        other = bool(instance.first_name or instance.last_name or instance.national_code)
        photo = getattr(getattr(instance.doctor, 'photos', None), 'profile_photo', None)
        return {
            'tracking_code': instance.tracking_code,
            'status': instance.status,
            'expires_at': instance.expires_at,
            'appointment_date': instance.appointment_date,
            'price': instance.price,
            'deposit_price': DEPOSIT_PRICE,
            'service': instance.service.name,
            'service_slug': instance.service.slug,
            'doctor': {
                'name': instance.doctor.user.full_name,
                'speciality': instance.doctor.speciality,
                'photo': photo.url if photo else '',
            },
            'booking_for': 'other' if other else 'self',
            'patient': {
                'first_name': user.first_name if user else '',
                'last_name': user.last_name if user else '',
                'national_code': user.national_code if user else '',
            },
            'other_patient': {
                'first_name': instance.first_name or '',
                'last_name': instance.last_name or '',
                'national_code': instance.national_code or '',
            },
            'medical_records': [
                {
                    'id': record.id,
                    'description': record.description,
                    'selected': record.appointments.filter(pk=instance.pk).exists(),
                }
                for record in MedicalRecord.objects.all()
            ],
            'additional_notes': instance.additional_notes or '',
        }
