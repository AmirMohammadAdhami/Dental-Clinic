from django.contrib import admin
from .models import Doctor, DoctorTestimonial, DoctorPhotos, Certificate, Assistant


class DoctorTestimonialInline(admin.StackedInline):
    model = DoctorTestimonial
    extra = 0


class DoctorPhotosInline(admin.StackedInline):
    model = DoctorPhotos
    extra = 0


class CertificateInline(admin.TabularInline):
    model = Certificate
    extra = 0


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('user', 'slug', 'speciality', 'university', 'years_of_experience', 'created_at')
    list_filter = ('speciality', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'slug', 'speciality')
    readonly_fields = ('slug', 'created_at', 'updated_at')
    raw_id_fields = ('user',)
    inlines = [DoctorTestimonialInline, DoctorPhotosInline, CertificateInline]


@admin.register(Assistant)
class AssistantAdmin(admin.ModelAdmin):
    list_display = ('user', 'speciality', 'created_at')
    search_fields = ('user__first_name', 'user__last_name', 'speciality')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('user',)
