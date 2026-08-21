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
      initFloatingCards();
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
  requestAnimationFrame(animateParallax);

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

  // --- دکمه شناور رزرو نوبت در موبایل ---
  const mobileCta = document.querySelector('.mobile-sticky-cta');

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

  // ================= TESTIMONIALS STACKED DECK =================
  const deck = document.querySelector('.testimonials-deck');
  if (deck) {
    const cards = Array.from(deck.querySelectorAll('.testimonial-card'));
    const dotsContainer = document.querySelector('.testimonials-dots');
    const prevBtn = document.querySelector('.testimonials-prev');
    const nextBtn = document.querySelector('.testimonials-next');
    const total = cards.length;
    let current = 0;
    let timer = null;

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
  const videoModal = document.getElementById('videoModal');
  const videoModalPlayer = videoModal.querySelector('.video-modal-player');
  const videoModalClose = videoModal.querySelector('.video-modal-close');
  const videoModalOverlay = videoModal.querySelector('.video-modal-overlay');

  // Open video modal
  document.querySelectorAll('.video-play-btn[data-video]').forEach(btn => {
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
  videoModalClose.addEventListener('click', closeVideoModal);

  // Close on overlay click
  videoModalOverlay.addEventListener('click', closeVideoModal);

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && videoModal.classList.contains('is-active')) {
      closeVideoModal();
    }
  });

});
