/**
 * Dentura — Home Page Interactions
 * Hero animations, parallax, floating cards, slider, testimonials, video modal
 */

// ===========================================================
// Dentura — Hero interactions
// ===========================================================

// --- اسلایدر قبل / بعد ---
function initBA() {
  document.querySelectorAll('[data-ba]').forEach(card => {
    if (card._baInit) return;
    card._baInit = true;
    const container = card.querySelector('.ba-container');
    const beforeImg = card.querySelector('.ba-before');
    const sliderLine = card.querySelector('.ba-slider');
    const labelBefore = card.querySelector('.ba-label-before');
    const labelAfter = card.querySelector('.ba-label-after');
    if (!container || !beforeImg) return;
    let isDragging = false;
    let currentPct = 50;
    function setPosition(pct) {
      currentPct = Math.max(0, Math.min(100, pct));
      beforeImg.style.clipPath = 'inset(0 ' + (100 - currentPct) + '% 0 0)';
      sliderLine.style.left = currentPct + '%';
      labelBefore.style.opacity = currentPct > 20 ? '1' : '0';
      labelAfter.style.opacity = currentPct < 80 ? '1' : '0';
      container.setAttribute('aria-valuenow', Math.round(currentPct));
    }
    function updateFromPointer(x) {
      const rect = container.getBoundingClientRect();
      const pos = (x - rect.left) / rect.width;
      setPosition(pos * 100);
    }
    container.addEventListener('mousedown', function(e) { isDragging = true; updateFromPointer(e.clientX); });
    container.addEventListener('touchstart', function(e) { isDragging = true; updateFromPointer(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('mousemove', function(e) { if (isDragging) updateFromPointer(e.clientX); });
    window.addEventListener('touchmove', function(e) { if (isDragging) updateFromPointer(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('mouseup', function() { isDragging = false; });
    window.addEventListener('touchend', function() { isDragging = false; });
    var STEP = 5;
    container.addEventListener('keydown', function(e) {
      switch (e.key) {
        case 'ArrowRight': setPosition(currentPct + STEP); e.preventDefault(); break;
        case 'ArrowLeft': setPosition(currentPct - STEP); e.preventDefault(); break;
        case 'Home': setPosition(0); e.preventDefault(); break;
        case 'End': setPosition(100); e.preventDefault(); break;
        default: return;
      }
    });
    setPosition(50);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // اسکرول بک‌دکمه مرورگر به حالت طبیعی برگشت (حذف scrollRestoration='manual')

  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Shared utility ---
  function toPersianNum(num) {
    const digits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(num).replace(/\d/g, d => digits[d]);
  }

  // --- حذف افکت shimmer وقتی عکس واقعی لود شد ---
  document.querySelectorAll('.tile-photo, .tile-accent-photo, .doctor-img').forEach(wrapper => {
    const img = wrapper.querySelector('img');
    if (!img) return;
    const markLoaded = () => wrapper.classList.add('img-loaded');
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded);
      img.addEventListener('error', markLoaded);
    }
  });

  // ================= HERO PREMIUM ANIMATIONS =================
  const heroSection = document.querySelector('.hero');
  const heroInner = document.querySelector('.hero-inner');
  const heroLines = document.querySelectorAll('.hero-title .line');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const heroCta = document.querySelector('.hero-cta');
  const galleryTiles = document.querySelectorAll('.gallery .tile');
  const bgGlow = document.querySelector('.hero-glow');

  // --- Stagger hero text entrance ---
  setTimeout(() => {
    heroLines.forEach(line => line.classList.add('animate'));
    heroSubtitle.classList.add('animate');
  }, 100);

  // --- Stagger gallery card entrance ---
  setTimeout(() => {
    galleryTiles.forEach(tile => tile.classList.add('entering'));
    // Trigger CTA after cards
    setTimeout(() => {
      heroCta.classList.add('animate');
    }, 400);
    // Start floating after entrance completes
    setTimeout(() => {
      if (!REDUCED_MOTION) initFloatingCards();
      initCountAnimation();
    }, 1200);
  }, 600);

  // --- Floating animation for cards ---
  function initFloatingCards() {
    galleryTiles.forEach(tile => {
      const duration = parseFloat(tile.dataset.floatDuration) || 5;
      const delay = parseFloat(tile.dataset.floatDelay) || 0;
      const distance = 2 + Math.random() * 2; // 2-4px
      tile.style.setProperty('--float-duration', `${duration}s`);
      tile.style.setProperty('--float-delay', `${delay}s`);
      tile.style.setProperty('--float-distance', `-${distance}px`);
      tile.classList.add('floating');
    });
  }

  // --- Count animation for statistics ---
  function initCountAnimation() {
    const statNumbers = document.querySelectorAll('[data-count-to]');
    statNumbers.forEach(el => {
      const target = parseInt(el.dataset.countTo, 10);
      const suffix = el.dataset.countSuffix || '';

      // با reduced-motion، عدد نهایی بلافاصله نمایش داده می‌شود
      if (REDUCED_MOTION) {
        el.innerHTML = `${toPersianNum(target)}<span>${suffix}</span>`;
        return;
      }

      const duration = 1500;
      const startTime = performance.now();
      
      function easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
      }
      
      function updateCount(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuart(progress);
        const currentValue = Math.round(easedProgress * target);
        el.innerHTML = `${toPersianNum(currentValue)}<span>${suffix}</span>`;
        
        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      }
      
      requestAnimationFrame(updateCount);
    });
  }

  // --- Mouse parallax effect ---
  let mouseX = 0, mouseY = 0;
  let currentX = 0, currentY = 0;
  let isParallaxActive = true;

  document.addEventListener('mousemove', (e) => {
    const rect = heroSection.getBoundingClientRect();
    if (e.clientY > rect.bottom + 100 || e.clientY < rect.top - 100) {
      isParallaxActive = false;
      return;
    }
    isParallaxActive = true;
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function animateParallax() {
    if (!isParallaxActive) {
      currentX += (0 - currentX) * 0.05;
      currentY += (0 - currentY) * 0.05;
    } else {
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;
    }

    // Background glow movement (8-10px)
    if (bgGlow) {
      bgGlow.style.transform = `translate(calc(-50% + ${currentX * 10}px), calc(-50% + ${currentY * 10}px))`;
    }

    // Hero inner movement (3px for subtle shift)
    if (heroInner) {
      heroInner.style.transform = `translate(${currentX * 3}px, ${currentY * 3}px)`;
    }

    // Surrounding cards parallax (5-7px)
    galleryTiles.forEach(tile => {
      const factor = parseFloat(tile.dataset.parallaxCard) || 0.5;
      const tx = currentX * 7 * factor;
      const ty = currentY * 7 * factor;
      if (!tile.classList.contains('floating')) {
        tile.style.transform = `translate(${tx}px, ${ty}px)`;
      }
    });

    requestAnimationFrame(animateParallax);
  }

  // Start parallax animation loop
  if (!REDUCED_MOTION) requestAnimationFrame(animateParallax);

  // --- دکمه‌های رزرو نوبت ---
  const bookButtons = document.querySelectorAll('.btn-primary');
  bookButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // اینجا میتونی به بخش فرم رزرو اسکرول کنی یا مودال باز کنی
      console.log('درخواست رزرو نوبت ثبت شد.');
      // مثال: window.location.href = '#booking';
    });
  });

  // --- دکمه نمونه کارها ---
  const portfolioBtn = document.querySelector('.btn-outline');
  if (portfolioBtn) {
    portfolioBtn.addEventListener('click', () => {
      console.log('نمایش نمونه کارها');
      // مثال: window.location.href = '#portfolio';
    });
  }

  // --- اسلایدر عمومی ---
  function initSlider(section) {
    const track = section.querySelector('.doctors-track');
    const cards = section.querySelectorAll('.doctor-card');
    const prevBtn = section.querySelector('.slider-arrow-left');
    const nextBtn = section.querySelector('.slider-arrow-right');
    // dots و ناحیه live نه داخل wrapper بلکه بلافاصله بعدش قرار دارن
    const dotsContainer = section.parentElement.querySelector('.slider-dots');
    const liveRegion = section.parentElement.querySelector('.sr-only[aria-live]');
    const sectionLabel = section.getAttribute('aria-label') || '';

    if (!track || !cards.length || !prevBtn || !nextBtn) return;

    let currentIndex = 0;

    function getVisibleCount() {
      const w = window.innerWidth;
      if (w <= 620) return 1;
      if (w <= 900) return 2;
      return 3;
    }

    function getMaxIndex() {
      return Math.max(0, cards.length - getVisibleCount());
    }

    function updateArrows() {
      prevBtn.disabled = currentIndex <= 0;
      prevBtn.classList.toggle('disabled', currentIndex <= 0);
      nextBtn.disabled = currentIndex >= getMaxIndex();
      nextBtn.classList.toggle('disabled', currentIndex >= getMaxIndex());
    }

    // تعداد نقاط = تعداد توقف‌های ممکن اسلایدر، نه تعداد کارت‌ها
    // (مثلا ۶ کارت با نمایش ۳ تایی یعنی ۴ توقف: ۰،۱،۲،۳)
    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const stops = getMaxIndex() + 1;
      if (stops <= 1) return; // اگه همه کارت‌ها یکجا دیده میشن، نقطه‌ای لازم نیست
      for (let i = 0; i < stops; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `رفتن به گروه ${i + 1} از ${stops}`);
        dot.addEventListener('click', () => {
          currentIndex = i;
          slide();
        });
        dotsContainer.appendChild(dot);
      }
    }

    function updateDots() {
      if (!dotsContainer) return;
      const dots = dotsContainer.querySelectorAll('.slider-dot');
      dots.forEach((dot, i) => {
        const active = i === currentIndex;
        dot.classList.toggle('is-active', active);
        dot.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function announcePosition() {
      if (!liveRegion) return;
      const stops = getMaxIndex() + 1;
      if (stops <= 1) return;
      liveRegion.textContent = `${sectionLabel} — گروه ${currentIndex + 1} از ${stops}`;
    }

    function slide() {
      const visible = getVisibleCount();
      const cardWidth = 100 / visible;
      track.style.transform = `translateX(-${currentIndex * cardWidth}%)`;
      updateArrows();
      updateDots();
      announcePosition();
    }

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) { currentIndex--; slide(); }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < getMaxIndex()) { currentIndex++; slide(); }
    });

    let lastVisibleCount = getVisibleCount();
    window.addEventListener('resize', () => {
      const visible = getVisibleCount();
      if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
      // فقط وقتی تعداد کارت‌های قابل‌نمایش عوض بشه (مثلا موبایل↔تبلت) نقاط رو دوباره می‌سازیم
      if (visible !== lastVisibleCount) {
        lastVisibleCount = visible;
        buildDots();
      }
      slide();
    });

    buildDots();
    slide();
  }

  // ================= UTILITY: Normalize DRF Response =================
  // DRF ممکنه response رو در {results: [...]} بپیچونه (pagination)
  function toArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    console.warn('API response is not an array:', data);
    return [];
  }

  // ================= FETCH DOCTORS FROM API =================
  async function fetchAndRenderDoctors() {
    const track = document.getElementById('doctorsTrack');
    if (!track) return;

    try {
      const res = await fetch('/api/doctors/');
      if (!res.ok) throw new Error('API response not OK');
      const doctors = toArray(await res.json());

      track.innerHTML = '';

      doctors.forEach(doc => {
        const photoUrl = doc.doctor_photos?.blog_photo || '/static/images/doctors/default.jpg';
        const a = document.createElement('a');
        a.href = '/doctors/' + doc.slug + '/';
        a.className = 'doctor-card';
        a.setAttribute('aria-label', 'سوابق دکتر ' + doc.full_name);
        a.innerHTML = `
          <div class="doctor-img">
            <img src="${photoUrl}" alt="دکتر ${doc.full_name}">
            <div class="doctor-overlay">
              <span class="doctor-overlay-text">سوابق دکتر</span>
            </div>
          </div>
          <h3 class="doctor-name">دکتر ${doc.full_name}</h3>
          <p class="doctor-specialty">${doc.speciality}</p>
          <p class="doctor-university">${doc.university}</p>
        `;
        track.appendChild(a);
      });

      // بازмقداردهی اسلایدر بعد از رندر دینامیک
      const doctorsWrapper = track.closest('.doctors-slider-wrapper');
      if (doctorsWrapper) {
        initSlider(doctorsWrapper);
      }

    } catch (err) {
      console.error('خطا در دریافت لیست دکترها:', err);
    }
  }

  fetchAndRenderDoctors();

  // ================= FETCH ASSISTANTS FROM API =================
  async function fetchAndRenderAssistants() {
    const track = document.getElementById('assistantsTrack');
    if (!track) return;

    try {
      const res = await fetch('/api/assistants/');
      if (!res.ok) throw new Error('API response not OK');
      const assistants = toArray(await res.json());

      track.innerHTML = '';

      assistants.forEach(ast => {
        const photoUrl = ast.blog_photo || '/static/images/assistants/default.jpg';
        const div = document.createElement('div');
        div.className = 'doctor-card';
        div.innerHTML = `
          <div class="doctor-img">
            <img src="${photoUrl}" alt="${ast.full_name}">
          </div>
          <h3 class="doctor-name">${ast.full_name}</h3>
          <p class="doctor-specialty">${ast.speciality}</p>
        `;
        track.appendChild(div);
      });

      // بازمقداردهی اسلایدر بعد از رندر دینامیک
      const assistantsWrapper = track.closest('.doctors-slider-wrapper');
      if (assistantsWrapper) {
        initSlider(assistantsWrapper);
      }

    } catch (err) {
      console.error('خطا در دریافت لیست دستیاران:', err);
    }
  }

  fetchAndRenderAssistants();

  // ================= FETCH BEFORE/AFTER FROM API =================
  async function fetchAndRenderBeforeAfter() {
    const grid = document.getElementById('beforeAfterGrid');
    if (!grid) return;

    try {
      const res = await fetch('/api/before-afters/');
      if (!res.ok) throw new Error('API response not OK');
      const items = toArray(await res.json());

      grid.innerHTML = '';

      items.forEach(item => {
        const desc = item.description || '';
        const doctorName = item.doctor_name || '';
        const div = document.createElement('div');
        div.className = 'doctor-card';
        div.setAttribute('data-ba', '');
        div.innerHTML = `
          <div class="doctor-img ba-container" tabindex="0" role="slider"
               aria-label="مقایسه قبل و بعد ${desc}، با کشیدن یا کلیدهای جهت‌نما"
               aria-valuemin="0"
               aria-valuemax="100" aria-valuenow="50">
            <img class="ba-img ba-after" src="${item.after_image}" alt="نتیجه بعد از ${desc}">
            <img class="ba-img ba-before" src="${item.before_image}" alt="وضعیت قبل از ${desc}">
            <div class="ba-slider">
              <div class="ba-handle"></div>
            </div>
            <span class="ba-label ba-label-before">قبل</span>
            <span class="ba-label ba-label-after">بعد</span>
          </div>
          <p class="doctor-name">${desc}</p>
        `;
        grid.appendChild(div);
      });

      // بازمقداردهی اسلایدرهای قبل/بعد
      initBA();

    } catch (err) {
      console.error('خطا در دریافت نمونه کارها:', err);
    }
  }

  fetchAndRenderBeforeAfter();

  // ================= FETCH TESTIMONIALS FROM API =================
  async function fetchAndRenderTestimonials() {
    const deck = document.getElementById('testimonialsDeck');
    if (!deck) return;

    try {
      const res = await fetch('/api/doctor-reviews/');
      if (!res.ok) throw new Error('API response not OK');
      const testimonials = toArray(await res.json());

      deck.innerHTML = '';

      const starSvg = `<svg class="star-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;

      testimonials.forEach((item, index) => {
        // ساخت ستاره‌ها بر اساس میانگین سه امتیاز
        const avgRating = Math.round(((parseFloat(item.professionalism_rating) || 0) + (parseFloat(item.treatment_quality_rating) || 0) + (parseFloat(item.communication_rating) || 0)) / 3);
        const rating = Math.min(Math.max(avgRating, 0), 5);
        let starsHtml = '';
        for (let i = 0; i < rating; i++) {
          starsHtml += starSvg;
        }

        // نام بیمار
        const fullName = item.full_name || 'بیمار دنتورا';

        // نام خدمت
        const serviceName = item.service_name || '';

        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.setAttribute('data-index', index);
        card.innerHTML = `
          <div class="testimonial-stars">
            ${starsHtml}
          </div>
          <blockquote class="testimonial-quote">
            ${item.content}
          </blockquote>
          <div class="testimonial-user">
            <span class="testimonial-name">${fullName}</span>
            ${serviceName ? `<span class="testimonial-badge">درمان: ${serviceName}</span>` : ''}
          </div>
        `;
        deck.appendChild(card);
      });

      // بازمقداردهی اسلایدر نظرات بعد از رندر دینامیک
      initTestimonialsSlider();

    } catch (err) {
      console.error('خطا در دریافت نظرات بیماران:', err);
    }
  }

  fetchAndRenderTestimonials();

  // --- Fetch and render video blog cards from API ---
  async function fetchAndRenderVideos() {
    const grid = document.getElementById('videoBlogGrid');
    if (!grid) return;

    try {
      const res = await fetch('/api/home-videos/');
      if (!res.ok) throw new Error('API response not OK');
      const articles = toArray(await res.json());

      grid.innerHTML = '';

      articles.forEach((article) => {
        // پیدا کردن اولین تصویر برای کاور
        const files = article.files || [];
        const firstImage = files.find(f => f.media_type === 'IMAGE' && f.file);
        const coverSrc = firstImage ? firstImage.file : '/static/images/home-video-preview/preview-1.jpg';

        // پیدا کردن اولین ویدیو برای پلی
        const firstVideo = files.find(f => f.media_type === 'VIDEO' && (f.video_url || f.file));
        const videoSrc = firstVideo ? (firstVideo.video_url || firstVideo.file || '') : '';

        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
          <div class="video-card-thumb">
            <img src="${coverSrc}" alt="${article.full_name}">
            <div class="video-play-btn" data-video="${videoSrc}">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
          <div class="video-card-info">
            <span class="video-card-name">${article.full_name}</span>
            <span class="video-card-role">${article.category_name}</span>
            <h4 class="video-card-title">${article.title}</h4>
            <a href="/blog/article/${article.slug}/" class="video-card-cta">مشاهده ادامه بلاگ</a>
          </div>
        `;
        grid.appendChild(card);
      });

      // راه‌اندازی مجدد ویدیو مودال برای کارت‌های جدید
      initVideoModal();

    } catch (err) {
      console.error('خطا در دریافت ویدیوهای آموزشی:', err);
    }
  }

  fetchAndRenderVideos();

  // Apply BA sliders on page load
  initBA();

  // --- افکت اسکرول روی هدر (کوچک‌تر شدن هنگام اسکرول) ---
  const header = document.querySelector('.header-inner');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  });

  // --- انیمیشن ظاهر شدن سکشن‌ها هنگام اسکرول ---
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback: no IntersectionObserver support, just show everything
    revealEls.forEach(el => el.classList.add('is-visible'));
  }
  // ================= TESTIMONIALS STACKED DECK =================
  // این تابع بعد از رندر دینامیک کارت‌ها از API صدا زده میشه
  function initTestimonialsSlider() {
    const deck = document.querySelector('.testimonials-deck');
    if (!deck) return;

    // حذف کارت‌های قبلی slider (اگه re-init باشه)
    deck.querySelectorAll('.testimonial-card').forEach(c => {
      c.removeAttribute('data-pos');
    });

    const cards = Array.from(deck.querySelectorAll('.testimonial-card'));
    if (cards.length === 0) return;

    const dotsContainer = document.querySelector('.testimonials-dots');
    const prevBtn = document.querySelector('.testimonials-prev');
    const nextBtn = document.querySelector('.testimonials-next');
    const total = cards.length;
    let current = 0;
    let timer = null;

    /* Measure tallest card & size deck to match */
    function measureDeckHeight() {
      cards.forEach(function (c) {
        c.style.position = 'relative';
        c.style.visibility = 'hidden';
        c.style.transform = 'none';
        c.style.opacity = '0';
        c.style.zIndex = '1';
      });
      var maxH = 0;
      cards.forEach(function (c) {
        if (c.scrollHeight > maxH) maxH = c.scrollHeight;
      });
      deck.style.height = maxH + 'px';
      cards.forEach(function (c) {
        c.style.position = '';
        c.style.visibility = '';
        c.style.transform = '';
        c.style.opacity = '';
        c.style.zIndex = '';
      });
    }
    measureDeckHeight();

    function update() {
      cards.forEach((card, i) => {
        const d = i - current;
        let p = 'hidden';
        if (d === 0) p = 'front';
        else if (d === 1) p = 'next-1';
        else if (d === 2) p = 'next-2';
        else if (d === -1) p = 'prev-1';
        else if (d === -2) p = 'prev-2';
        card.setAttribute('data-pos', p);
      });
      if (dotsContainer) {
        dotsContainer.querySelectorAll('.testimonials-dot').forEach((d, i) => {
          d.classList.toggle('is-active', i === current);
        });
      }
      if (prevBtn) prevBtn.disabled = current <= 0;
      if (nextBtn) nextBtn.disabled = current >= total - 1;
    }

    function goTo(i) {
      current = (i + total) % total;
      update();
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(function tick() {
        current = (current + 1) % total;
        update();
        timer = setTimeout(tick, 8000);
      }, 8000);
    }

    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'testimonials-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `رفتن به نظر ${i + 1} از ${total}`);
        dot.addEventListener('click', function() { goTo(i); schedule(); });
        dotsContainer.appendChild(dot);
      }
    }

    if (prevBtn) prevBtn.addEventListener('click', function() { goTo(current - 1); schedule(); });
    if (nextBtn) nextBtn.addEventListener('click', function() { goTo(current + 1); schedule(); });

    deck.addEventListener('mouseenter', function() { clearTimeout(timer); });
    deck.addEventListener('mouseleave', schedule);

    let tx = 0;
    deck.addEventListener('touchstart', function(e) { tx = e.touches[0].clientX; clearTimeout(timer); }, { passive: true });
    deck.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - tx;
      if (dx < -50) goTo(current + 1);
      else if (dx > 50) goTo(current - 1);
      schedule();
    });

    buildDots();
    update();
    schedule();
  }

  // ================= LIVE SOCIAL PROOF COUNTER =================
  const liveCountEl = document.getElementById('live-count');
  if (liveCountEl) {
    function updateLiveCount() {
      const base = 18;
      const variation = Math.floor(Math.random() * 14) + 1;
      liveCountEl.textContent = toPersianNum(base + variation);
    }
    setInterval(updateLiveCount, 5000);
  }

  // ================= CTA BUTTON RIPPLE =================
  document.querySelectorAll('.btn-primary, .btn-outline').forEach(btn => {
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // ================= VIDEO MODAL =================
  function initVideoModal() {
    const videoModal = document.getElementById('videoModal');
    if (!videoModal) return;
    const videoModalPlayer = videoModal.querySelector('.video-modal-player');
    const videoModalClose = videoModal.querySelector('.video-modal-close');
    const videoModalOverlay = videoModal.querySelector('.video-modal-overlay');

    // Remove old listeners by cloning buttons
    videoModalClose.replaceWith(videoModalClose.cloneNode(true));
    videoModalOverlay.replaceWith(videoModalOverlay.cloneNode(true));

    const newClose = videoModal.querySelector('.video-modal-close');
    const newOverlay = videoModal.querySelector('.video-modal-overlay');

    // Open video modal — only bind to play buttons that don't have a listener yet
    document.querySelectorAll('.video-play-btn[data-video]').forEach(btn => {
      if (btn.dataset.modalInit) return;
      btn.dataset.modalInit = '1';
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const videoSrc = this.getAttribute('data-video');
        if (videoSrc) {
          videoModalPlayer.querySelector('source').src = videoSrc;
          videoModalPlayer.load();
          videoModal.classList.add('is-active');
          document.body.classList.add('video-modal-open');
          videoModalPlayer.play();
          document.body.style.overflow = 'hidden';
        }
      });
    });

    // Close video modal function
    function closeVideoModal() {
      videoModal.classList.remove('is-active');
      document.body.classList.remove('video-modal-open');
      videoModalPlayer.pause();
      videoModalPlayer.currentTime = 0;
      videoModalPlayer.querySelector('source').src = '';
      document.body.style.overflow = '';
    }

    // Close on button click
    newClose.addEventListener('click', closeVideoModal);

    // Close on overlay click
    newOverlay.addEventListener('click', closeVideoModal);

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && videoModal.classList.contains('is-active')) {
        closeVideoModal();
      }
    });
  }

  initVideoModal();

});
