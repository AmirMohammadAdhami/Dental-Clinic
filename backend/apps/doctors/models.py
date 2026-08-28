from django.db import models
from ..accounts.models import User
from django.utils.text import slugify


# Create your models here.
class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor')

    slug = models.SlugField(unique=True, allow_unicode=True)

    speciality = models.CharField()
    university = models.CharField()
    years_of_experience = models.IntegerField()
    bio = models.TextField()

    services_offered = models.ManyToManyField('appointments.Service', related_name='doctors_offered')

    working_days = models.TextField(default='از شنبه تا چهارشنبه')

    medical_license_number = models.CharField(max_length=20, unique=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.user.first_name}-{self.user.last_name}", allow_unicode=True)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.user.first_name + " " + self.user.last_name


class DoctorTestimonial(models.Model):
    doctor = models.OneToOneField(Doctor, on_delete=models.CASCADE, related_name='testimonial')
    video = models.FileField(upload_to='doctors/testimonials/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class DoctorPhotos(models.Model):
    doctor = models.OneToOneField(Doctor, on_delete=models.CASCADE, related_name='photos')
    profile_photo = models.ImageField(upload_to='doctors/profile_photos/')
    blog_photo = models.ImageField(upload_to='doctors/blog_photos/')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Certificate(models.Model):
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='certificates')
    date = models.DateField()
    what = models.TextField(max_length=255)
    where = models.TextField(max_length=255)



class Assistant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='assistant')

    speciality = models.CharField()
    blog_photo = models.ImageField(upload_to='assistants/blog_photos/')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.first_name + " " + self.user.last_name
