from datetime import date

from django.db.models import Avg, Count, Q, F
from django.db.models.functions import TruncMonth
from django.utils import timezone

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.api.doctor_dashboard.permissions import IsDoctorUser
from backend.api.doctor_dashboard.serializers import (
    DoctorDashboardOverviewSerializer,
    TodayAppointmentSerializer,
    DoctorAppointmentListSerializer,
    PrescriptionUpdateSerializer,
    DoctorArticleListSerializer,
    DoctorArticleCreateSerializer,
    DoctorArticleDetailSerializer,
    DoctorCommentListSerializer,
    CommentReplySerializer,
    DoctorReviewListSerializer,
    DoctorReviewSummarySerializer,
    DoctorProfileSerializer,
)
from backend.apps.appointments.models import Appointment, DoctorReview, Service
from backend.apps.blog.models import Article, Comment


# ── Helper ────────────────────────────────────────────────────────

DOCTOR_PERMISSIONS = [IsAuthenticated, IsDoctorUser]


# ── Overview ──────────────────────────────────────────────────────

class DoctorDashboardOverviewView(APIView):
    permission_classes = DOCTOR_PERMISSIONS

    def get(self, request):
        doctor = request.user.doctor
        now = timezone.now()
        year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

        # ── KPI: Total unique patients ──
        total_patients = (
            Appointment.objects
            .filter(doctor=doctor)
            .exclude(patient__isnull=True)
            .values('patient')
            .distinct()
            .count()
        )

        # ── KPI: Total appointments this year ──
        total_appointments_year = (
            Appointment.objects
            .filter(doctor=doctor, created_at__gte=year_start)
            .count()
        )

        # ── KPI: Average rating ──
        avg_result = (
            DoctorReview.objects
            .filter(
                appointment__doctor=doctor,
                status=DoctorReview.Status.APPROVED,
            )
            .aggregate(avg=Avg('rating'))
        )
        average_rating = round(avg_result['avg'] or 0.0, 1)

        # ── KPI: Published articles ──
        published_articles_count = (
            Article.objects
            .filter(author=doctor, is_published=True)
            .count()
        )

        # ── Today's appointments ──
        today = date.today()
        today_start = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.min.time()))
        today_end = timezone.make_aware(timezone.datetime.combine(today, timezone.datetime.max.time()))

        today_appointments = (
            Appointment.objects
            .filter(doctor=doctor, appointment_date__range=(today_start, today_end))
            .select_related('patient', 'service')
            .order_by('appointment_date')
        )
        today_data = TodayAppointmentSerializer(today_appointments, many=True).data

        # ── Treatment breakdown (all time) ──
        treatment_raw = (
            Appointment.objects
            .filter(doctor=doctor)
            .values('service__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        treatment_breakdown = [
            {'service_name': t['service__name'] or 'نامشخص', 'count': t['count']}
            for t in treatment_raw
        ]

        # ── Monthly visits trend (current year) ──
        MONTH_NAMES = {
            1: 'فروردین', 2: 'اردیبهشت', 3: 'خرداد', 4: 'تیر',
            5: 'مرداد', 6: 'شهریور', 7: 'مهر', 8: 'آبان',
            9: 'آذر', 10: 'دی', 11: 'بهمن', 12: 'اسفند',
        }
        monthly_raw = (
            Appointment.objects
            .filter(doctor=doctor, created_at__gte=year_start)
            .annotate(month_num=TruncMonth('created_at'))
            .values('month_num')
            .annotate(count=Count('id'))
            .order_by('month_num')
        )
        monthly_visits = [
            {'month': MONTH_NAMES.get(m['month_num'].month, str(m['month_num'].month)), 'count': m['count']}
            for m in monthly_raw
        ]

        data = {
            'total_patients': total_patients,
            'total_appointments_year': total_appointments_year,
            'average_rating': average_rating,
            'published_articles_count': published_articles_count,
            'today_appointments': today_data,
            'treatment_breakdown': treatment_breakdown,
            'monthly_visits': monthly_visits,
        }

        return Response(data)


# ── Appointments ──────────────────────────────────────────────────

class DoctorAppointmentsListView(generics.ListAPIView):
    permission_classes = DOCTOR_PERMISSIONS
    serializer_class = DoctorAppointmentListSerializer
    pagination_class = None

    def get_queryset(self):
        qs = (
            Appointment.objects
            .filter(doctor=self.request.user.doctor)
            .select_related('patient', 'service')
            .prefetch_related('medical_records')
            .order_by('-appointment_date')
        )
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        return qs


class DoctorAppointmentPrescriptionView(APIView):
    permission_classes = DOCTOR_PERMISSIONS

    def patch(self, request, pk):
        try:
            appointment = Appointment.objects.get(pk=pk, doctor=request.user.doctor)
        except Appointment.DoesNotExist:
            return Response(
                {'detail': 'نوبت مورد نظر یافت نشد.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PrescriptionUpdateSerializer(
            appointment, data=request.data, partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'نسخه با موفقیت ذخیره شد.'})


# ── Articles ──────────────────────────────────────────────────────

class DoctorArticleListCreateView(generics.ListCreateAPIView):
    permission_classes = DOCTOR_PERMISSIONS
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DoctorArticleCreateSerializer
        return DoctorArticleListSerializer

    def get_queryset(self):
        return (
            Article.objects
            .filter(author=self.request.user.doctor)
            .select_related('category')
            .prefetch_related('media')
            .order_by('-created_at')
        )


class DoctorArticleDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = DOCTOR_PERMISSIONS
    serializer_class = DoctorArticleDetailSerializer

    def get_queryset(self):
        return (
            Article.objects
            .filter(author=self.request.user.doctor)
            .select_related('category')
            .prefetch_related('media')
        )


# ── Comments ──────────────────────────────────────────────────────

class DoctorCommentListView(generics.ListAPIView):
    permission_classes = DOCTOR_PERMISSIONS
    serializer_class = DoctorCommentListSerializer
    pagination_class = None

    def get_queryset(self):
        return (
            Comment.objects
            .filter(article__author=self.request.user.doctor, parent__isnull=True)
            .select_related('user', 'article')
            .prefetch_related('children', 'children__user')
            .order_by('-created_at')
        )


class DoctorCommentReplyView(generics.CreateAPIView):
    permission_classes = DOCTOR_PERMISSIONS
    serializer_class = CommentReplySerializer

    def get_queryset(self):
        return Comment.objects.filter(
            article__author=self.request.user.doctor,
        )

    def perform_create(self, serializer):
        parent_comment = self.get_object()
        serializer.save(
            user=self.request.user,
            article=parent_comment.article,
            parent=parent_comment,
        )


# ── Reviews ───────────────────────────────────────────────────────

class DoctorReviewListView(APIView):
    permission_classes = DOCTOR_PERMISSIONS

    def get(self, request):
        doctor = request.user.doctor

        reviews = (
            DoctorReview.objects
            .filter(
                appointment__doctor=doctor,
                status=DoctorReview.Status.APPROVED,
            )
            .select_related('appointment__patient', 'appointment__service')
            .order_by('-created_at')
        )
        reviews_data = DoctorReviewListSerializer(reviews, many=True).data

        # ── Summary ──
        total = reviews.count()
        avg_result = reviews.aggregate(
            avg_rating=Avg('rating'),
            avg_prof=Avg('professionalism_rating'),
            avg_treat=Avg('treatment_quality_rating'),
            avg_comm=Avg('communication_rating'),
        )

        # Rating distribution (1-5)
        distribution = {}
        for i in range(1, 6):
            distribution[str(i)] = reviews.filter(rating__gte=i - 0.5, rating__lt=i + 0.5).count()

        summary = {
            'total_reviews': total,
            'average_rating': round(avg_result['avg_rating'] or 0.0, 1),
            'rating_distribution': distribution,
            'professionalism_avg': round(avg_result['avg_prof'] or 0.0, 1),
            'treatment_quality_avg': round(avg_result['avg_treat'] or 0.0, 1),
            'communication_avg': round(avg_result['avg_comm'] or 0.0, 1),
        }

        return Response({
            'summary': DoctorReviewSummarySerializer(summary).data,
            'reviews': reviews_data,
        })


# ── Profile ───────────────────────────────────────────────────────

class DoctorProfileView(APIView):
    permission_classes = DOCTOR_PERMISSIONS

    def get(self, request):
        doctor = request.user.doctor
        # Eager-load related data
        doctor = (
            type(doctor).objects
            .select_related('user')
            .prefetch_related('photos', 'services_offered', 'certificates')
            .get(pk=doctor.pk)
        )
        serializer = DoctorProfileSerializer(doctor)
        return Response(serializer.data)

    def put(self, request):
        doctor = request.user.doctor
        serializer = DoctorProfileSerializer(
            doctor, data=request.data, partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
