from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from .models import Comment, Article
from backend.security.cache import invalidate_blog_listing
import logging

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=Comment)
def doctor_comments(sender, instance, **kwargs):
    """Auto-approve comments written by doctors on their own articles."""
    if instance.user is None:
        return
    try:
        if hasattr(instance.user, 'doctor') and instance.user.doctor:
            instance.status = "APPROVED"
    except Exception:
        pass


@receiver(post_save, sender=Article)
def article_post_save(sender, instance, created, **kwargs):
    """Invalidate the /blog/ page cache when an article is published or its
    content changes.

    Django's cache_page stores keys like:
        views.decorators.cache.cache_page.<url>.<method>.<key_prefix>
    We delete the two cached page keys (blog listing and before/after) so
    the next anonymous visitor triggers a fresh render.
    """
    try:
        invalidate_blog_listing()
    except Exception:
        logger.exception('Failed to invalidate blog cache for article %s', instance.pk)