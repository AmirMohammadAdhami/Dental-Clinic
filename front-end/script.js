// ===========================================================
// Dentura — Hero interactions
// ===========================================================

document.addEventListener('DOMContentLoaded', () => {

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

  // --- اسلایدر دکترها ---
  const track = document.querySelector('.doctors-track');
  const cards = document.querySelectorAll('.doctor-card');
  const prevBtn = document.querySelector('.slider-arrow-left');
  const nextBtn = document.querySelector('.slider-arrow-right');

  if (track && cards.length && prevBtn && nextBtn) {
    let currentIndex = 0;

    function getVisibleCount() {
      const w = window.innerWidth;
      if (w <= 620) return 1;
      if (w <= 900) return 2;
      return 3;
    }

    function getMaxIndex() {
      const visible = getVisibleCount();
      return Math.max(0, cards.length - visible);
    }

    function updateArrows() {
      if (currentIndex <= 0) {
        prevBtn.disabled = true;
        prevBtn.classList.add('disabled');
      } else {
        prevBtn.disabled = false;
        prevBtn.classList.remove('disabled');
      }
      if (currentIndex >= getMaxIndex()) {
        nextBtn.disabled = true;
        nextBtn.classList.add('disabled');
      } else {
        nextBtn.disabled = false;
        nextBtn.classList.remove('disabled');
      }
    }

    function slide() {
      const visible = getVisibleCount();
      const cardWidth = 100 / visible;
      // direction: ltr → translateX منفی = حریک به راست (جلو)
      track.style.transform = `translateX(-${currentIndex * cardWidth}%)`;
      updateArrows();
    }

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        slide();
      }
    });

    nextBtn.addEventListener('click', () => {
      if (currentIndex < getMaxIndex()) {
        currentIndex++;
        slide();
      }
    });

    window.addEventListener('resize', () => {
      if (currentIndex > getMaxIndex()) {
        currentIndex = getMaxIndex();
      }
      slide();
    });

    // نمایش اولیه
    slide();
  }

  // --- افکت اسکرول روی هدر (کوچک‌تر شدن هنگام اسکرول) ---
  const header = document.querySelector('.header-inner');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 20) {
      header.style.boxShadow = '0 10px 34px -12px rgba(15, 23, 42, 0.22)';
    } else {
      header.style.boxShadow = '0 8px 30px -12px rgba(15, 23, 42, 0.12)';
    }

    lastScroll = currentScroll;
  });

});
