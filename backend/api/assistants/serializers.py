from rest_framework import serializers

from backend.apps.doctors.models import Assistant


class AssistantSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    class Meta:
        model = Assistant
        fields = ['id', 'user_id','full_name', 'speciality', 'blog_photo']

    def get_full_name(self, obj):
        return obj.user.first_name + " " + obj.user.last_name