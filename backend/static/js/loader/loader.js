// ===== منطق نمایش/مخفی‌کردن لودینگ دنتورا =====
// این فایل رو قبل از بسته‌شدن تگ </body> با <script src="loader.js"></script> صدا بزن

(function () {
  var loader = document.getElementById('dentora-loader');
  if (!loader) return;

  // وقتی صفحه کامل لود شد، لودینگ رو محو کن
  function hideLoader() {
    loader.classList.add('loader-hidden');
  }

  window.addEventListener('load', hideLoader);

  // اگه سایت وردپرسیه و صفحات با لینک معمولی (a href) عوض می‌شن،
  // موقع کلیک روی لینک‌های داخلی، دوباره لودینگ رو نشون بده
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a');
    if (!link) return;

    var isInternal = link.hostname === window.location.hostname;
    var isNewTab = link.target === '_blank';
    var isAnchor = link.getAttribute('href') && link.getAttribute('href').startsWith('#');

    if (isInternal && !isNewTab && !isAnchor) {
      loader.classList.remove('loader-hidden');
    }
  });

  // اگه کاربر با دکمه back/forward مرورگر برگرده، لودینگ رو دوباره نشون بده
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      loader.classList.remove('loader-hidden');
      window.addEventListener('load', hideLoader);
    }
  });
})();
