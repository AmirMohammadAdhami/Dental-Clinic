from rest_framework import serializers
from datetime import date, timedelta

from backend.api.base_serializers import ArticleMediaSerializer
from backend.apps.appointments.models import Service, DoctorReview, Appointment
from backend.apps.blog.models import BeforeAfter, Article
from backend.apps.doctors.models import Doctor, DoctorPhotos, Certificate, DoctorTestimonial


class DoctorPhotosSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorPhotos
        fields = ['profile_photo', 'blog_photo']


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name']


class DoctorListSerializer(serializers.ModelSerializer):
    doctor_photos = DoctorPhotosSerializer(source='photos', read_only=True)
    services_offered = ServiceSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    rating = serializers.FloatField(source='average_rating', read_only=True)
    review_count = serializers.SerializerMethodField()
    completed_appointments_count = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()

    class Meta:
        model = Doctor
        fields = ['id', 'slug', 'full_name', 'speciality', 'university', 'years_of_experience', 'rating',
                  'working_days', 'bio', 'services_offered', 'doctor_photos',
                  'review_count', 'completed_appointments_count', 'availability']

    def get_full_name(self, obj):
        return obj.user.first_name + ' ' + obj.user.last_name

    def get_review_count(self, obj):
        if hasattr(obj, '_review_count'):
            return obj._review_count
        return DoctorReview.objects.filter(
            appointment__doctor=obj,
            status=DoctorReview.Status.APPROVED,
        ).count()

    def get_completed_appointments_count(self, obj):
        if hasattr(obj, '_completed_count'):
            return obj._completed_count
        return Appointment.objects.filter(
            doctor=obj,
            status=Appointment.Status.DONE,
        ).count()

    def get_availability(self, obj):
        """Compute the next available date for this doctor."""
        if hasattr(obj, '_next_available'):
            return obj._next_available
        return self._compute_next_available(obj)

    @staticmethod
    def _is_working_day(doctor, check_date):
        """Check if a date is within the doctor's working days."""
        wd = (doctor.working_days or '').strip()
        weekday = check_date.weekday()  # Mon=0 ... Sun=6

        # Default: 'از شنبه تا چهارشنبه' → Sat(5)–Wed(2)
        if not wd or 'شنبه تا چهارشنبه' in wd:
            return weekday in (5, 6, 0, 1, 2)  # Sat, Sun, Mon, Tue, Wed
        if 'شنبه تا پنجشنبه' in wd:
            return weekday in (5, 6, 0, 1, 2, 3)  # Sat–Thu
        if 'شنبه تا چهارشنبه و پنجشنبه صبح' in wd:
            return weekday in (5, 6, 0, 1, 2, 3)
        # Fallback: assume Sat–Wed
        return weekday in (5, 6, 0, 1, 2)

    def _compute_next_available(self, obj):
        today = date.today()
        for i in range(14):
            check_date = today + timedelta(days=i)
            if not self._is_working_day(obj, check_date):
                continue
            booked = Appointment.objects.filter(
                doctor=obj,
                appointment_date__date=check_date,
                status__in=[Appointment.Status.PENDING, Appointment.Status.RESERVED],
            ).count()
            # Assume max 8 slots per day (4 morning + 4 afternoon working hours)
            if booked < 8:
                if i == 0:
                    return "امروز"
                elif i == 1:
                    return "فردا"
                else:
                    return f"{i} روز دیگر"
        return "ناموجود"


class DoctorCertificateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ['date', 'what', 'where']


class BeforeAfterDoctorSerializer(serializers.ModelSerializer):
    service_name = serializers.SerializerMethodField()

    class Meta:
        model = BeforeAfter
        fields = ['id',
                  'before_image',
                  'after_image',
                  'description',
                  'service_name', ]

    def get_service_name(self, obj):
        return obj.appointment.service.name


class DoctorArticlesSerializer(serializers.ModelSerializer):
    files = ArticleMediaSerializer(source='media', many=True, read_only=True)

    class Meta:
        model = Article
        fields = ['id', 'title', 'slug', 'files', 'is_published']


class DoctorReviewSerializer(serializers.ModelSerializer):
    service_name = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()

    class Meta:
        model = DoctorReview
        fields = ['id', 'service_name', 'content', 'rating', 'professionalism_rating',
                  'treatment_quality_rating', 'communication_rating', 'status', 'created_at']

    def get_service_name(self, obj):
        return obj.appointment.service.name

    def get_rating(self, obj):
        return obj.rating


class DoctorDetailSerializer(serializers.ModelSerializer):
    doctor_photos = DoctorPhotosSerializer(source='photos', read_only=True)
    services_offered = ServiceSerializer(many=True, read_only=True)
    full_name = serializers.SerializerMethodField()
    rating = serializers.FloatField(source='average_rating', read_only=True)
    certificates = DoctorCertificateSerializer(many=True, read_only=True)
    before_after = serializers.SerializerMethodField()
    articles = DoctorArticlesSerializer(many=True, read_only=True)
    doctor_testimonial = serializers.SerializerMethodField()
    reviews = serializers.SerializerMethodField()
    completed_appointments_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'slug', 'full_name', 'speciality', 'university',
            'years_of_experience', 'working_days', 'rating', 'bio',
            'medical_license_number',
            'completed_appointments_count',
            'certificates', 'before_after', 'articles', 'doctor_testimonial',
            'doctor_photos', 'services_offered', 'reviews',
        ]

    def get_full_name(self, obj):
        return obj.user.first_name + ' ' + obj.user.last_name

    def get_before_after(self, obj):
        """Use prefetched data if available, otherwise fallback."""
        if hasattr(obj, '_prefetched_before_after'):
            return BeforeAfterDoctorSerializer(obj._prefetched_before_after, many=True).data
        return BeforeAfterDoctorSerializer(
            BeforeAfter.objects.filter(appointment__doctor=obj).order_by('created_at'), many=True,
        ).data

    def get_doctor_testimonial(self, obj):
        if hasattr(obj, 'testimonial') and obj.testimonial:
            return obj.testimonial.video.url if obj.testimonial.video else None
        return None

    def get_reviews(self, obj):
        """Use prefetched data if available, otherwise fallback."""
        if hasattr(obj, '_prefetched_reviews'):
            return DoctorReviewSerializer(obj._prefetched_reviews, many=True).data
        return DoctorReviewSerializer(
            DoctorReview.objects.filter(
                appointment__doctor=obj,
                status=DoctorReview.Status.APPROVED,
            ), many=True,
        ).data
