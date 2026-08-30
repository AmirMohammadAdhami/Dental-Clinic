/**
 * Dentura — Doctor Panel: Patient Reviews (نظرات بیماران)
 * خلاصه امتیازات، فهرست نظرات و گزارش تخلف (Flag) به مدیریت کلینیک
 */
(function () {
  'use strict';

  var list = document.getElementById('reviewsList');
  var flagged = {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function starsHtml(n) {
    var out = '';
    for (var i = 1; i <= 5; i++) {
      out += '<svg width="16" height="16" viewBox="0 0 24 24" fill="' + (i <= n ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return '<span class="doc-stars">' + out + '</span>';
  }

  function initial(name) { return name ? name.trim().charAt(0) : '؟'; }

  function renderSummary(db) {
    var rv = db.reviews;
    var count = rv.length || 1;
    var avg = rv.reduce(function (s, r) { return s + r.stars; }, 0) / count;
    var valueEl = document.getElementById('ratingValue');
    var countEl = document.getElementById('ratingCount');
    var starsEl = document.getElementById('ratingStars');
    if (valueEl) valueEl.textContent = toPersianNum(avg.toFixed(1));
    if (countEl) countEl.textContent = 'از مجموع ' + toPersianNum(124) + ' نظر ثبت‌شده پس از مراجعه';
    if (starsEl) starsEl.innerHTML = starsHtml(Math.round(avg));

    // سه معیار: اخلاق پزشک / کیفیت درمان / میزان معطلی
    var metrics = [
      { label: 'اخلاق پزشک', value: 98 },
      { label: 'کیفیت درمان', value: 95 },
      { label: 'میزان معطلی در مطب', value: 87 }
    ];
    var barsEl = document.getElementById('ratingBars');
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

  function renderList(db) {
    if (!list) return;
    list.innerHTML = db.reviews.map(function (r) {
      var isFlagged = flagged[r.id];
      return '<article class="doc-card doc-comment-card" data-id="' + r.id + '">' +
        '  <div class="doc-comment-head">' +
        '    <span class="doc-comment-avatar">' + esc(initial(r.name)) + '</span>' +
        '    <div>' +
        '      <div class="doc-comment-name">' + esc(r.name) + '</div>' +
        '      <div class="doc-comment-meta">تاریخ مراجعه: ' + esc(r.date) + '</div>' +
        '    </div>' +
        '    <span class="doc-review-treatment">' + esc(r.treatment) + '</span>' +
        (isFlagged ? '<span class="doc-badge doc-badge--flagged doc-flag-btn">گزارش ارسال شد</span>' : '') +
        '  </div>' +
        '  <div style="margin:4px 0">' + starsHtml(r.stars) + '</div>' +
        '  <p class="doc-comment-text">' + esc(r.text) + '</p>' +
        (isFlagged ? '' : '  <div><button type="button" class="doc-btn doc-btn--danger doc-btn--sm doc-flag-btn-btn">🚩 گزارش تخلف</button></div>') +
        '</article>';
    }).join('');
  }

  function openFlagModal(name) {
    var modal = document.createElement('div');
    modal.className = 'doc-modal';
    modal.innerHTML =
      '<div class="doc-modal-panel" role="dialog" aria-modal="true">' +
      '  <h2 class="doc-modal-title">گزارش نظر به مدیریت کلینیک</h2>' +
      '  <p class="doc-modal-text">نظر «' + esc(name) + '» به همراه دلیل انتخابی شما برای بررسی مدیریت ارسال می‌شود.</p>' +
      '  <div class="doc-field" style="margin-bottom:16px">' +
      '    <label class="doc-label" for="flagReason">دلیل گزارش</label>' +
      '    <select id="flagReason" class="doc-select">' +
      '      <option>محتوای نامناسب یا توهین‌آمیز</option>' +
      '      <option>نامربوط به تجربه درمان</option>' +
      '      <option>مشکوک به نظر جعلی</option>' +
      '      <option>افشای اطلاعات خصوصی</option>' +
      '    </select>' +
      '  </div>' +
      '  <div class="doc-field" style="margin-bottom:18px">' +
      '    <label class="doc-label" for="flagNote">توضیحات (اختیاری)</label>' +
      '    <textarea id="flagNote" class="doc-textarea" rows="3" placeholder="توضیح کوتاه برای مدیریت..."></textarea>' +
      '  </div>' +
      '  <div class="doc-modal-actions">' +
      '    <button type="button" class="doc-btn doc-btn--danger" data-send>ارسال گزارش</button>' +
      '    <button type="button" class="doc-btn doc-btn--ghost" data-close>انصراف</button>' +
      '  </div>' +
      '</div>';
    function close() {
      modal.classList.remove('is-open');
      setTimeout(function () { modal.remove(); }, 300);
    }
    modal.querySelector('[data-send]').addEventListener('click', function () {
      close();
      docToast('گزارش شما برای مدیریت کلینیک ارسال شد 🚩');
    });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.hasAttribute('data-close')) close();
    });
    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
  }

  var db = DocDB.load();
  renderSummary(db);
  renderList(db);

  if (list) {
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('.doc-flag-btn-btn');
      if (!btn) return;
      var card = e.target.closest('.doc-comment-card');
      var id = parseInt(card.getAttribute('data-id'), 10);
      var r = db.reviews.find(function (x) { return x.id === id; });
      if (!r) return;
      openFlagModal(r.name);
      flagged[id] = true;
      // پس از بستن مودال، بج را نمایش بده
      setTimeout(function () { renderList(db); }, 400);
    });
  }
})();
