from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils import timezone
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):

    def create_user(self, phone, national_code, **extra_fields):
        if not phone:
            raise ValueError("Phone number is required")

        if not national_code:
            raise ValueError("National code is required")

        user = self.model(
            phone=phone,
            national_code=national_code,
            **extra_fields
        )

        # بدون password
        user.set_unusable_password()

        user.save(using=self._db)

        return user

    def create_superuser(self, phone, national_code, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        return self.create_user(
            phone,
            national_code,
            **extra_fields
        )


class User(AbstractBaseUser, PermissionsMixin):
    phone = models.CharField(
        max_length=11,
        unique=True,
        verbose_name="Phone number",
    )

    national_code = models.CharField(
        max_length=10,
        unique=True,
        verbose_name="National code",
    )

    first_name = models.CharField(
        max_length=150,
    )

    last_name = models.CharField(
        max_length=150,
    )

    full_name = models.CharField(
        max_length=200,
        blank=True,
    )

    date_joined = models.DateTimeField(auto_now_add=True)

    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["national_code", "first_name", "last_name"]

    def __str__(self):
        return self.full_name

    def save(self, *args, **kwargs):
        self.full_name = f"{self.first_name} {self.last_name}"
        super().save(*args, **kwargs)


class OTPCode(models.Model):
    MAX_ATTEMPTS = 5

    phone_number = models.CharField(max_length=10, unique=True)

    code = models.CharField(
        max_length=5,
    )

    attempts = models.PositiveSmallIntegerField(default=0)

    is_used = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    def is_expired(self):
        return self.expires_at <= timezone.now()

    def is_valid(self):
        return not self.is_expired() and not self.is_used and not self.attempts < self.MAX_ATTEMPTS
