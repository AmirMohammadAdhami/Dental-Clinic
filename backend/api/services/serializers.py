from rest_framework import serializers

from backend.apps.appointments.models import Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields =['id', 'name', 'slug', 'description', 'icon', 'badge']