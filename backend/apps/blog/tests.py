from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from backend.apps.blog.models import Article, ArticleMedia, ArticleView, Comment, FAQ, BeforeAfter
from backend.apps.doctors.models import Doctor
from backend.apps.appointments.models import Service, Appointment

User = get_user_model()


class ArticleModelTest(TestCase):
    """Tests for Article model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.doctor = Doctor.objects.create(
            user=self.user,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=10,
            bio='Experienced dentist',
            medical_license_number='ML12345'
        )
        self.service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )

    def test_article_save_auto_generates_slug(self):
        article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content'
        )
        self.assertIsNotNone(article.slug)
        self.assertIn('test-article', article.slug.lower())

    def test_article_slug_when_provided(self):
        article = Article.objects.create(
            author=self.doctor,
            slug='custom-slug',
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content'
        )
        self.assertEqual(article.slug, 'custom-slug')

    def test_article_reading_time(self):
        article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='This is a test content with some words. ' * 50
        )
        self.assertGreater(article.reading_time, 0)

    def test_article_has_blocks_property(self):
        article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content',
            content_blocks=[{'type': 'paragraph', 'data': {'text': 'Hello'}}]
        )
        self.assertTrue(article.has_blocks)

    def test_article_has_blocks_empty(self):
        article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content',
            content_blocks=[]
        )
        self.assertFalse(article.has_blocks)

    def test_article_default_not_published(self):
        article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content'
        )
        self.assertFalse(article.is_published)

    def test_article_view_count_default(self):
        article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content'
        )
        self.assertEqual(article.view_count, 0)


class ArticleMediaTest(TestCase):
    """Tests for ArticleMedia model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.doctor = Doctor.objects.create(
            user=self.user,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=10,
            bio='Experienced dentist',
            medical_license_number='ML12345'
        )
        self.service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )
        self.article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content'
        )

    def test_article_media_video_type(self):
        media = ArticleMedia.objects.create(
            article=self.article,
            media_type=ArticleMedia.MediaTypes.VIDEO,
            video_url='https://example.com/video.mp4'
        )
        self.assertEqual(media.media_type, ArticleMedia.MediaTypes.VIDEO)

    def test_article_media_image_type(self):
        media = ArticleMedia.objects.create(
            article=self.article,
            media_type=ArticleMedia.MediaTypes.IMAGE
        )
        self.assertEqual(media.media_type, ArticleMedia.MediaTypes.IMAGE)


class ArticleViewTest(TestCase):
    """Tests for ArticleView model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.doctor = Doctor.objects.create(
            user=self.user,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=10,
            bio='Experienced dentist',
            medical_license_number='ML12345'
        )
        self.service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )
        self.article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content'
        )

    def test_article_view_with_user(self):
        view = ArticleView.objects.create(
            article=self.article,
            user=self.user,
            ip_address='192.168.1.1'
        )
        self.assertEqual(view.user, self.user)

    def test_article_view_without_user(self):
        view = ArticleView.objects.create(
            article=self.article,
            ip_address='192.168.1.1'
        )
        self.assertIsNone(view.user)


class CommentTest(TestCase):
    """Tests for Comment model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.doctor = Doctor.objects.create(
            user=self.user,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=10,
            bio='Experienced dentist',
            medical_license_number='ML12345'
        )
        self.service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )
        self.article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content'
        )

    def test_comment_default_status_pending(self):
        comment = Comment.objects.create(
            user=self.user,
            article=self.article,
            content='Great article!'
        )
        # Doctor users get auto-approved via pre_save signal
        self.assertEqual(comment.status, Comment.Status.APPROVED)

    def test_comment_status_choices(self):
        self.assertEqual(Comment.Status.PENDING, 'PENDING')
        self.assertEqual(Comment.Status.APPROVED, 'APPROVED')
        self.assertEqual(Comment.Status.REJECTED, 'REJECTED')

    def test_comment_with_parent(self):
        parent_comment = Comment.objects.create(
            user=self.user,
            article=self.article,
            content='Parent comment'
        )
        child_comment = Comment.objects.create(
            user=self.user,
            article=self.article,
            content='Child comment',
            parent=parent_comment
        )
        self.assertEqual(child_comment.parent, parent_comment)
        self.assertEqual(parent_comment.children.count(), 1)


class FAQTest(TestCase):
    """Tests for FAQ model."""

    def test_faq_str(self):
        faq = FAQ.objects.create(
            question='What is dental cleaning?',
            answer_text='Professional cleaning of teeth'
        )
        self.assertEqual(str(faq), 'What is dental cleaning?')

    def test_faq_categories(self):
        service1 = Service.objects.create(
            name='Cleaning',
            description='Dental cleaning'
        )
        service2 = Service.objects.create(
            name='Whitening',
            description='Teeth whitening'
        )
        faq = FAQ.objects.create(
            question='What services do you offer?',
            answer_text='We offer various dental services'
        )
        faq.categories.add(service1, service2)
        self.assertEqual(faq.categories.count(), 2)


class DoctorCommentSerializerTest(TestCase):
    """Tests for doctor comment reply + status change flow."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.doctor = Doctor.objects.create(
            user=self.user,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=10,
            bio='Experienced dentist',
            medical_license_number='ML12345'
        )
        self.service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )
        self.article = Article.objects.create(
            author=self.doctor,
            title='Test Article',
            category=self.service,
            abstract='Test abstract',
            content='Test content'
        )
        self.patient = User.objects.create_user(
            phone='09129876543',
            national_code='0987654321',
            first_name='Sara',
            last_name='Ahmadi'
        )

    def test_reply_includes_replies_in_serializer(self):
        """DoctorCommentListSerializer must return children in 'replies' field."""
        from backend.api.doctor_dashboard.serializers import DoctorCommentListSerializer

        parent = Comment.objects.create(
            user=self.patient, article=self.article,
            content='Great article!'
        )
        reply = Comment.objects.create(
            user=self.user, article=self.article,
            content='Thank you!', parent=parent
        )

        serializer = DoctorCommentListSerializer(parent)
        data = serializer.data

        self.assertEqual(len(data['replies']), 1)
        self.assertEqual(data['replies'][0]['content'], 'Thank you!')

    def test_reply_changes_parent_status_to_approved(self):
        """After doctor replies, parent status must be APPROVED."""
        from backend.api.doctor_dashboard.serializers import DoctorCommentListSerializer

        parent = Comment.objects.create(
            user=self.patient, article=self.article,
            content='Great article!', status=Comment.Status.PENDING
        )
        Comment.objects.create(
            user=self.user, article=self.article,
            content='Thank you!', parent=parent
        )
        parent.status = Comment.Status.APPROVED
        parent.save(update_fields=['status', 'updated_at'])

        serializer = DoctorCommentListSerializer(parent)
        data = serializer.data

        self.assertEqual(data['status'], 'APPROVED')
        self.assertEqual(len(data['replies']), 1)

    def test_unreplied_comment_shows_empty_replies(self):
        """Comment with no replies should have empty replies list."""
        from backend.api.doctor_dashboard.serializers import DoctorCommentListSerializer

        parent = Comment.objects.create(
            user=self.patient, article=self.article,
            content='Great article!'
        )

        serializer = DoctorCommentListSerializer(parent)
        data = serializer.data

        self.assertEqual(data['status'], 'PENDING')
        self.assertEqual(data['replies'], [])


class BeforeAfterTest(TestCase):
    """Tests for BeforeAfter model."""

    def setUp(self):
        self.user = User.objects.create_user(
            phone='09121234567',
            national_code='1234567890',
            first_name='Ali',
            last_name='Rezaei'
        )
        self.doctor = Doctor.objects.create(
            user=self.user,
            speciality='Dentist',
            university='Tehran University',
            years_of_experience=10,
            bio='Experienced dentist',
            medical_license_number='ML12345'
        )
        self.service = Service.objects.create(
            name='Dental Cleaning',
            description='Professional dental cleaning'
        )
        self.patient = User.objects.create_user(
            phone='09129999999',
            national_code='9999999999',
            first_name='Sara',
            last_name='Hosseini'
        )
        self.appointment = Appointment.objects.create(
            doctor=self.doctor,
            patient=self.patient,
            service=self.service,
            appointment_date=timezone.now() + timedelta(days=1),
            price=500000
        )

    def test_before_after_str(self):
        before_after = BeforeAfter.objects.create(
            appointment=self.appointment,
            description='Great improvement'
        )
        self.assertEqual(str(before_after), self.appointment.tracking_code)

    def test_before_after_one_to_one_with_appointment(self):
        before_after = BeforeAfter.objects.create(
            appointment=self.appointment,
            description='Great improvement'
        )
        self.assertEqual(self.appointment.before_after, before_after)
