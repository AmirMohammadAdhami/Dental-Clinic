from rest_framework import serializers
from backend.apps.accounts.models import User
from backend.apps.appointments.models import Appointment, Service, DoctorReview
from backend.apps.blog.models import BeforeAfter
from ..services.serializers import ServiceSerializer
from ..gallery.serializers import GallerySerializer


class AppointmentSerializer(serializers.ModelSerializer):
    service_name = serializers.SerializerMethodField()
    service_icon = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    review_status = serializers.SerializerMethodField()
    review_id = serializers.SerializerMethodField()
    review_data = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = ['id', 'service_name', 'service_icon', 'doctor_name', 'status',
                  'prescription_file', 'tracking_code', 'appointment_date',
                  'created_at', 'updated_at', 'review_status', 'review_id', 'review_data']

    def get_service_name(self, obj):
        return obj.service.name

    def get_service_icon(self, obj):
        icon = getattr(obj.service, 'icon', None)
        if icon:
            return icon.url
        return ''

    def get_doctor_name(self, obj):
        return obj.doctor.user.full_name

    def get_review_status(self, obj):
        review = getattr(obj, '_review_cache', None)
        if review is None:
            return None
        return review.status

    def get_review_id(self, obj):
        review = getattr(obj, '_review_cache', None)
        if review is None:
            return None
        return review.id

    def get_review_data(self, obj):
        review = getattr(obj, '_review_cache', None)
        if review is None or review.status != DoctorReview.Status.APPROVED:
            return None
        return {
            'id': review.id,
            'content': review.content,
            'professionalism_rating': review.professionalism_rating,
            'treatment_quality_rating': review.treatment_quality_rating,
            'communication_rating': review.communication_rating,
            'rating': review.rating,
            'created_at': review.created_at.isoformat() if review.created_at else None,
        }


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
        from django.db.models import Prefetch

        appointments = (
            obj.appointments
            .select_related('doctor__user', 'service')
            .prefetch_related(
                Prefetch(
                    'testimonials',
                    queryset=DoctorReview.objects.filter(
                        appointment__patient=obj
                    ).only('id', 'status', 'content', 'professionalism_rating',
                            'treatment_quality_rating', 'communication_rating',
                            'rating', 'created_at'),
                    to_attr='_reviews_prefetch'
                )
            )
            .order_by('-created_at')
        )

        for apt in appointments:
            reviews = getattr(apt, '_reviews_prefetch', [])
            apt._review_cache = reviews[0] if reviews else None

        return AppointmentSerializer(appointments, many=True).data

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