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
