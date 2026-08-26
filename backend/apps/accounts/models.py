from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, phone, national_code, password=None, **extra_fields):
        if not phone:
            raise ValueError('Phone number is required')
        if not national_code:
            raise ValueError('National code is required')
        user = self.model(phone=phone, national_code=national_code, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, national_code, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        return self.create_user(phone, national_code, password, **extra_fields)


class User(AbstractUser):
    username = None
    objects = UserManager()

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