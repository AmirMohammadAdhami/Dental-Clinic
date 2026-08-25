from django.db import models
from ..accounts.models import User
from django.utils.text import slugify


# Create your models here.
class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    slug = models.SlugField(unique=True)

    speciality = models.CharField()
    university = models.CharField()
    years_of_experience = models.IntegerField()
    bio = models.TextField()

    services_offered = models.ManyToManyField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.user.first_name}-{self.user.last_name}", allow_unicode=True)

        super.save(*args, **kwargs)

    def __str__(self):
        return self.user.first_name + " " + self.user.last_name


class DoctorTestimonial(models.Model):
    doctor = models.OneToOneField(Doctor, on_delete=models.CASCADE)
    video = models.FileField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class DoctorPhotos(models.Model):
    doctor = models.OneToOneField(Doctor, on_delete=models.CASCADE)
    profile_photo = models.ImageField()
    blog_photo = models.ImageField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Assistant(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    speciality = models.CharField()
    blog_photo = models.ImageField()

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.user.first_name + " " + self.user.last_name
