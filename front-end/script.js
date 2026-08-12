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

    function slide() {
      const visible = getVisibleCount();
      const cardWidth = 100 / visible;
      track.style.transform = `translateX(-${currentIndex * cardWidth}%)`;
      updateArrows();
    }

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) { currentIndex--; slide(); }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < getMaxIndex()) { currentIndex++; slide(); }
    });

    window.addEventListener('resize', () => {
      if (currentIndex > getMaxIndex()) currentIndex = getMaxIndex();
      slide();
    });

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

    function updateSlider(x) {
      const rect = container.getBoundingClientRect();
      let pos = (x - rect.left) / rect.width;
      pos = Math.max(0, Math.min(1, pos));
      const pct = pos * 100;
      beforeImg.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      sliderLine.style.left = `${pct}%`;
      // لیبل سمت چپ (before) فقط وقتی اسلایدر > 20% باشه
      labelBefore.style.opacity = pct > 20 ? '1' : '0';
      // لیبل سمت راست (after) فقط وقتی اسلایدر < 80% باشه
      labelAfter.style.opacity = pct < 80 ? '1' : '0';
    }

    container.addEventListener('mousedown', e => {
      isDragging = true;
      updateSlider(e.clientX);
    });

    container.addEventListener('touchstart', e => {
      isDragging = true;
      updateSlider(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('mousemove', e => {
      if (isDragging) updateSlider(e.clientX);
    });

    window.addEventListener('touchmove', e => {
      if (isDragging) updateSlider(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('mouseup', () => { isDragging = false; });
    window.addEventListener('touchend', () => { isDragging = false; });
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
