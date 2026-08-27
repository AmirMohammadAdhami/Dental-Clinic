from django.db import models
from django.utils.text import slugify
from ..accounts.models import User


# Create your models here.


class ArticleMedia(models.Model):
    class MediaTypes(models.TextChoices):
        VIDEO = 'VIDEO', 'Video'
        IMAGE = 'IMAGE', 'Image'

    article = models.ForeignKey('Article', on_delete=models.CASCADE, related_name='media')
    media_type = models.CharField(max_length=10, choices=MediaTypes)
    file = models.FileField(upload_to=f'blog/article-media/', null=True, blank=True)
    video_url = models.URLField(max_length=200, null=True, blank=True)


class ArticleView(models.Model):
    article = models.ForeignKey(
        'Article',
        on_delete=models.CASCADE
    )

    user = models.ForeignKey(
        User,
        on_delete=models.DO_NOTHING,
        null=True,
        blank=True
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['article', 'user'],
                condition=models.Q(user__isnull=False),
                name='unique_article_view_per_user'
            ),
            models.UniqueConstraint(
                fields=['article', 'ip_address'],
                condition=models.Q(user__isnull=True),
                name='unique_article_view_per_ip_address_when_anonymous'
            )
        ]


class Article(models.Model):
    author = models.ForeignKey('doctors.Doctor', on_delete=models.CASCADE, related_name='articles')

    slug = models.SlugField(unique=True)

    title = models.CharField(max_length=150)
    category = models.ForeignKey('appointments.Service', on_delete=models.DO_NOTHING)
    abstract = models.TextField()
    content = models.TextField()

    is_published = models.BooleanField(default=False)

    view_count = models.IntegerField(default=0)

    special_article = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(f"{self.author.user.id}-{self.title}", allow_unicode=True)
        super().save(*args, **kwargs)


class Comment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.ForeignKey(User, on_delete=models.DO_NOTHING, related_name='comments')
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()

    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='children',
        null=True,
        blank=True
    )

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class FAQ(models.Model):
    question = models.TextField()
    answer_text = models.TextField()
    categories = models.ManyToManyField('appointments.Service')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.question


class BeforeAfter(models.Model):
    before_image = models.ImageField(upload_to=f'blog/before-after-image/')
    after_image = models.ImageField(upload_to=f'blog/before-after-image/')
    description = models.TextField()

    appointment = models.OneToOneField('appointments.Appointment', on_delete=models.CASCADE, related_name='before_after')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.appointment.tracking_code}'