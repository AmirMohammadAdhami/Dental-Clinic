from rest_framework.generics import ListAPIView

from backend.api.testimonials.serializers import TestimonialSerializer
from backend.apps.appointments.models import Testimonial


class TestimonialListApiView(ListAPIView):
    queryset = Testimonial.objects.filter(status=Testimonial.Status.APPROVED)
    serializer_class = TestimonialSerializer