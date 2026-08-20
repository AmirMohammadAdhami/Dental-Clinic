// ===========================================================
// Dentura — Hero interactions
// ===========================================================

document.addEventListener('DOMContentLoaded', () => {

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

  // --- ظاهر شدن نرم عکس‌ها و کارت‌ها هنگام ورود به صفحه ---
  const tiles = document.querySelectorAll('.gallery .tile');

  tiles.forEach((tile, index) => {
    tile.style.opacity = '0';
    tile.style.transform = 'translateY(24px)';
    tile.style.transition = `opacity 0.6s ease ${index * 0.08}s, transform 0.6s ease ${index * 0.08}s`;
  });

  requestAnimationFrame(() => {
    setTimeout(() => {
      tiles.forEach(tile => {
        tile.style.opacity = '1';
        tile.style.transform = 'translateY(0)';

        // بعد از اتمام ترانزیشن ورود، استایل‌های inline رو پاک می‌کنیم
        // چون در غیر این صورت transform:translateY(0) روی خود المنت باقی می‌مونه
        // و برای همیشه جلوی افکت hover در CSS (که با اولویت کمتری تعریف شده) رو می‌گیره
        const clearInlineStyles = (e) => {
          if (e.target !== tile || e.propertyName !== 'transform') return;
          tile.style.transform = '';
          tile.style.transition = '';
          tile.style.opacity = '';
          tile.removeEventListener('transitionend', clearInlineStyles);
        };
        tile.addEventListener('transitionend', clearInlineStyles);
      });
    }, 100);
  });

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

  // اعمال اسلایدر روی تمام سکشن‌ها
  document.querySelectorAll('.doctors-slider-wrapper').forEach(initSlider);

  // --- اسلایدر قبل / بعد ---
  document.querySelectorAll('[data-ba]').forEach(card => {
    const container = card.querySelector('.ba-container');
    const beforeImg = card.querySelector('.ba-before');
    const sliderLine = card.querySelector('.ba-slider');
    const labelBefore = card.querySelector('.ba-label-before');
    const labelAfter = card.querySelector('.ba-label-after');
    let isDragging = false;
    let currentPct = 50;

    // هسته‌ی مشترک: موقعیت رو با درصد (نه مختصات موس) تنظیم می‌کنه،
    // تا هم ورودی موس/لمس و هم صفحه‌کلید از همینجا استفاده کنن
    function setPosition(pct) {
      currentPct = Math.max(0, Math.min(100, pct));
      beforeImg.style.clipPath = `inset(0 ${100 - currentPct}% 0 0)`;
      sliderLine.style.left = `${currentPct}%`;
      // لیبل سمت چپ (before) فقط وقتی اسلایدر > 20% باشه
      labelBefore.style.opacity = currentPct > 20 ? '1' : '0';
      // لیبل سمت راست (after) فقط وقتی اسلایدر < 80% باشه
      labelAfter.style.opacity = currentPct < 80 ? '1' : '0';
      container.setAttribute('aria-valuenow', Math.round(currentPct));
    }

    function updateFromPointer(x) {
      const rect = container.getBoundingClientRect();
      const pos = (x - rect.left) / rect.width;
      setPosition(pos * 100);
    }

    container.addEventListener('mousedown', e => {
      isDragging = true;
      updateFromPointer(e.clientX);
    });

    container.addEventListener('touchstart', e => {
      isDragging = true;
      updateFromPointer(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('mousemove', e => {
      if (isDragging) updateFromPointer(e.clientX);
    });

    window.addEventListener('touchmove', e => {
      if (isDragging) updateFromPointer(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('touchend', () => { isDragging = false; });

    // --- پشتیبانی از صفحه‌کلید ---
    // جهت فلش‌ها بر اساس موقعیت فیزیکی روی صفحه تنظیم شده (نه جهت متن)
    // چون کاربر با چشم می‌بینه دستگیره به کدوم سمت حرکت می‌کنه
    const STEP = 5;
    container.addEventListener('keydown', e => {
      switch (e.key) {
        case 'ArrowRight':
          setPosition(currentPct + STEP);
          e.preventDefault();
          break;
        case 'ArrowLeft':
          setPosition(currentPct - STEP);
          e.preventDefault();
          break;
        case 'Home':
          setPosition(0);
          e.preventDefault();
          break;
        case 'End':
          setPosition(100);
          e.preventDefault();
          break;
        default:
          return;
      }
    });

    setPosition(50); // مقدار اولیه، هماهنگ با aria-valuenow="50" در HTML
  });

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

  // --- دکمه شناور رزرو نوبت در موبایل ---
  const mobileCta = document.querySelector('.mobile-sticky-cta');
  const heroSection = document.querySelector('.hero');

  if (mobileCta && heroSection) {
    const ctaObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // وقتی هیرو از دید خارج شد، دکمه شناور نمایش داده میشه
        mobileCta.classList.toggle('is-visible', !entry.isIntersecting);
      });
    }, { threshold: 0 });

    ctaObserver.observe(heroSection);

    mobileCta.querySelector('.btn').addEventListener('click', () => {
      console.log('درخواست رزرو نوبت (موبایل) ثبت شد.');
    });
  }

});
