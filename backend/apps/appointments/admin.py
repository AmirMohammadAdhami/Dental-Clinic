from django.contrib import admin
from .models import Service, MedicalRecord, Appointment, Testimonial


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'badge')
    search_fields = ('name',)


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


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('appointment', 'rating', 'status', 'created_at')
    list_filter = ('status', 'rating')
    search_fields = ('content',)
    readonly_fields = ('created_at',)
    raw_id_fields = ('appointment',)
