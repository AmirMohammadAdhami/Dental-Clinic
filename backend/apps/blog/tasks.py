from celery import shared_task

from .models import ArticleMedia


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def process_article_video(self, media_id):
    media = ArticleMedia.objects.get(
        id=media_id,
        media_type=ArticleMedia.MediaTypes.VIDEO,
    )

    if not media.file:
        return

    media.processing_status = (
        ArticleMedia.ProcessingStatus.PROCESSING
    )
    media.save(update_fields=['processing_status'])

    try:
        # FFmpeg processing...
        # output → processed_file

        media.processing_status = (
            ArticleMedia.ProcessingStatus.COMPLETED
        )
        media.processing_error = None

        media.save(
            update_fields=[
                'processing_status',
                'processing_error',
                'processed_file',
            ]
        )

        # Remove original file after successful processing
        if media.file:
            media.file.delete(save=False)
            media.file = None
            media.save(update_fields=['file'])

    except Exception as exc:
        media.processing_status = (
            ArticleMedia.ProcessingStatus.FAILED
        )
        media.processing_error = str(exc)

        media.save(
            update_fields=[
                'processing_status',
                'processing_error',
            ]
        )

        raise
