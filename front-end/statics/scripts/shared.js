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
  document.querySelectorAll('.btn-primary, .btn-outline').forEach(function (btn) {
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
