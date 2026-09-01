from django.contrib import admin
from .models import Service, MedicalRecord, Appointment, AppointmentSlot, DoctorReview


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'badge')
    search_fields = ('name', 'slug')


@admin.register(AppointmentSlot)
class AppointmentSlotAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'start_time', 'duration_minutes', 'is_active', 'created_at')
    list_filter = ('is_active', 'doctor', 'start_time')
    search_fields = ('doctor__user__first_name', 'doctor__user__last_name')
    raw_id_fields = ('doctor',)
    readonly_fields = ('created_at', 'updated_at')
    list_per_page = 50


@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ('description',)
    search_fields = ('description',)


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('tracking_code', 'doctor', 'patient', 'first_name', 'last_name', 'status', 'appointment_date', 'price')
    list_filter = ('status', 'appointment_date')
    search_fields = ('tracking_code', 'first_name', 'last_name', 'national_code')
    readonly_fields = ('tracking_code', 'created_at', 'updated_at')
    raw_id_fields = ('doctor', 'patient')


@admin.register(DoctorReview)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'rating', 'status', 'created_at')
    list_filter = ('status', 'rating')
    search_fields = ('content',)
    readonly_fields = ('created_at',)
    raw_id_fields = ('appointment',)
