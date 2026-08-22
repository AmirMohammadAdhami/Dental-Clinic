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
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

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

// ================= HAMBURGER MENU (all pages) =================
document.addEventListener('DOMContentLoaded', function () {
  var hamburger = document.getElementById('headerHamburger');
  var mobileNav = document.getElementById('headerMobileNav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', function () {
    var isOpen = hamburger.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', isOpen);
    mobileNav.classList.toggle('is-open');
  });

  document.addEventListener('click', function (e) {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      hamburger.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
    }
  });
});

// ================= TEAM PAGE — FILTER & SEARCH =================
document.addEventListener('DOMContentLoaded', function () {
  var teamGrid = document.getElementById('teamGrid');
  if (!teamGrid) return;

  var cards = Array.from(teamGrid.querySelectorAll('.team-doctor-card'));
  var pills = Array.from(document.querySelectorAll('.team-filter-pill'));
  var searchInput = document.getElementById('teamSearchInput');
  var noResults = document.getElementById('teamNoResults');

  /* Custom Dropdown */
  var dropdown = document.getElementById('teamServiceDropdown');
  var dropdownTrigger = document.getElementById('teamDropdownTrigger');
  var dropdownMenu = document.getElementById('teamDropdownMenu');
  var dropdownValue = dropdownTrigger ? dropdownTrigger.querySelector('.team-dropdown-value') : null;
  var dropdownItems = dropdownMenu ? Array.from(dropdownMenu.querySelectorAll('.team-dropdown-item')) : [];
  var selectedService = '';
  var activeFilter = 'all';

  function applyFilters() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var visible = 0;

    cards.forEach(function (card, idx) {
      var specialty = card.getAttribute('data-specialty') || '';
      var name = (card.querySelector('.team-card-name') || {}).textContent || '';
      var cardSpecialty = (card.querySelector('.team-card-specialty') || {}).textContent || '';
      var text = (name + ' ' + cardSpecialty).toLowerCase();

      var matchFilter = activeFilter === 'all' || specialty === activeFilter;
      var matchSearch = !query || text.indexOf(query) !== -1;
      var matchService = !selectedService || specialty === selectedService;

      var show = matchFilter && matchSearch && matchService;

      if (show) {
        card.classList.remove('team-card-hidden');
        card.style.position = '';
        card.style.visibility = '';
        card.classList.remove('team-card-visible');
        void card.offsetWidth;
        card.classList.add('team-card-visible');
        card.style.animationDelay = (visible * 0.06) + 's';
        visible++;
      } else {
        card.classList.remove('team-card-visible');
        card.classList.add('team-card-hidden');
      }
    });

    if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
  }

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      pills.forEach(function (p) { p.classList.remove('is-active'); p.setAttribute('aria-selected', 'false'); });
      pill.classList.add('is-active');
      pill.setAttribute('aria-selected', 'true');
      activeFilter = pill.getAttribute('data-filter');
      applyFilters();
    });
  });

  if (searchInput) searchInput.addEventListener('input', applyFilters);

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('is-open');
      dropdownTrigger.setAttribute('aria-expanded', isOpen);
    });

    dropdownItems.forEach(function (item) {
      item.addEventListener('click', function () {
        dropdownItems.forEach(function (i) { i.classList.remove('is-selected'); });
        item.classList.add('is-selected');
        selectedService = item.getAttribute('data-value');
        if (dropdownValue) dropdownValue.textContent = item.textContent;
        dropdown.classList.remove('is-open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
        applyFilters();
      });
    });

    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('is-open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    dropdownMenu.addEventListener('click', function (e) { e.stopPropagation(); });
  }
});

// ================= DOCTOR PAGE — Calendar, Reviews, BA Filter =================
document.addEventListener('DOMContentLoaded', function () {
  /* --- Persian Calendar --- */
  var calDays = document.getElementById('docCalDays');
  var calMonth = document.getElementById('docCalMonth');
  var calPrev = document.getElementById('docCalPrev');
  var calNext = document.getElementById('docCalNext');
  if (calDays && calMonth) {
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

  /* --- Booking Type Toggle --- */
  var bookingBtns = document.querySelectorAll('.doc-booking-type-btn');
  bookingBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      bookingBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
    });
  });

  /* --- Time Slots --- */
  var slotBtns = document.querySelectorAll('.doc-slot-btn:not(.is-disabled)');
  slotBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      slotBtns.forEach(function (b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
    });
  });

  /* --- BA Gallery Filter --- */
  var baPills = document.querySelectorAll('.doc-ba-pill');
  var baCards = document.querySelectorAll('.doc-ba-card');
  baPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      baPills.forEach(function (p) { p.classList.remove('is-active'); });
      pill.classList.add('is-active');
      var f = pill.getAttribute('data-filter');
      baCards.forEach(function (card) {
        if (f === 'all' || card.getAttribute('data-type') === f) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* --- Star Rating --- */
  var starBtns = document.querySelectorAll('.doc-star-btn');
  var selectedStars = 0;
  starBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedStars = parseInt(btn.getAttribute('data-star'));
      starBtns.forEach(function (b) {
        var s = parseInt(b.getAttribute('data-star'));
        b.textContent = s <= selectedStars ? '★' : '☆';
        b.classList.toggle('is-active', s <= selectedStars);
      });
    });
  });

  /* --- Review Form --- */
  var reviewForm = document.getElementById('docReviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده خواهد شد.');
      reviewForm.reset();
      selectedStars = 0;
      starBtns.forEach(function (b) { b.textContent = '☆'; b.classList.remove('is-active'); });
    });
  }
});

// ================= AUTH PAGE — Premium Flow =================
document.addEventListener('DOMContentLoaded', function () {
  var authCard = document.getElementById('authCard');
  if (!authCard) return;

  var slides = document.querySelectorAll('.auth-slide');
  var dots = document.querySelectorAll('.auth-dot');
  var progressFill = document.getElementById('authProgressFill');
  var currentStep = 1;
  var userPhone = '';

  // --- Phone Formatting ---
  var phoneInput = document.getElementById('authPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      // Convert Farsi digits to English
      phoneInput.value = phoneInput.value.replace(/[۰-۹]/g, function (d) {
        return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      }).replace(/[^0-9]/g, '').slice(0, 10);
    });
    setTimeout(function () { phoneInput.focus(); }, 200);
  }

  // --- Step Navigation ---
  function goToStep(step) {
    var oldSlide = document.querySelector('.auth-slide.is-active');
    var newSlide = document.querySelector('.auth-slide[data-step="' + step + '"]');
    if (!oldSlide || !newSlide || oldSlide === newSlide) return;

    oldSlide.classList.remove('is-active');
    oldSlide.classList.add('is-exiting');
    setTimeout(function () {
      oldSlide.classList.remove('is-exiting');
      newSlide.classList.add('is-active');
    }, 300);

    // Update dots
    dots.forEach(function (d, i) {
      d.classList.remove('is-active', 'is-done');
      if (i + 1 < step) d.classList.add('is-done');
      if (i + 1 === step) d.classList.add('is-active');
    });

    // Update progress bar
    if (progressFill) progressFill.style.width = (step / 3 * 100) + '%';
    currentStep = step;

    // Focus first input on new step
    setTimeout(function () {
      if (step === 1 && phoneInput) phoneInput.focus();
      if (step === 2) {
        var firstBox = document.querySelector('.auth-otp-input');
        if (firstBox) firstBox.focus();
      }
      if (step === 3) {
        var fn = document.getElementById('authFirstName');
        if (fn) fn.focus();
        triggerStagger();
      }
    }, 400);
  }

  // --- Step 1: Phone Submit ---
  var step1Form = document.getElementById('authStep1');
  var step1Btn = document.getElementById('authStep1Btn');
  if (step1Form) {
    step1Form.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = phoneInput ? phoneInput.value : '';
      if (val.length < 10) return;
      userPhone = val;
      // Format for display
      var masked = val.slice(0, 4) + '***' + val.slice(-3);
      var otpPhone = document.getElementById('authOtpPhone');
      if (otpPhone) otpPhone.textContent = masked;
      showLoading(step1Btn, function () { goToStep(2); });
    });
  }

  // --- Step 2: OTP ---
  var otpBoxes = document.querySelectorAll('.auth-otp-input');
  var step2Form = document.getElementById('authStep2');
  var step2Btn = document.getElementById('authStep2Btn');
  var backBtn = document.getElementById('authBackToStep1');
  var timerCircle = document.getElementById('authTimerCircle');
  var timerText = document.getElementById('authTimerText');
  var resendBtn = document.getElementById('authResendBtn');
  var timerSeconds = 119;
  var timerInterval = null;
  var CIRCUMFERENCE = 2 * Math.PI * 16;

  if (backBtn) backBtn.addEventListener('click', function (e) { e.preventDefault(); goToStep(1); });

  // Farsi to English helper
  function toEnDigits(str) {
    return str.replace(/[۰-۹]/g, function (d) {
      return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    });
  }

  // OTP Auto-advance
  otpBoxes.forEach(function (box, i) {
    box.addEventListener('input', function () {
      box.value = toEnDigits(box.value).replace(/[^0-9]/g, '').slice(-1);
      if (box.value) {
        box.classList.add('filled');
        if (i < otpBoxes.length - 1) {
          otpBoxes[i + 1].focus();
        } else {
          // Last box filled — auto submit
          setTimeout(function () {
            var code = '';
            otpBoxes.forEach(function (b) { code += b.value; });
            if (code.length === otpBoxes.length) {
              showLoading(step2Btn, function () { goToStep(3); });
            }
          }, 200);
        }
      } else {
        box.classList.remove('filled');
      }
    });
    box.addEventListener('keyup', function (e) {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        otpBoxes[i - 1].value = '';
        otpBoxes[i - 1].classList.remove('filled');
        otpBoxes[i - 1].focus();
      }
    });
    box.addEventListener('focus', function () { box.select(); });
    box.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      for (var j = 0; j < Math.min(text.length, otpBoxes.length); j++) {
        otpBoxes[j].value = text[j];
        otpBoxes[j].classList.add('filled');
      }
      var last = Math.min(text.length, otpBoxes.length) - 1;
      if (last >= 0) otpBoxes[last].focus();
    });
  });

  // Timer
  function startTimer() {
    timerSeconds = 119;
    resendBtn.disabled = true;
    resendBtn.style.display = 'none';
    if (timerCircle) timerCircle.style.strokeDashoffset = '0';
    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      timerSeconds--;
      var m = Math.floor(timerSeconds / 60);
      var s = timerSeconds % 60;
      if (timerText) timerText.textContent = toFa(m) + ':' + (s < 10 ? '۰' : '') + toFa(s);
      if (timerCircle) {
        var pct = timerSeconds / 119;
        timerCircle.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct));
      }
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        resendBtn.disabled = false;
        resendBtn.style.display = '';
        if (timerText) timerText.textContent = '';
        if (timerCircle) timerCircle.style.strokeDashoffset = String(CIRCUMFERENCE);
      }
    }, 1000);
  }

  function toFa(n) {
    var fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(n).split('').map(function (d) { return fa[parseInt(d)] || d; }).join('');
  }

  if (resendBtn) resendBtn.addEventListener('click', startTimer);
  startTimer();

  // OTP Submit
  if (step2Form) {
    step2Form.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = '';
      otpBoxes.forEach(function (b) { code += b.value; });
      if (code.length < otpBoxes.length) return;
      // Simulate: always go to step 3
      showLoading(step2Btn, function () { goToStep(3); });
    });
  }

  // --- Step 3: Profile ---
  var step3Form = document.getElementById('authStep3');
  var natInput = document.getElementById('authNationalCode');
  var natTick = document.getElementById('authNatTick');

  function triggerStagger() {
    document.querySelectorAll('.auth-slide[data-step="3"] .auth-stagger-item').forEach(function (el) {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    });
  }

  // National code validation
  if (natInput) {
    natInput.addEventListener('input', function () {
      natInput.value = toEnDigits(natInput.value).replace(/[^0-9]/g, '').slice(0, 10);
      if (natInput.value.length === 10 && validateNationalCode(natInput.value)) {
        natInput.classList.add('is-valid');
        if (natTick) natTick.style.display = '';
      } else {
        natInput.classList.remove('is-valid');
        if (natTick) natTick.style.display = 'none';
      }
    });
  }

  function validateNationalCode(code) {
    if (!/^\d{10}$/.test(code)) return false;
    var check = parseInt(code[9]);
    var sum = 0;
    for (var i = 0; i < 9; i++) sum += parseInt(code[i]) * (10 - i);
    var rem = sum % 11;
    return (rem < 2 && check === rem) || (rem >= 2 && check === 11 - rem);
  }

  // Profile Submit -> Success
  if (step3Form) {
    step3Form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fn = document.getElementById('authFirstName');
      var ln = document.getElementById('authLastName');
      var nc = document.getElementById('authNationalCode');
      if (!fn || !fn.value || !ln || !ln.value) return;
      if (!nc || nc.value.length !== 10 || !validateNationalCode(nc.value)) return;
      var btn = step3Form.querySelector('.auth-submit');
      showLoading(btn, function () {
        // Hide slides, show success
        var slidesWrap = document.getElementById('authSlides');
        var progress = document.querySelector('.auth-progress');
        var success = document.getElementById('authSuccess');
        if (slidesWrap) slidesWrap.style.display = 'none';
        if (progress) progress.style.display = 'none';
        if (success) success.style.display = '';
        // Redirect after delay
        setTimeout(function () { window.location.href = 'index.html'; }, 2000);
      });
    });
  }

  // --- Button Loading Helper ---
  function showLoading(btn, callback) {
    if (!btn) { callback(); return; }
    btn.classList.add('is-loading');
    setTimeout(function () {
      btn.classList.remove('is-loading');
      callback();
    }, 800);
  }
});

// --- OTP: Boxes, Timer, Resend ---
setTimeout(function () {
  var otpForm = document.getElementById('authOtpForm');
  if (!otpForm) return;
  var boxes = document.querySelectorAll('.auth-otp-input');
  if (!boxes.length) return;
  var timerEl = document.getElementById('authTimerCount');
  var resendBtn = document.getElementById('authResendBtn');
  var seconds = 119;
  var timerInterval = null;

  function moveToNext(idx) {
    if (idx < boxes.length - 1) {
      setTimeout(function () { boxes[idx + 1].focus(); }, 10);
    }
  }
  function moveToPrev(idx) {
    if (idx > 0) {
      setTimeout(function () { boxes[idx - 1].focus(); }, 10);
    }
  }
  function updateFilled(box) {
    if (box.value) box.classList.add('filled');
    else box.classList.remove('filled');
  }

  for (var i = 0; i < boxes.length; i++) {
    (function (idx) {
      var box = boxes[idx];

      box.addEventListener('input', function () {
        box.value = box.value.replace(/[^0-9]/g, '').slice(-1);
        updateFilled(box);
        if (box.value) moveToNext(idx);
      });

      box.addEventListener('keyup', function (e) {
        if (e.key === 'Backspace' && !box.value && idx > 0) {
          boxes[idx - 1].value = '';
          updateFilled(boxes[idx - 1]);
          boxes[idx - 1].focus();
        }
      });

      box.addEventListener('focus', function () {
        box.select();
      });

      box.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
        for (var j = 0; j < Math.min(text.length, boxes.length); j++) {
          boxes[j].value = text[j];
          updateFilled(boxes[j]);
        }
        var last = Math.min(text.length, boxes.length) - 1;
        if (last >= 0) boxes[last].focus();
      });
    })(i);
  }
  // Focus first box on load
  setTimeout(function () { boxes[0].focus(); }, 100);

  // Timer
  function startTimer() {
    seconds = 119;
    resendBtn.disabled = true;
    timerEl.parentElement.style.display = '';
    resendBtn.style.display = 'none';
    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      seconds--;
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      timerEl.textContent = (m < 10 ? '۰' : '') + toFa(m) + ':' + (s < 10 ? '۰' : '') + toFa(s);
      if (seconds <= 0) {
        clearInterval(timerInterval);
        timerEl.parentElement.style.display = 'none';
        resendBtn.style.display = '';
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  function toFa(n) {
    var fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(n).split('').map(function (d) { return fa[parseInt(d)] || d; }).join('');
  }

  if (resendBtn) resendBtn.addEventListener('click', function () {
    startTimer();
  });

  startTimer();

  otpForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = '';
    boxes.forEach(function (b) { code += b.value; });
    if (code.length === boxes.length) {
      window.location.href = 'login-info.html';
    }
  });
}, 200);

// --- Profile: National Code Validation ---
(function () {
  var profileForm = document.getElementById('authProfileForm');
  if (!profileForm) return;
  var nationalInput = document.getElementById('authNationalCode');
  if (nationalInput) {
    nationalInput.addEventListener('input', function () {
      nationalInput.value = nationalInput.value.replace(/[^0-9]/g, '');
    });
  }
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (nationalInput && nationalInput.value.length !== 10) {
      nationalInput.style.borderColor = '#ef4444';
      nationalInput.focus();
      return;
    }
    alert('اطلاعات شما با موفقیت ثبت شد!');
    window.location.href = 'index.html';
  });
})();
