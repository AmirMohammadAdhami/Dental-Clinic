/**
 * Dentura — Doctor Profile Page (Dynamic from API)
 * Fetches /api/doctors/<slug>/ and populates all sections
 */

document.addEventListener('DOMContentLoaded', function () {

  /* ─── Helpers ─── */
  function toPersianNum(n) {
    var p = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(n).replace(/\d/g, function (d) { return p[parseInt(d)]; });
  }

  function toPersianDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return dateStr; }
  }

  var starSvg = '<svg class="star-icon" viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';

  /* ─── Get slug from URL ─── */
  var pathParts = window.location.pathname.replace(/\/+$/, '').split('/');
  var slug = decodeURIComponent(pathParts[pathParts.length - 1]);
  if (!slug) return;

  /* ═══════════════════════════════════════════
     Fetch Doctor Data
     ═══════════════════════════════════════════ */
  async function loadDoctor() {
    try {
      var res = await fetch('/api/doctors/' + encodeURIComponent(slug) + '/');
      if (!res.ok) throw new Error('API not OK: ' + res.status);
      var doc = await res.json();

      renderHero(doc);
      renderAbout(doc);
      renderCertificates(doc);
      renderBeforeAfter(doc);
      renderArticles(doc);
      renderReviews(doc);
      renderTestimonialVideo(doc);

    } catch (err) {
      console.error('خطا در دریافت اطلاعات دکتر:', err);
    }
  }

  /* ═══════════════════════════════════════════
     HERO
     ═══════════════════════════════════════════ */
  function renderHero(doc) {
    var photoUrl = (doc.doctor_photos && doc.doctor_photos.blog_photo) || '/static/images/doctors/default.jpg';
    var firstName = (doc.full_name || '').split(' ')[0] || 'دکتر';

    document.getElementById('docHeroImg').src = photoUrl;
    document.getElementById('docHeroImg').alt = 'دکتر ' + doc.full_name;
    document.getElementById('docHeroName').textContent = 'دکتر ' + doc.full_name;
    document.getElementById('docBreadcrumbName').textContent = 'دکتر ' + doc.full_name;
    document.getElementById('docHeroSpecialty').textContent = doc.speciality || '';

    if (doc.medical_license_number) {
      document.getElementById('docHeroLicense').textContent = 'کد نظام پزشکی: ' + doc.medical_license_number;
    }

    // Badges
    var badges = [];
    if (doc.rating) badges.push({ icon: '⭐', text: 'امتیاز کاربران ' + toPersianNum(Math.round(doc.rating * 10) / 10) + ' از ۵' });
    if (doc.years_of_experience) badges.push({ icon: '🎓', text: toPersianNum(doc.years_of_experience) + '+ سال سابقه' });
    if (doc.completed_appointments_count) badges.push({ icon: '🦷', text: toPersianNum(doc.completed_appointments_count) + '+ درمان موفق' });

    var badgesHtml = badges.map(function (b) {
      return '<span class="doc-hero-badge"><span class="doc-badge-icon">' + b.icon + '</span> ' + b.text + '</span>';
    }).join('');
    document.getElementById('docHeroBadges').innerHTML = badgesHtml;

    document.title = 'دکتر ' + doc.full_name + ' — دنتورا';
    // Update meta description for SEO
    var metaDesc = document.querySelector('meta[name="description"]');
    var bioText = doc.bio ? doc.bio.substring(0, 120) : '';
    var descText = 'دکتر ' + doc.full_name + ' — ' + (doc.speciality || '') + (bioText ? '. ' + bioText : '') + ' — مشاهده پروفایل و رزرو نوبت در دنتورا.';
    if (metaDesc) metaDesc.setAttribute('content', descText);
    // Update Open Graph tags for SEO
    var ogTitle = document.querySelector('meta[property="og:title"]');
    var ogDesc = document.querySelector('meta[property="og:description"]');
    var ogType = document.querySelector('meta[property="og:type"]');
    var ogImage = document.querySelector('meta[property="og:image"]');
    if (ogTitle) ogTitle.setAttribute('content', 'دکتر ' + doc.full_name + ' — ' + (doc.speciality || '') + ' | دنتورا');
    if (ogDesc) ogDesc.setAttribute('content', descText);
    if (ogType) ogType.setAttribute('content', 'profile');
    if (ogImage && doc.doctor_photos && doc.doctor_photos.blog_photo) {
        ogImage.setAttribute('content', window.location.origin + doc.doctor_photos.blog_photo);
    }
    // Update Twitter Card tags
    var twTitle = document.querySelector('meta[name="twitter:title"]');
    var twDesc = document.querySelector('meta[name="twitter:description"]');
    var twImage = document.querySelector('meta[name="twitter:image"]');
    if (twTitle) twTitle.setAttribute('content', 'دکتر ' + doc.full_name + ' — ' + (doc.speciality || '') + ' | دنتورا');
    if (twDesc) twDesc.setAttribute('content', descText);
    if (twImage && doc.doctor_photos && doc.doctor_photos.blog_photo) {
        twImage.setAttribute('content', window.location.origin + doc.doctor_photos.blog_photo);
    }
  }

  /* ═══════════════════════════════════════════
     ABOUT
     ═══════════════════════════════════════════ */
  function renderAbout(doc) {
    var firstName = (doc.full_name || '').split(' ')[0] || 'دکتر';
    document.getElementById('docAboutTitle').textContent = 'درباره ' + firstName;
    document.getElementById('docBio').innerHTML = '<p>' + (doc.bio || '') + '</p>';
  }

  /* ═══════════════════════════════════════════
     CERTIFICATES (ordered old → new from API)
     ═══════════════════════════════════════════ */
  function renderCertificates(doc) {
    var timeline = document.getElementById('docTimeline');
    var certs = doc.certificates || [];
    if (certs.length === 0) {
      document.getElementById('doc-education').style.display = 'none';
      return;
    }

    timeline.innerHTML = certs.map(function (c) {
      var year = c.date ? new Date(c.date).toLocaleDateString('fa-IR', { year: 'numeric' }) : '';
      return (
        '<div class="doc-timeline-item">' +
          '<div class="doc-timeline-dot"></div>' +
          '<div class="doc-timeline-content">' +
            '<span class="doc-timeline-year">' + year + '</span>' +
            '<h4>' + (c.what || '') + '</h4>' +
            '<p>' + (c.where || '') + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  /* ═══════════════════════════════════════════
     BEFORE / AFTER (slider cards with filters)
     ═══════════════════════════════════════════ */
  function renderBeforeAfter(doc) {
    var items = doc.before_after || [];
    if (items.length === 0) {
      document.getElementById('doc-gallery').style.display = 'none';
      return;
    }

    // Collect unique service names for filters
    var serviceNames = [];
    items.forEach(function (item) {
      if (item.service_name && serviceNames.indexOf(item.service_name) === -1) {
        serviceNames.push(item.service_name);
      }
    });

    // Render filter pills (same style as before-after page)
    var filtersEl = document.getElementById('docBaFilters');
    var pillsHtml = '<button class="ba-filter-btn is-active" data-filter="all" role="tab" aria-selected="true">همه</button>';
    serviceNames.forEach(function (name) {
      pillsHtml += '<button class="ba-filter-btn" data-filter="' + name + '" role="tab" aria-selected="false">' + name + '</button>';
    });
    filtersEl.innerHTML = pillsHtml;

    // Render BA cards (same structure as before-after page)
    var grid = document.getElementById('docBaGrid');
    grid.innerHTML = items.map(function (item) {
      var desc = item.description || '';
      var serviceName = item.service_name || '';
      return (
        '<div class="ba-card-item" data-treatment="' + serviceName + '">' +
          '<div class="doctor-card" data-ba>' +
            '<div class="doctor-img ba-container" tabindex="0" role="slider"' +
              ' aria-label="مقایسه قبل و بعد ' + desc + '"' +
              ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">' +
              '<img class="ba-img ba-after" src="' + item.after_image + '" alt="نتیجه بعد از ' + desc + '">' +
              '<img class="ba-img ba-before" src="' + item.before_image + '" alt="وضعیت قبل از ' + desc + '">' +
              '<div class="ba-slider"><div class="ba-handle"></div></div>' +
              '<span class="ba-label ba-label-before">قبل</span>' +
              '<span class="ba-label ba-label-after">بعد</span>' +
            '</div>' +
          '</div>' +
          '<p class="ba-card-desc">' + desc + '</p>' +
        '</div>'
      );
    }).join('');

    // Init BA sliders (same as before-after page)
    initBASliders();

    // Bind filter pills
    var pills = filtersEl.querySelectorAll('.ba-filter-btn');
    var cards = grid.querySelectorAll('.ba-card-item');
    pills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        pills.forEach(function (p) { p.classList.remove('is-active'); p.setAttribute('aria-selected', 'false'); });
        pill.classList.add('is-active');
        pill.setAttribute('aria-selected', 'true');
        var f = pill.getAttribute('data-filter');
        cards.forEach(function (card) {
          if (f === 'all' || card.getAttribute('data-treatment') === f) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* ═══════════════════════════════════════════
     ARTICLES (max 4)
     ═══════════════════════════════════════════ */
  function renderArticles(doc) {
    var articles = (doc.articles || []).slice(0, 4);
    var grid = document.getElementById('docArticlesGrid');
    var cta = document.getElementById('docArticlesCta');

    if (articles.length === 0) {
      document.getElementById('doc-articles').style.display = 'none';
      return;
    }

    // Check if any article has a video
    var hasVideo = articles.some(function (a) {
      return (a.files || []).some(function (f) { return f.media_type === 'VIDEO' && (f.video_url || f.file); });
    });

    grid.innerHTML = articles.map(function (article) {
      var files = article.files || [];
      var firstImage = files.find(function (f) { return f.media_type === 'IMAGE' && f.file; });
      var firstVideo = files.find(function (f) { return f.media_type === 'VIDEO' && (f.video_url || f.file); });
      var coverSrc = firstImage ? firstImage.file : '/static/images/home-video-preview/preview-1.jpg';
      var videoSrc = firstVideo ? (firstVideo.video_url || firstVideo.file || '') : '';

      var isVideo = !!videoSrc;

      return (
        '<div class="doc-article-card" data-video="' + videoSrc + '" data-slug="' + article.slug + '">' +
          '<div class="doc-article-thumb">' +
            '<img src="' + coverSrc + '" alt="' + (article.title || '') + '" loading="lazy">' +
            (isVideo ? '<div class="doc-article-play"><svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>' : '') +
          '</div>' +
          '<div class="doc-article-info">' +
            '<span class="doc-article-type">' + (isVideo ? 'ویدیو' : 'مقاله') + '</span>' +
            '<h4>' + (article.title || '') + '</h4>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    // Bind click events
    grid.querySelectorAll('.doc-article-card').forEach(function (card) {
      card.addEventListener('click', function (e) {
        var videoSrc = card.getAttribute('data-video');
        var slug = card.getAttribute('data-slug');
        if (videoSrc) {
          e.preventDefault();
          openVideoModal(videoSrc);
        } else if (slug) {
          window.location.href = '/blog/article/' + slug + '/';
        }
      });
    });

    // Show "see all" CTA if more than 4 articles
    if ((doc.articles || []).length > 4) {
      cta.style.display = '';
    }
  }

  /* ═══════════════════════════════════════════
     REVIEWS
     ═══════════════════════════════════════════ */
  function renderReviews(doc) {
    var reviews = doc.reviews || [];
    var list = document.getElementById('docReviewsList');

    if (reviews.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem">هنوز نظری ثبت نشده است.</p>';
      return;
    }

    list.innerHTML = reviews.map(function (r) {
      var avgRating = Math.round(((r.professionalism_rating || 0) + (r.treatment_quality_rating || 0) + (r.communication_rating || 0)) / 3);
      var stars = '';
      for (var i = 0; i < Math.min(avgRating, 5); i++) stars += '⭐';
      var date = r.created_at ? toPersianDate(r.created_at) : '';

      return (
        '<div class="doc-review-card">' +
          '<div class="doc-review-header">' +
            '<div class="doc-review-user">' +
              '<div class="doc-review-avatar">' + (r.service_name ? r.service_name[0] : 'ب') + '</div>' +
              '<div>' +
                '<h4 class="doc-review-name">' + (r.service_name || 'بیمار') + '</h4>' +
                '<span class="doc-review-date">' + date + '</span>' +
              '</div>' +
            '</div>' +
            (r.service_name ? '<span class="doc-review-badge">' + r.service_name + '</span>' : '') +
          '</div>' +
          '<div class="doc-review-stars">' + stars + '</div>' +
          '<p class="doc-review-text">' + (r.content || '') + '</p>' +
        '</div>'
      );
    }).join('');
  }

  /* ═══════════════════════════════════════════
     TESTIMONIAL VIDEO
     ═══════════════════════════════════════════ */
  function renderTestimonialVideo(doc) {
    if (!doc.doctor_testimonial) return;
    var container = document.getElementById('docReviewVideo');
    container.style.display = '';
    var player = container.querySelector('.doc-review-video-player');
    player.querySelector('source').src = doc.doctor_testimonial;
  }

  /* ═══════════════════════════════════════════
     VIDEO MODAL
     ═══════════════════════════════════════════ */
  function openVideoModal(videoSrc) {
    var modal = document.getElementById('videoModal');
    if (!modal) return;
    var player = modal.querySelector('.video-modal-player');
    player.querySelector('source').src = videoSrc;
    player.load();
    modal.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    player.play();
  }

  function initVideoModal() {
    var modal = document.getElementById('videoModal');
    if (!modal) return;
    var player = modal.querySelector('.video-modal-player');
    var closeBtn = modal.querySelector('.video-modal-close');
    var overlay = modal.querySelector('.video-modal-overlay');

    function closeModal() {
      modal.classList.remove('is-active');
      player.pause();
      player.currentTime = 0;
      player.querySelector('source').src = '';
      document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-active')) closeModal();
    });
  }  /* ═══════════════════════════════════════════
     BA SLIDER (same as before-after.js)
     ═══════════════════════════════════════════ */
  function initBASliders() {
    document.querySelectorAll('.ba-container').forEach(function (container) {
      if (container.dataset.baInit) return;
      container.dataset.baInit = '1';

      var slider = container.querySelector('.ba-slider');
      var handle = container.querySelector('.ba-handle');
      var beforeImg = container.querySelector('.ba-before');
      if (!slider || !handle || !beforeImg) return;

      var isDragging = false;

      function updateSlider(x) {
        var rect = container.getBoundingClientRect();
        var pos = (x - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));
        slider.style.left = (pos * 100) + '%';
        beforeImg.style.clipPath = 'inset(0 ' + ((1 - pos) * 100) + '% 0 0)';
        container.setAttribute('aria-valuenow', Math.round(pos * 100));
      }

      container.addEventListener('mousedown', function (e) {
        isDragging = true; updateSlider(e.clientX);
      });
      document.addEventListener('mousemove', function (e) {
        if (!isDragging) return; e.preventDefault(); updateSlider(e.clientX);
      });
      document.addEventListener('mouseup', function () { isDragging = false; });

      container.addEventListener('touchstart', function (e) {
        isDragging = true; updateSlider(e.touches[0].clientX);
      }, { passive: true });
      container.addEventListener('touchmove', function (e) {
        if (!isDragging) return; e.preventDefault(); updateSlider(e.touches[0].clientX);
      }, { passive: false });
      container.addEventListener('touchend', function () { isDragging = false; });

      container.addEventListener('keydown', function (e) {
        var v = parseInt(container.getAttribute('aria-valuenow')) || 50;
        if (e.key === 'ArrowLeft') { v = Math.min(100, v + 5); }
        else if (e.key === 'ArrowRight') { v = Math.max(0, v - 5); }
        else return;
        e.preventDefault();
        slider.style.left = v + '%';
        beforeImg.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
        container.setAttribute('aria-valuenow', v);
      });
    });
  }

  /* ═══════════════════════════════════════════
     PERSIAN CALENDAR (static, booking sidebar)
     ═══════════════════════════════════════════ */
  function initCalendar() {
    var calDays = document.getElementById('docCalDays');
    var calMonth = document.getElementById('docCalMonth');
    var calPrev = document.getElementById('docCalPrev');
    var calNext = document.getElementById('docCalNext');
    if (!calDays || !calMonth) return;
    var jalaliMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    var today = new Date();
    var jY = today.getFullYear() - 621 + (today.getMonth() < 2 ? 0 : 1);
    var jM = ((today.getMonth() + 9) % 12);
    var calYear = jY, calMonthIdx = jM;

    function renderCalendar() {
      calMonth.textContent = jalaliMonths[calMonthIdx] + ' ' + calYear;
      var daysInMonth = 31;
      if (calMonthIdx >= 6 && calMonthIdx < 11) daysInMonth = 30;
      if (calMonthIdx === 11) daysInMonth = 29;
      var startDay = (calMonthIdx < 6 ? calMonthIdx + 1 : calMonthIdx - 5);
      var offset = (startDay + 1) % 7;
      var html = '';
      for (var i = 0; i < offset; i++) html += '<button class="doc-cal-day is-empty" disabled></button>';
      for (var d = 1; d <= daysInMonth; d++) {
        var isToday = (d === today.getDate() && calMonthIdx === jM && calYear === jY);
        var isPast = (calYear < jY || (calYear === jY && calMonthIdx < jM) || (calYear === jY && calMonthIdx === jM && d < today.getDate()));
        var cls = 'doc-cal-day';
        if (isToday) cls += ' is-today';
        if (isPast) cls += ' is-disabled';
        html += '<button class="' + cls + '"' + (isPast ? ' disabled' : '') + '>' + d + '</button>';
      }
      calDays.innerHTML = html;
      calDays.querySelectorAll('.doc-cal-day:not(.is-disabled):not(.is-empty)').forEach(function (btn) {
        btn.addEventListener('click', function () {
          calDays.querySelectorAll('.doc-cal-day').forEach(function (b) { b.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
        });
      });
    }
    if (calPrev) calPrev.addEventListener('click', function () { calMonthIdx = (calMonthIdx + 11) % 12; if (calMonthIdx === 11) calYear--; renderCalendar(); });
    if (calNext) calNext.addEventListener('click', function () { calMonthIdx = (calMonthIdx + 1) % 12; if (calMonthIdx === 0) calYear++; renderCalendar(); });
    renderCalendar();
  }

  /* ═══════════════════════════════════════════
     STATIC SIDEBAR INTERACTIONS
     ═══════════════════════════════════════════ */
  function initStaticInteractions() {
    // Booking type toggle
    document.querySelectorAll('.doc-booking-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.doc-booking-type-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
      });
    });

    // Time slots
    document.querySelectorAll('.doc-slot-btn:not(.is-disabled)').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.doc-slot-btn').forEach(function (b) { b.classList.remove('is-selected'); });
        btn.classList.add('is-selected');
      });
    });
  }

  /* ═══════════════════════════════════════════
     SCROLL ANIMATIONS
     ═══════════════════════════════════════════ */
  function initScrollReveal() {
    var revealEls = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && revealEls.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { observer.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ═══════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════ */
  initCalendar();
  initStaticInteractions();
  initVideoModal();
  loadDoctor().then(function () {
    initScrollReveal();
  });
});
