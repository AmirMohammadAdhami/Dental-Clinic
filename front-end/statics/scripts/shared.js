/**
 * Dentura — Shared Utilities & Components
 * Loaded on every page. Each section is self-contained.
 */

// ================= PERSIAN NUMBER HELPER =================
function toPersianNum(num) {
  var digits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return String(num).replace(/\d/g, function(d) { return digits[d]; });
}

document.addEventListener('DOMContentLoaded', function () {

  var REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ================= IMAGE SHIMMER REMOVAL =================
  document.querySelectorAll('.tile-photo, .tile-accent-photo, .doctor-img').forEach(function (wrapper) {
    var img = wrapper.querySelector('img');
    if (!img) return;
    function markLoaded() { wrapper.classList.add('img-loaded'); }
    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
    } else {
      img.addEventListener('load', markLoaded);
      img.addEventListener('error', markLoaded);
    }
  });

  // ================= HEADER SCROLL EFFECT =================
  var header = document.querySelector('.header-inner');
  if (header) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    });
  }

  // ================= SCROLL REVEAL (IntersectionObserver) =================
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // ================= BUTTON RIPPLE EFFECT =================
  if (!REDUCED_MOTION) document.querySelectorAll('.btn-primary, .btn-outline').forEach(function (btn) {
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', function (e) {
      var ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      var rect = this.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      this.appendChild(ripple);
      setTimeout(function () { ripple.remove(); }, 600);
    });
  });

});

// ================= HAMBURGER MENU (legacy pages) =================
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

// ================= TOOTH LOGO (تعریف یک‌جا — جلوگیری از تکرار SVG در صفحات) =================
(function () {
  var TOOTH_SVG = '<svg viewBox="0 0 48 48" width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M24 6C18.5 6 14 8.6 11.2 12.4C9.3 15 9 18.3 9.4 21.5C9.8 25 10.8 28.4 11.7 31.8C12.4 34.5 13 37.4 14.6 39.7C15.5 41 17 42 18.6 41.4C20.1 40.8 20.6 39 20.9 37.6C21.4 35 21.4 32.3 21.9 29.7C22.2 28.1 22.9 26.2 24 26.2C25.1 26.2 25.8 28.1 26.1 29.7C26.6 32.3 26.6 35 27.1 37.6C27.4 39 27.9 40.8 29.4 41.4C31 42 32.5 41 33.4 39.7C35 37.4 35.6 34.5 36.3 31.8C37.2 28.4 38.2 25 38.6 21.5C39 18.3 38.7 15 36.8 12.4C34 8.6 29.5 6 24 6Z" fill="currentColor"/>' +
    '</svg>';

  document.addEventListener('DOMContentLoaded', function () {
    // Inject mobile top bar if not already present (front-end static pages)
    if (!document.querySelector('.mobile-top-bar')) {
      var bar = document.createElement('header');
      bar.className = 'mobile-top-bar';
      bar.innerHTML = '<div class="mobile-top-bar-inner"><span class="brand-icon" aria-hidden="true"></span><span class="brand-name">\u062F\u0646\u062A\u0648\u0631\u0627</span></div><div class="mobile-top-bar-neon"></div>';
      document.body.insertBefore(bar, document.body.firstChild);
    }
    document.querySelectorAll('.brand-icon').forEach(function (el) {
      if (!el.querySelector('svg')) el.innerHTML = TOOTH_SVG;
    });
  });
})();

// ================= DARK MODE (تم روشن/تاریک) =================
(function () {
  var root = document.documentElement;
  var STORAGE_KEY = 'dentura-theme';

  // اولویت: انتخاب ذخیره‌شده کاربر > تنظیمات سیستم
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  if (saved === 'dark' || saved === 'light') {
    root.setAttribute('data-theme', saved);
  }

  function currentTheme() {
    var t = root.getAttribute('data-theme');
    if (t === 'dark' || t === 'light') return t;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'تغییر حالت روشن و تاریک');
    btn.title = 'حالت روشن / تاریک';
    btn.innerHTML =
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>' +
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';

    btn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });

    document.body.appendChild(btn);
  });
})();
