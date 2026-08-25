from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    username = None

    phone = models.CharField(
        max_length = 11,
        unique=True,
        verbose_name="Phone number",
    )

    national_code = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="National code",
    )

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["national_code", "first_name", "last_name"]

    def __str__(self):
        return self.first_name + " " + self.last_name

class OTPCode(models.Model):
    user = models.ForeignKey(User,
                             on_delete=models.CASCADE,
                             related_name="otp_codes",)

    code = models.CharField(
        max_length=5,
    )

    is_used = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    def is_expired(self):
        return self.expires_at <= timezone.now()

    def is_valid(self):
        return not self.is_expired() and not self.is_used