/**
 * Dentura — Appointment Receipt Page Scripts
 */

document.addEventListener('DOMContentLoaded', function () {

  // ================= HELPERS =================
  function toFa(num) {
    var persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(num).replace(/\d/g, function (d) { return persianDigits[parseInt(d)]; });
  }

  /* Accurate Gregorian → Jalali (jalaali algorithm) */
  var _div = function (a, b) { return ~~(a / b); };
  var _mod = function (a, b) { return a - ~~(a / b) * b; };

  function _jalCal(jy) {
    var breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
        1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
    var bl = breaks.length, gy = jy + 621, leapJ = -14, jp = breaks[0], jm, jump = 0, leap, n, i;
    for (i = 1; i < bl; i += 1) {
        jm = breaks[i];
        jump = jm - jp;
        if (jy < jm) break;
        leapJ = leapJ + _div(jump, 33) * 8 + _div(_mod(jump, 33), 4);
        jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + _div(n, 33) * 8 + _div(_mod(n, 33) + 3, 4);
    if (_mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    var leapG = _div(gy, 4) - _div((_div(gy, 100) + 1) * 3, 4) - 150;
    var march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + _div(jump + 4, 33) * 33;
    leap = _mod(_mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap: leap, gy: gy, march: march };
  }

  function _g2d(gy, gm, gd) {
    var d = _div((gy + _div(gm - 8, 6) + 100100) * 1461, 4)
        + _div(153 * _mod(gm + 9, 12) + 2, 5)
        + gd - 34840408;
    d = d - _div(_div(gy + 100100 + _div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }

  function _d2g(jdn) {
    var j, i, gd, gm, gy;
    j = 4 * jdn + 139361631;
    j = j + _div(_div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    i = _div(_mod(j, 1461), 4) * 5 + 308;
    gd = _div(_mod(i, 153), 5) + 1;
    gm = _mod(_div(i, 153), 12) + 1;
    gy = _div(j, 1461) - 100100 + _div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }

  function _toJalali(date) {
    var gy = date.getFullYear(), gm = date.getMonth() + 1, gd = date.getDate();
    var jdn = _g2d(gy, gm, gd);
    var gy2 = _d2g(jdn).gy;
    var jy = gy2 - 621;
    var r = _jalCal(jy);
    var jdn1f = _g2d(gy2, 3, r.march);
    var k = jdn - jdn1f, jm, jd;
    if (k >= 0) {
        if (k <= 185) {
            jm = 1 + _div(k, 31);
            jd = _mod(k, 31) + 1;
            return { year: jy, month: jm, day: jd };
        }
        k -= 186;
    } else {
        jy -= 1;
        k += 179;
        if (r.leap === 1) k += 1;
    }
    jm = 7 + _div(k, 30);
    jd = _mod(k, 30) + 1;
    return { year: jy, month: jm, day: jd };
  }

  var JALALI_MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

  function jalaliLabel(date) {
    var pe = _toJalali(date);
    var day = toFa(pe.day);
    var month = JALALI_MONTHS[pe.month - 1];
    var h = String(date.getHours()).padStart(2, '0');
    var m = String(date.getMinutes()).padStart(2, '0');
    return day + ' ' + month + ' — ساعت ' + toFa(h + ':' + m);
  }

  function formatPrice(num) {
    return toFa(Number(num).toLocaleString('en-US')) + ' تومان';
  }

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

  // ================= FETCH APPOINTMENT DATA =================
  // Extract tracking_code from the URL: /dashboard/appointment/<tracking_code>/
  var pathParts = window.location.pathname.split('/').filter(Boolean);
  var trackingCodeFromUrl = pathParts[pathParts.length - 1] || '';

  if (trackingCodeFromUrl) {
    fetch('/api/appointments/' + encodeURIComponent(trackingCodeFromUrl) + '/', {
      credentials: 'same-origin'
    })
      .then(function (r) {
        if (!r.ok) throw new Error(r.status);
        return r.json();
      })
      .then(function (data) {
        // Tracking code
        if (trackingCode && data.tracking_code) {
          trackingCode.textContent = data.tracking_code;
        }

        // Doctor name
        var doctorEl = document.getElementById('receiptDoctorName');
        if (doctorEl && data.doctor) {
          doctorEl.textContent = 'دکتر ' + (data.doctor.name || '');
        }

        // Service name
        var serviceEl = document.getElementById('receiptServiceName');
        if (serviceEl && data.service) {
          serviceEl.textContent = data.service;
        }

        // Date and time
        var dateEl = document.getElementById('receiptDateTime');
        if (dateEl && data.appointment_date) {
          try {
            dateEl.textContent = jalaliLabel(new Date(data.appointment_date));
          } catch (e) {
            dateEl.textContent = data.appointment_date;
          }
        }

        // Price
        var priceEl = document.getElementById('receiptPrice');
        if (priceEl && data.price) {
          priceEl.textContent = formatPrice(data.price);
        }

        // Prescription text (replaces the old PDF link)
        var prescriptionSection = document.getElementById('receiptPrescription');
        var prescriptionText = document.getElementById('receiptPrescriptionText');
        if (prescriptionSection && prescriptionText) {
          if (data.prescription_text && data.prescription_text.trim()) {
            prescriptionText.textContent = data.prescription_text;
            prescriptionSection.style.display = '';
          }
        }
      })
      .catch(function (err) {
        console.error('Failed to load appointment:', err);
      });
  }

});
