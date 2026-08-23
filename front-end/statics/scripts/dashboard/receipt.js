/**
 * Dentura — Appointment Receipt Page Scripts
 */

document.addEventListener('DOMContentLoaded', function () {

  // ================= COPY TRACKING CODE =================
  var copyBtn = document.getElementById('receiptCopyBtn');
  var trackingCode = document.getElementById('receiptTrackingCode');
  var toast = document.getElementById('receiptToast');

  if (copyBtn && trackingCode) {
    copyBtn.addEventListener('click', function () {
      var code = trackingCode.textContent.trim();
      navigator.clipboard.writeText(code).then(function () {
        copyBtn.classList.add('is-copied');
        copyBtn.querySelector('span').textContent = 'کپی شد ✓';
        showToast('کد پیگیری کپی شد');
        setTimeout(function () {
          copyBtn.classList.remove('is-copied');
          copyBtn.querySelector('span').textContent = 'کپی کد';
        }, 2500);
      }).catch(function () {
        // Fallback for older browsers
        var tempInput = document.createElement('input');
        tempInput.value = code;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        copyBtn.classList.add('is-copied');
        copyBtn.querySelector('span').textContent = 'کپی شد ✓';
        showToast('کد پیگیری کپی شد');
        setTimeout(function () {
          copyBtn.classList.remove('is-copied');
          copyBtn.querySelector('span').textContent = 'کپی کد';
        }, 2500);
      });
    });
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2500);
  }

  // ================= HEADER SCROLL EFFECT =================
  var dashHeader = document.querySelector('.dash-header');
  if (dashHeader) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) {
        dashHeader.classList.add('is-scrolled');
      } else {
        dashHeader.classList.remove('is-scrolled');
      }
    });
  }

  // ================= SCROLL REVEAL (Dashboard sections) =================
  var revealSections = document.querySelectorAll('.dash-section');
  if ('IntersectionObserver' in window && revealSections.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          sectionObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealSections.forEach(function (el) { sectionObserver.observe(el); });
  } else {
    revealSections.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ================= NAV APP CLICK TRACKING =================
  var navApps = document.querySelectorAll('.receipt-nav-app');
  navApps.forEach(function (app) {
    app.addEventListener('click', function () {
      var appName = this.getAttribute('data-app');
      if (appName) {
        showToast('در حال باز کردن ' + appName + '...');
      }
    });
  });

});
