import os
import shutil
import random
import requests as http_requests
from datetime import timedelta, date

from django.core.management.base import BaseCommand
from django.core.files import File
from django.utils import timezone
from django.utils.text import slugify

from faker import Faker

from backend.apps.accounts.models import User
from backend.apps.appointments.models import (
    Service, AppointmentSlot, MedicalRecord, Appointment, DoctorReview,
)
from backend.apps.doctors.models import (
    Doctor, DoctorPhotos, Assistant, Certificate,
)
from backend.apps.blog.models import (
    Article, ArticleMedia, Comment, FAQ, BeforeAfter,
)
from backend.apps.notifications.models import Notification

fake = Faker("fa_IR")

BASE_DIR = os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
))
STATIC_IMAGES = os.path.join(BASE_DIR, "static", "images")
MEDIA_ROOT = os.path.join(BASE_DIR, "media")


def copy_static_to_media(src_subdir, filename, dest_subdir=None):
    dest_subdir = dest_subdir or src_subdir
    src = os.path.join(STATIC_IMAGES, src_subdir, filename)
    dest_dir = os.path.join(MEDIA_ROOT, dest_subdir)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, filename)
    if not os.path.exists(dest):
        shutil.copy2(src, dest)
    return os.path.join(dest_subdir, filename)


def download_image(url, dest_subdir, filename, retries=3):
    dest_dir = os.path.join(MEDIA_ROOT, dest_subdir)
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, filename)
    if os.path.exists(dest):
        return os.path.join(dest_subdir, filename)
    for attempt in range(retries):
        try:
            resp = http_requests.get(url, timeout=20, stream=True)
            resp.raise_for_status()
            with open(dest, "wb") as f:
                for chunk in resp.iter_content(8192):
                    f.write(chunk)
            return os.path.join(dest_subdir, filename)
        except Exception as e:
            if attempt < retries - 1:
                import time
                wait = 2 ** attempt
                print(f"  [RETRY] Attempt {attempt + 1}/{retries} failed for {url}, retrying in {wait}s...")
                time.sleep(wait)
            else:
                print(f"  [WARN] Could not download {url} after {retries} attempts: {e}")
                return None

class Command(BaseCommand):
    help = "Seed the database with fake data using Faker"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear", action="store_true", help="Clear all data before seeding"
        )

    def handle(self, *args, **options):
        from django.conf import settings

        settings_module = os.environ.get("DJANGO_SETTINGS_MODULE", "")
        if not settings_module.endswith(".development") and not settings.DEBUG:
            self.stderr.write(
                self.style.ERROR(
                    "ERROR: seed_data can only be run in a development environment.\n"
                    "Set DJANGO_SETTINGS_MODULE=config.settings.development or DEBUG=true."
                )
            )
            return

        if options["clear"]:
            self.stdout.write("Clearing existing data...")
            Notification.objects.all().delete()
            BeforeAfter.objects.all().delete()
            Comment.objects.all().delete()
            ArticleMedia.objects.all().delete()
            Article.objects.all().delete()
            FAQ.objects.all().delete()
            DoctorReview.objects.all().delete()
            Appointment.objects.all().delete()
            AppointmentSlot.objects.all().delete()
            MedicalRecord.objects.all().delete()
            Certificate.objects.all().delete()
            DoctorPhotos.objects.all().delete()
            Doctor.objects.all().delete()
            Assistant.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            self.stdout.write(self.style.SUCCESS("Data cleared."))

        self.stdout.write(self.style.WARNING("Seeding database..."))

        # Services (read-only)
        services = list(Service.objects.all())
        if not services:
            self.stdout.write(self.style.ERROR("No services found! Create them first."))
            return
        self.stdout.write(f"  Found {len(services)} services.")

        users = self._create_users(62)
        regular_users = users[:50]
        doctor_users = users[50:56]
        assistant_users = users[56:]
        self.stdout.write(f"  Created {len(users)} users.")

        doctors = self._create_doctors(doctor_users, services)
        self.stdout.write(f"  Created {len(doctors)} doctors.")

        self._create_doctor_photos(doctors)
        self.stdout.write(f"  Created {len(doctors)} doctor photos.")

        assistants = self._create_assistants(assistant_users)
        self.stdout.write(f"  Created {len(assistants)} assistants.")

        certs = self._create_certificates(doctors)
        self.stdout.write(f"  Created {len(certs)} certificates.")

        med_records = self._create_medical_records()
        self.stdout.write(f"  Created {len(med_records)} medical records.")

        slots = self._create_slots(doctors)
        self.stdout.write(f"  Created {len(slots)} appointment slots.")

        appointments = self._create_appointments(
            doctors, regular_users, services, slots, med_records
        )
        self.stdout.write(f"  Created {len(appointments)} appointments.")

        reviews = self._create_reviews(appointments)
        self.stdout.write(f"  Created {len(reviews)} doctor reviews.")

        ba = self._create_before_after(appointments)
        self.stdout.write(f"  Created {len(ba)} before/after entries.")

        articles = self._create_articles(doctors, services)
        self.stdout.write(f"  Created {len(articles)} articles.")

        media_count = self._create_article_media(articles)
        self.stdout.write(f"  Created {media_count} article media entries.")

        comments = self._create_comments(regular_users, articles)
        self.stdout.write(f"  Created {len(comments)} comments.")

        faqs = self._create_faqs(services)
        self.stdout.write(f"  Created {len(faqs)} FAQs.")

        notifs = self._create_notifications(regular_users)
        self.stdout.write(f"  Created {len(notifs)} notifications.")

        self.stdout.write(self.style.SUCCESS("Seeding complete!"))

    # === Helpers ===

    def _create_users(self, count):
        users = []
        used_phones = set()
        used_ncodes = set()

        for _ in range(count):
            while True:
                phone = f"09{fake.numerify('#########')}"
                if phone not in used_phones:
                    used_phones.add(phone)
                    break

            while True:
                ncode = fake.numerify('##########')
                if ncode not in used_ncodes:
                    used_ncodes.add(ncode)
                    break

            user = User.objects.create_user(
                phone=phone,
                national_code=ncode,
                first_name=fake.first_name(),
                last_name=fake.last_name(),
            )
            users.append(user)
        return users

    def _create_doctors(self, doctor_users, services):
        specs = [
            'ایمپلنتولوژیست',
            'ارتودونتیست',
            'دندانپزشک ترمیمی',
            'دندانپزشک کودکان',
            'جراح فک و صورت',
            'دندانپزشک زیبائی',
        ]
        unis = [
            'دانشگاه علوم پزشکی تهران',
            'دانشگاه علوم پزشکی شیراز',
            'دانشگاه علوم پزشکی اصفهان',
            'دانشگاه علوم پزشکی مشهد',
            'دانشگاه علوم پزشکی تبریز',
            'دانشگاه علوم پزشکی شهید بهشتی',
        ]
        doctors = []
        for i, user in enumerate(doctor_users):
            doc = Doctor.objects.create(
                user=user,
                speciality=specs[i],
                university=unis[i],
                years_of_experience=random.randint(5, 25),
                bio=fake.text(max_nb_chars=200),
                medical_license_number=f"ML{fake.numerify('######')}",
            )
            doc.services_offered.set(random.sample(services, k=random.randint(2, 5)))
            doctors.append(doc)
        return doctors

    def _create_doctor_photos(self, doctors):
        for i, doc in enumerate(doctors, start=1):
            profile = copy_static_to_media("doctors", f"doctor-{i}.jpg", "doctors/profile_photos")
            blog = copy_static_to_media("doctors", f"doctor-{i}.jpg", "doctors/blog_photos")
            DoctorPhotos.objects.create(doctor=doc, profile_photo=profile, blog_photo=blog)

    def _create_assistants(self, assistant_users):
        specs = [
            'دستیار دندانپزشکی',
            'بهداشتکار دهان و دندان',
            'دستیار جراحی',
            'منشی مطب',
            'دستیار لابراتواری',
            'پرستار مطب',
        ]
        assistants = []
        for i, user in enumerate(assistant_users):
            photo = copy_static_to_media("assistants", f"assistant-{i+1}.jpg", "assistants/blog_photos")
            asst = Assistant.objects.create(user=user, speciality=specs[i], blog_photo=photo)
            assistants.append(asst)
        return assistants

    def _create_certificates(self, doctors):
        titles = [
            'بورد تخصصی ایمپلنتولوژیست',
            'گواهینمه پیشرفته ارتودونس',
            'گواهینمه ترمیم زیبائی',
            'جراح فک و صورت',
            'گواهینمه درمان ریشه',
            'دوره ونیر و لمینت',
            'گواهینمه دندانپزشکی کودکان',
            'گواهینمه لازر درمانی',
            'دوره ایمپلنت فوری',
            'گواهینمه مدیریت مطب',
        ]
        places = [
            'وزارت بهداشت',
            'انجمن دندانپزشکان ایران',
            'دانشگاه تهران',
            'آکادمی بین‌المللی ایمپلنت',
            'مرکز آموزش مداوم پزشکی',
        ]
        certs = []
        for doc in doctors:
            for _ in range(5):
                cert = Certificate.objects.create(
                    doctor=doc,
                    date=fake.date_between(start_date='-10y', end_date='today'),
                    what=random.choice(titles),
                    where=random.choice(places),
                )
                certs.append(cert)
        return certs

    def _create_medical_records(self):
        descs = [
            'دیابت',
            'فشار خون بالا',
            'بیماری قلبی',
            'الرژی به پنی‌سیلین',
            'سابقه جراحی فک',
            'پوکی ستخون',
            'مشکل تیروئید',
            'سابقه شیمی‌درمانی',
            'بیماری لثه',
            'حساسیت دندان',
            'سابقه ارتودونس',
            'شکستگی فک',
            'کیست دندانی',
            'پوسیدگی شدید',
            'از دست دندان',
        ]
        records = []
        for d in descs:
            records.append(MedicalRecord.objects.create(description=d))
        return records

    def _create_slots(self, doctors):
        slots = []
        for doc in doctors:
            for day_off in range(0, 30, random.randint(1, 3)):
                for hour in random.sample(range(9, 17), k=random.randint(2, 4)):
                    slot = AppointmentSlot.objects.create(
                        doctor=doc,
                        start_time=timezone.now() + timedelta(
                            days=day_off, hours=hour - timezone.now().hour
                        ),
                        duration_minutes=random.choice([30, 45, 60]),
                        is_active=True,
                    )
                    slots.append(slot)
        return slots

    def _create_appointments(self, doctors, users, services, slots, med_records):
        statuses = [
            Appointment.Status.PENDING,
            Appointment.Status.RESERVED,
            Appointment.Status.DONE,
            Appointment.Status.CANCELLED,
        ]
        weights = [0.15, 0.15, 0.60, 0.10]
        appointments = []
        used_slots = set()

        for _ in range(80):
            status = random.choices(statuses, weights=weights, k=1)[0]
            doctor = random.choice(doctors)
            service = random.choice(services)
            patient = random.choice(users)

            slot = None
            if status == Appointment.Status.DONE:
                available = [
                    s for s in slots
                    if s.doctor_id == doctor.pk and s.pk not in used_slots
                ]
                if available:
                    slot = random.choice(available)
                    used_slots.add(slot.pk)

            apt_date = slot.start_time if slot else timezone.now() + timedelta(days=random.randint(1, 60))

            apt = Appointment.objects.create(
                doctor=doctor,
                patient=patient,
                service=service,
                slot=slot,
                appointment_date=apt_date,
                price=random.randint(500000, 5000000),
                status=status,
                additional_notes=fake.sentence() if random.random() > 0.5 else '',
                expires_at=(apt_date - timedelta(hours=24) if status == Appointment.Status.PENDING else None),
            )
            apt.medical_records.set(random.sample(med_records, k=random.randint(0, 3)))
            appointments.append(apt)
        return appointments

    def _create_reviews(self, appointments):
        done = [a for a in appointments if a.status == Appointment.Status.DONE]
        rev_statuses = ['PENDING', 'APPROVED', 'REJECTED']
        rev_weights = [0.20, 0.70, 0.10]

        comments = [
            'خیلی عالی بود، پیشنهاد می‌کنم!',
            'خیلی حرفه‌ای و تمیز کار کردن.',
            'درمان عالی بود، اصلاً درد نداشت.',
            'پرسنل مهربون و مطب مدرنی دارن.',
            'خیلی راضیم از نتیجه کار.',
            'دکتر خیلی صبور و ماهر بودن.',
            'قیمت‌ها مناسب کیفیت هست.',
            'سریع و کارآمد درمانم کردن.',
            'بهترین کلینیک دندانپزشکی که رفتم.',
            'دکتر همه چیز رو واضح توضیح دادن.',
            'استرس داشتم ولی روش بدون درد بود.',
            'خیلی خوشحالم از لبخند جدیدم.',
            'تیم کاملاً حرفه‌ای هستن.',
            'حتماً دوباره میام.',
            'مطب خیلی مجهز هست.',
        ]

        reviews = []
        for apt in random.sample(done, k=min(40, len(done))):
            review = DoctorReview.objects.create(
                appointment=apt,
                content=random.choice(comments),
                professionalism_rating=random.randint(1, 5),
                treatment_quality_rating=random.randint(1, 5),
                communication_rating=random.randint(1, 5),
                status=random.choices(rev_statuses, weights=rev_weights, k=1)[0],
            )
            reviews.append(review)
        return reviews

    def _create_before_after(self, appointments):
        done = [a for a in appointments if a.status == Appointment.Status.DONE]
        entries = []
        for i in range(1, 5):
            if i > len(done):
                break
            before = copy_static_to_media("before-after", f"{i}-before.jpg", "blog/before-after-image")
            after = copy_static_to_media("before-after", f"{i}-after.jpg", "blog/before-after-image")
            ba = BeforeAfter.objects.create(
                before_image=before,
                after_image=after,
                description=fake.sentence(),
                appointment=done[i - 1],
            )
            entries.append(ba)
        return entries

    def _create_articles(self, doctors, services):
        data = [
            {
                'title': 'ایمپلنت دندان: همه چیزی که باید بدانید',
                'abstract': 'ایمپلنت دندان یکی از بهترین راه‌ها برای جایگزینی دندان‌های از دست رفته است.',
                'content': 'ایمپلنت دندان یک روش درمانی پیشرفته است که با کاشت پیچ‌های تیتانیومی در فک، دندان مصنوعی را به طور دائمی نصب می‌کند.',
            },
            {
                'title': 'ارتودنسی: صاف کردن دندان‌ها بدون درد',
                'abstract': 'روش‌های مدرن ارتودنسی امکان صاف کردن دندان‌ها را بدون درد فراهم می‌کنند.',
                'content': 'ارتودنسی مدرن شامل بریس‌های شفاف و الاینرهای متحرک است که برای هر سنی مناسب هستند.',
            },
            {
                'title': 'لمینت دندان: لبخند زیبا در کمترین زمان',
                'abstract': 'لمینت دندان ظاهر دندان‌ها را به طور چشمگیری بهبود می‌بخشد.',
                'content': 'لمینت‌های سرامیکی پوسته‌های نازکی هستند که روی سطح دندان‌ها چسبانده می‌شوند و لبخندی زیبا و طبیعی ایجاد می‌کنند.',
            },
            {
                'title': 'بلیچینگ دندان: روش‌ها و مزایا',
                'abstract': 'بلیچینگ یک روش ساده و سریع برای سفید کردن دندان‌ها است.',
                'content': 'بلیچینگ دندان با استفاده از مواد شیمیایی مخصوص، رنگ دندان‌ها را روشن‌تر می‌کند. این روش در مطب یا در خانه قابل انجام است.',
            },
            {
                'title': 'عصب کشی دندان: آنچه باید بدانید',
                'abstract': 'عصب کشی یک درمان ریشه‌ای است که دندان آسیب‌دیده را نجات می‌دهد.',
                'content': 'عصب کشی شامل حذف بافت عصبی آلوده از داخل دندان و سپس پر کردن آن است.',
            },
            {
                'title': 'کامپوزیت دندان: جایگزینی مدرن برای لمینت',
                'abstract': 'کامپوزیت ونیر یک روش اقتصادی‌تر برای زیباسازی دندان‌ها است.',
                'content': 'کامپوزیت ونیر با استفاده از مواد همرنگ دندان روی سطح دندان‌ها اعمال می‌شود و نتیجه‌ای طبیعی ایجاد می‌کند.',
            },
            {
                'title': 'جرمگیری دندان: اهمیت و روش‌ها',
                'abstract': 'جرمگیری منظم برای حفظ سلامت لثه و دندان ضروری است.',
                'content': 'جرمگیری فرآیندی است که رسوبات و جرم‌های روی دندان‌ها و زیر لثه را حذف می‌کند و از بیماری‌های لثه جلوگیری می‌کند.',
            },
            {
                'title': 'دندانپزشکی کودکان: نکات مهم برای والدین',
                'abstract': 'آشنایی با مراحل رشد دندان‌های کودکان و بهداشت دهان و دندان آنها بسیار مهم است.',
                'content': 'دندانپزشکی کودکان شامل مراقبت‌های ویژه برای دندان‌های شیری و دایمی کودکان است. مراجعه منظم به دندانپزشک از سنین پایین توصیه می‌شود.',
            },
        ]

        articles = []
        for i, d in enumerate(data):
            doctor = doctors[i % len(doctors)]
            service = services[i % len(services)]
            slug = slugify(f"{doctor.pk}-{d['title']}", allow_unicode=True)

            article = Article.objects.create(
                author=doctor,
                slug=slug,
                title=d['title'],
                category=service,
                abstract=d['abstract'],
                content=d['content'],
                content_blocks=[
                    {'type': 'heading', 'data': {'text': d['title'], 'level': 2}},
                    {'type': 'paragraph', 'data': {'text': d['abstract']}},
                    {'type': 'paragraph', 'data': {'text': d['content']}},
                ],
                is_published=random.random() > 0.2,
                view_count=random.randint(10, 500),
                special_article=random.random() > 0.8,
            )
            articles.append(article)
        return articles

    def _create_article_media(self, articles):
        img_urls = [
            'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800',
            'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800',
            'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800',
            'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=800',
            'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800',
            'https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=800',
            'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800',
            'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
            'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800',
            'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=800',
        ]
        vid_urls = [
            'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'https://www.youtube.com/watch?v=9bZkp7q19f0',
            'https://www.youtube.com/watch?v=JGwWNGJdvx8',
            'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        ]

        count = 0
        for article in articles:
            for j in range(random.randint(2, 3)):
                url = random.choice(img_urls)
                fn = f"article_{article.pk}_{count}.jpg"
                path = download_image(url, 'blog/article-media', fn)
                if path:
                    ArticleMedia.objects.create(
                        article=article,
                        media_type=ArticleMedia.MediaTypes.IMAGE,
                        file=path,
                    )
                    count += 1

            vid = random.choice(vid_urls)
            ArticleMedia.objects.create(
                article=article,
                media_type=ArticleMedia.MediaTypes.VIDEO,
                video_url=vid,
            )
            count += 1

        return count

    def _create_comments(self, users, articles):
        texts = [
            'مقاله خیلی مفیدی بود، ممنونم.',
            'ممنون از توضیحات عالیتون.',
            'خیلی کمکم کرد، متشکرم.',
            'آیا این روش برای همه مناسبه؟',
            'قیمت‌ها رو هم بگید لطفاً.',
            'عالی بود، منتظر مقالات بعدی هستم.',
            'خیلی خوب توضیح دادید.',
            'آیا نیاز به بستری شدن داره؟',
            'مقاله جامع و کاملی بود.',
            'خیلی ممنون از زحماتتون.',
            'میشه بیشتر توضیح بدید؟',
            'عالی بود واقعاً.',
            'خیلی خوب بود، به اشتراک گذاشتم.',
            'ممنون از پاسخ‌گویی.',
            'مقاله خیلی خوبی نوشتید.',
        ]

        comments = []
        for _ in range(30):
            user = random.choice(users)
            article = random.choice(articles)
            c = Comment.objects.create(
                user=user,
                article=article,
                content=random.choice(texts),
                status=random.choices(
                    ['APPROVED', 'PENDING', 'REJECTED'],
                    weights=[0.70, 0.20, 0.10], k=1,
                )[0],
            )
            comments.append(c)
        return comments

    def _create_faqs(self, services):
        faq_data = [
            ('ایمپلنت دندان چقدر طول می‌کشد؟', 'فرآیند ایمپلنت معمولاً ۳ تا ۶ ماه طول می‌کشد که شامل جراحی کاشت و دوره بهبود است.'),
            ('آیا لمینت دندان برگشت‌پذیر است؟', 'خیر، لمینت دندان یک درمان دائمی است و برگشت‌پذیر نیست.'),
            ('بلیچینگ دندان چقدر ماندگاری دارد؟', 'ماندگاری بلیچینگ بسته به رژیم غذایی و بهداشت دهان، ۶ ماه تا ۲ سال است.'),
            ('آیا عصب کشی درد دارد؟', 'خیر، با بی‌حسی موضعی، دردی حس نخواهید کرد.'),
            ('ارتودنسی برای بزرگسالان مناسب است؟', 'بله، ارتودنسی در هر سنی امکان‌پذیر است.'),
            ('کامپوزیت و لمینت چه فرقی دارند؟', 'لمینت از سرامیک ساخته می‌شود و کامپوزیت از مواد همرنگ دندان. لمینت ماندگاری بیشتری دارد.'),
            ('چند بار باید به دندانپزشک مراجعه کنیم؟', 'هر ۶ ماه یکبار مراجعه و جرمگیری توصیه می‌شود.'),
            ('آیا دندانپزشکی کودکان متفاوت است؟', 'بله، دندانپزشکی کودکان با تمرکز بر ترس‌زدایی و مراقبت‌های ویژه انجام می‌شود.'),
            ('قیمت ایمپلنت دندان چقدر است؟', 'قیمت ایمپلنت بسته به برند و تعداد دندان متفاوت است. لطفاً با مطب تماس بگیرید.'),
            ('آیا جرمگیری به مینای دندان آسیب می‌زند؟', 'خیر، جرمگیری حرفه‌ای هیچ آسیبی به مینای دندان وارد نمی‌کند.'),
        ]

        faqs = []
        for q, a in faq_data:
            faq = FAQ.objects.create(question=q, answer_text=a)
            faq.categories.set(random.sample(services, k=random.randint(1, 3)))
            faqs.append(faq)
        return faqs

    def _create_notifications(self, users):
        notif_data = [
            ('نوبت شما تأیید شد', 'نوبت شما با کد پیگیری DNT-XXXX تأیید شد.', 'APPOINTMENT'),
            ('یادآوری نوبت', 'شما فردا ساعت ۱۰ صبح نوبت دارید.', 'APPOINTMENT'),
            ('تصاویر جدید آپلود شد', 'تصاویر درمان شما در گالری قرار گرفت.', 'GALLERY'),
            ('نسخه شما آماده است', 'نسخه درمانی شما صادر شد.', 'PRESCRIPTION'),
            ('یادآوری چکاپ', 'وقت چکاپ شما فرا رسیده است.', 'CHECKUP_REMINDER'),
            ('فاکتور جدید', 'فاکتور درمان شما صادر شد.', 'INVOICE'),
            ('به کلینیک خوش آمدید', 'عضویت شما در سامانه تأیید شد.', 'GENERAL'),
            ('آپدیت سیستم', 'سیستم به‌روزرسانی شد.', 'GENERAL'),
            ('تخفیف ویژه', 'تخفیف ۲۰ درصدی برای بلیچینگ فعال شد.', 'GENERAL'),
            ('نظرسنجی', 'لطفاً نظر خود را درباره درمان ثبت کنید.', 'GENERAL'),
        ]

        notifs = []
        for _ in range(40):
            data = random.choice(notif_data)
            user = random.choice(users)
            n = Notification.objects.create(
                recipient=user,
                title=data[0],
                message=data[1],
                notification_type=data[2],
                is_read=random.random() > 0.5,
            )
            notifs.append(n)
        return notifs
