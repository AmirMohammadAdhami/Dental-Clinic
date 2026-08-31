/**
 * Dentura — Doctor Panel: Patient Reviews (نظرات بیماران)
 * خلاصه امتیازات، فهرست نظرات — all via API
 */
(function () {
  'use strict';

  var list = document.getElementById('reviewsList');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function starsHtml(n) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (i <= Math.round(n) ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return '<span class="doc-stars">' + out + '</span>';
  }

  function initial(name) { return name ? name.trim().charAt(0) : '؟'; }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    return toPersianNum(d.getFullYear()) + '/' + toPersianNum(String(d.getMonth() + 1).padStart(2, '0')) + '/' + toPersianNum(String(d.getDate()).padStart(2, '0'));
  }

  function renderSummary(summary) {
    var valueEl = document.getElementById('ratingValue');
    var countEl = document.getElementById('ratingCount');
    var starsEl = document.getElementById('ratingStars');
    var barsEl = document.getElementById('ratingBars');

    if (valueEl) valueEl.textContent = toPersianNum(summary.average_rating.toFixed(1));
    if (countEl) countEl.textContent = 'از مجموع ' + toPersianNum(summary.total_reviews) + ' نظر ثبت‌شده پس از مراجعه';
    if (starsEl) starsEl.innerHTML = starsHtml(summary.average_rating);

    // Rating bars
    var metrics = [
      { label: 'اخلاق پزشک', value: Math.round(summary.professionalism_avg / 5 * 100) },
      { label: 'کیفیت درمان', value: Math.round(summary.treatment_quality_avg / 5 * 100) },
      { label: 'ارتباط با بیمار', value: Math.round(summary.communication_avg / 5 * 100) }
    ];
    if (barsEl) {
      barsEl.innerHTML = metrics.map(function (m) {
        return '<div>' +
          '  <div class="doc-rating-bar-head"><span>' + m.label + '</span><span>' + toPersianNum(m.value) + ' از ۱۰۰</span></div>' +
          '  <div class="doc-rating-bar"><div class="doc-rating-fill" data-w="' + m.value + '"></div></div>' +
          '</div>';
      }).join('');
      setTimeout(function () {
        barsEl.querySelectorAll('.doc-rating-fill').forEach(function (f) {
          f.style.width = f.getAttribute('data-w') + '%';
        });
      }, 300);
    }
  }

  function renderList(reviews) {
    if (!list) return;

    if (!reviews.length) {
      list.innerHTML = '<div class="doc-empty">هنوز نظری ثبت نشده است. ⭐️</div>';
      return;
    }

    list.innerHTML = reviews.map(function (r) {
      return '<article class="doc-card doc-comment-card">' +
        '  <div class="doc-comment-head">' +
        '    <span class="doc-comment-avatar">' + esc(initial(r.patient_name)) + '</span>' +
        '    <div>' +
        '      <div class="doc-comment-name">' + esc(r.patient_name) + '</div>' +
        '      <div class="doc-comment-meta">تاریخ مراجعه: ' + formatDate(r.created_at) + '</div>' +
        '    </div>' +
        '    <span class="doc-review-treatment">' + esc(r.service_name) + '</span>' +
        '  </div>' +
        '  <div style="margin:4px 0">' + starsHtml(r.rating) + '</div>' +
        '  <p class="doc-comment-text">' + esc(r.content) + '</p>' +
        '</article>';
    }).join('');
  }

  // ── Load Data ──
  apiFetch('GET', '/doctor-dashboard/reviews/').then(function (data) {
    renderSummary(data.summary || { total_reviews: 0, average_rating: 0, rating_distribution: {}, professionalism_avg: 0, treatment_quality_avg: 0, communication_avg: 0 });
    renderList(data.reviews || []);
  }).catch(function () {
    if (list) list.innerHTML = '<div class="doc-empty">خطا در بارگذاری نظرات</div>';
  });
})();
