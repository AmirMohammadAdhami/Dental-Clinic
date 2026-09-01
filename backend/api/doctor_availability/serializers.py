from rest_framework import serializers

from backend.apps.appointments.models import AppointmentSlot


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    """A single bookable time slot. Times are rendered by the frontend;
    the backend never assumes a fixed schedule."""

    datetime = serializers.DateTimeField(source='start_time', read_only=True)
    time = serializers.SerializerMethodField()
    is_booked = serializers.SerializerMethodField()

    class Meta:
        model = AppointmentSlot
        fields = ['id', 'datetime', 'time', 'duration_minutes', 'is_booked']

    def get_time(self, obj):
        # HH:MM in the project's local timezone (settings.TIME_ZONE)
        return obj.local_start_time.strftime('%H:%M')

    def get_is_booked(self, obj):
        # Views can pre-compute this (avoids N+1 queries); fall back to the
        # model property otherwise.
        precomputed = getattr(obj, '_is_booked', None)
        if precomputed is not None:
            return precomputed
        return obj.is_booked


class AvailabilityDaySerializer(serializers.Serializer):
    date = serializers.DateField()
    status = serializers.ChoiceField(choices=['closed', 'full', 'available'])
    slots = AvailabilitySlotSerializer(many=True, read_only=True)


class AvailabilityResponseSerializer(serializers.Serializer):
    doctor = serializers.DictField()
    deposit_price = serializers.IntegerField()
    range = serializers.DictField()
    days = AvailabilityDaySerializer(many=True, read_only=True)
