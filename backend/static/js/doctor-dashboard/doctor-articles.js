/**
 * Dentura — Doctor Panel: Articles List (مدیریت مقالات)
 * رندر گرید مقالات، فیلتر وضعیت، پیش‌نمایش و حذف — all via API
 */
(function () {
  'use strict';

  var STATUS_META = {
    true: { text: 'منتشرشده', cls: 'doc-badge--published' },
    false: { text: 'پیش‌نویس', cls: 'doc-badge--draft' }
  };

  var grid = document.getElementById('articlesGrid');
  var countEl = document.getElementById('articlesCount');
  var currentFilter = 'all';
  var allArticles = [];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function badge(isPublished) {
    var m = STATUS_META[isPublished] || STATUS_META[false];
    return '<span class="doc-badge ' + m.cls + '"><span class="doc-badge-dot"></span>' + m.text + '</span>';
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    return toPersianNum(d.getFullYear()) + '/' + toPersianNum(String(d.getMonth() + 1).padStart(2, '0')) + '/' + toPersianNum(String(d.getDate()).padStart(2, '0'));
  }

  function render() {
    if (!grid) return;
    var items = allArticles;
    if (currentFilter === 'published') {
      items = items.filter(function (a) { return a.is_published; });
    } else if (currentFilter === 'draft') {
      items = items.filter(function (a) { return !a.is_published; });
    }

    if (countEl) {
      countEl.textContent = toPersianNum(allArticles.length) + ' مقاله ثبت شده است';
    }

    if (!items.length) {
      grid.innerHTML = '<div class="doc-empty">هنوز مقاله‌ای در این وضعیت ثبت نشده است. 📝</div>';
      return;
    }

    grid.innerHTML = items.map(function (a) {
      var cover = '';
      if (a.files && a.files.length) {
        for (var i = 0; i < a.files.length; i++) {
          if (a.files[i].media_type === 'IMAGE' && a.files[i].file) { cover = a.files[i].file; break; }
        }
      }
      if (!cover) cover = '/static/images/blog-icons/default-article.jpg';
      return '<article class="doc-article-card" data-id="' + a.id + '">' +
        '  <div class="doc-article-cover">' +
        '    <img src="' + esc(cover) + '" alt="تصویر شاخص ' + esc(a.title) + '">' +
        '    ' + badge(a.is_published) +
        '  </div>' +
        '  <div class="doc-article-body">' +
        '    <span class="doc-article-cat">' + esc(a.service_name || 'بدون دسته') + '</span>' +
        '    <h3 class="doc-article-title">' + esc(a.title) + '</h3>' +
        '    <div class="doc-article-meta"><span>' + formatDate(a.created_at) + '</span>' +
        '    <span>' + (a.is_published ? toPersianNum(a.view_count || 0) + ' بازدید' : 'پیش‌نویس') + '</span></div>' +
        '  </div>' +
        '  <div class="doc-article-actions">' +
        '    <a class="doc-btn doc-btn--ghost doc-btn--sm" href="/doctor-dashboard/article-editor/?id=' + a.id + '">ویرایش</a>' +
        '    <button type="button" class="doc-btn doc-btn--ghost doc-btn--sm" data-action="preview">پیش‌نمایش</button>' +
        '    <button type="button" class="doc-btn doc-btn--danger doc-btn--sm" data-action="delete">حذف</button>' +
        '  </div>' +
        '</article>';
    }).join('');
  }

  // ── Preview Modal ──
  function openPreview(article) {
    var modal = document.createElement('div');
    modal.className = 'doc-modal';
    modal.innerHTML =
      '<div class="doc-modal-panel" role="dialog" aria-modal="true">' +
      '  <span class="doc-article-cat">' + esc(article.service_name || '') + '</span>' +
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

  // ── Events ──
  if (grid) {
    grid.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var card = e.target.closest('.doc-article-card');
      var id = parseInt(card.getAttribute('data-id'), 10);
      var article = allArticles.find(function (a) { return a.id === id; });
      if (!article) return;

      if (btn.getAttribute('data-action') === 'preview') {
        openPreview(article);
      } else if (btn.getAttribute('data-action') === 'delete') {
        docConfirm('حذف مقاله', 'مقاله «' + article.title + '» برای همیشه حذف می‌شود. مطمئن هستید؟', 'بله، حذف کن', 'doc-btn--danger', function () {
          apiFetch('DELETE', '/doctor-dashboard/articles/' + id + '/').then(function () {
            allArticles = allArticles.filter(function (a) { return a.id !== id; });
            render();
            docToast('مقاله با موفقیت حذف شد');
          }).catch(function () {
            docToast('خطا در حذف مقاله', 'error');
          });
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

  // ── Load Data ──
  apiFetch('GET', '/doctor-dashboard/articles/').then(function (data) {
    allArticles = data || [];
    render();
  }).catch(function () {
    grid.innerHTML = '<div class="doc-empty">خطا در بارگذاری مقالات</div>';
  });
})();
