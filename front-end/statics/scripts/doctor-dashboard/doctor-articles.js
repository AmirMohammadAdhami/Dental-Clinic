/**
 * Dentura — Doctor Panel: Articles List (مدیریت مقالات)
 * رندر گرید مقالات، فیلتر وضعیت، پیش‌نمایش و حذف با مودال
 */
(function () {
  'use strict';

  var STATUS_META = {
    'published': { text: 'منتشرشده', cls: 'doc-badge--published' },
    'draft': { text: 'پیش‌نویس', cls: 'doc-badge--draft' },
    'needs-edit': { text: 'نیاز به ویرایش', cls: 'doc-badge--needs-edit' }
  };

  var grid = document.getElementById('articlesGrid');
  var countEl = document.getElementById('articlesCount');
  var currentFilter = 'all';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function badge(status) {
    var m = STATUS_META[status] || STATUS_META['draft'];
    return '<span class="doc-badge ' + m.cls + '"><span class="doc-badge-dot"></span>' + m.text + '</span>';
  }

  function render() {
    if (!grid) return;
    var db = DocDB.load();
    var items = db.articles;
    if (currentFilter !== 'all') {
      items = items.filter(function (a) { return a.status === currentFilter; });
    }

    if (countEl) {
      countEl.textContent = toPersianNum(db.articles.length) + ' مقاله ثبت شده است';
    }

    if (!items.length) {
      grid.innerHTML = '<div class="doc-empty">هنوز مقاله‌ای در این وضعیت ثبت نشده است. 📝</div>';
      return;
    }

    grid.innerHTML = items.map(function (a) {
      var meta = STATUS_META[a.status] || STATUS_META['draft'];
      return '<article class="doc-article-card" data-id="' + a.id + '">' +
        '  <div class="doc-article-cover">' +
        '    <img src="' + esc(a.cover || '../../assets/hero/clinic-detail.jpg') + '" alt="تصویر شاخص ' + esc(a.title) + '">' +
        '    ' + badge(a.status) +
        '  </div>' +
        '  <div class="doc-article-body">' +
        '    <span class="doc-article-cat">' + esc(a.category || 'بدون دسته') + '</span>' +
        '    <h3 class="doc-article-title">' + esc(a.title) + '</h3>' +
        '    <div class="doc-article-meta"><span>' + esc(a.date || '') + '</span>' +
        '    <span>' + (a.status === 'published' ? toPersianNum(a.views || 0) + ' بازدید' : meta.text) + '</span></div>' +
        '  </div>' +
        '  <div class="doc-article-actions">' +
        '    <a class="doc-btn doc-btn--ghost doc-btn--sm" href="article-editor.html?id=' + a.id + '">ویرایش</a>' +
        '    <button type="button" class="doc-btn doc-btn--ghost doc-btn--sm" data-action="preview">پیش‌نمایش</button>' +
        '    <button type="button" class="doc-btn doc-btn--danger doc-btn--sm" data-action="delete">حذف</button>' +
        '  </div>' +
        '</article>';
    }).join('');
  }

  // ================= PREVIEW MODAL =================
  function openPreview(article) {
    var modal = document.createElement('div');
    modal.className = 'doc-modal';
    modal.innerHTML =
      '<div class="doc-modal-panel" role="dialog" aria-modal="true">' +
      '  <img class="doc-cover-preview" src="' + esc(article.cover || '') + '" alt="" style="margin-bottom:16px">' +
      '  <span class="doc-article-cat">' + esc(article.category || '') + '</span>' +
      '  <h2 class="doc-modal-title" style="margin-top:4px"></h2>' +
      '  <div class="doc-modal-text" style="line-height:2.1">' + (article.content || '<p>بدون محتوا</p>') + '</div>' +
      '  <div class="doc-modal-actions"><button type="button" class="doc-btn doc-btn--ghost" data-close>بستن</button></div>' +
      '</div>';
    modal.querySelector('.doc-modal-title').textContent = article.title;
    function close() {
      modal.classList.remove('is-open');
      setTimeout(function () { modal.remove(); }, 300);
    }
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.hasAttribute('data-close')) close();
    });
    document.addEventListener('keydown', function escKey(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escKey); }
    });
    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
  }

  // ================= EVENTS =================
  if (grid) {
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var card = e.target.closest('.doc-article-card');
      var id = parseInt(card.getAttribute('data-id'), 10);
      var db = DocDB.load();
      var article = db.articles.find(function (a) { return a.id === id; });
      if (!article) return;

      if (btn.getAttribute('data-action') === 'preview') {
        openPreview(article);
      } else if (btn.getAttribute('data-action') === 'delete') {
        docConfirm('حذف مقاله', 'مقاله «' + article.title + '» برای همیشه حذف می‌شود. مطمئن هستید؟', 'بله، حذف کن', 'doc-btn--danger', function () {
          var fresh = DocDB.load();
          fresh.articles = fresh.articles.filter(function (a) { return a.id !== id; });
          DocDB.save(fresh);
          render();
          docToast('مقاله با موفقیت حذف شد');
        });
      }
    });
  }

  document.querySelectorAll('#articleFilters .doc-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      document.querySelectorAll('#articleFilters .doc-pill').forEach(function (p) { p.classList.remove('is-active'); });
      pill.classList.add('is-active');
      currentFilter = pill.getAttribute('data-filter');
      render();
    });
  });

  render();
})();
