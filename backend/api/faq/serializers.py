from rest_framework import serializers

from backend.apps.blog.models import FAQ
from backend.api.doctors.serializers import ServiceSerializer



class FAQSerializer(serializers.ModelSerializer):
    categories = ServiceSerializer(many=True, read_only=True)
    class Meta:
        model = FAQ
        fields = ['id', 'question', 'answer_text', 'categories']

