/**
 * Dentura — Doctor Panel: Comments (مدیریت دیدگاه‌ها)
 * لیست دیدگاه‌ها با بج وضعیت، فیلتر و باکس پاسخ inline با بج «پاسخ دندانپزشک»
 */
(function () {
  'use strict';

  var list = document.getElementById('commentsList');
  var currentFilter = 'all';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initial(name) {
    return name ? name.trim().charAt(0) : '؟';
  }

  function render() {
    if (!list) return;
    var db = DocDB.load();
    var items = db.comments;
    if (currentFilter !== 'all') {
      items = items.filter(function (c) { return c.status === currentFilter; });
    }

    var pending = db.comments.filter(function (c) { return c.status === 'pending'; }).length;
    var pendingLabel = document.getElementById('pendingCountLabel');
    if (pendingLabel) pendingLabel.textContent = toPersianNum(pending) + ' دیدگاه در انتظار پاسخ شماست';

    if (!items.length) {
      list.innerHTML = '<div class="doc-empty">دیدگاهی در این وضعیت وجود ندارد. 💬</div>';
      return;
    }

    list.innerHTML = items.map(function (c) {
      var badge = c.status === 'answered'
        ? '<span class="doc-badge doc-badge--answered"><span class="doc-badge-dot"></span>پاسخ داده‌شده</span>'
        : '<span class="doc-badge doc-badge--pending"><span class="doc-badge-dot"></span>در انتظار پاسخ</span>';

      var replyBlock = '';
      if (c.reply) {
        replyBlock = '<div class="doc-comment-reply">' +
          '  <div class="doc-comment-reply-head">' +
          '    <span class="doc-badge doc-badge--doctor">پاسخ دندانپزشک</span>' +
          '  </div>' + esc(c.reply) + '</div>';
      }

      return '<article class="doc-card doc-comment-card" data-id="' + c.id + '">' +
        '  <div class="doc-comment-head">' +
        '    <span class="doc-comment-avatar">' + esc(initial(c.name)) + '</span>' +
        '    <div>' +
        '      <div class="doc-comment-name">' + esc(c.name) + '</div>' +
        '      <div class="doc-comment-meta">' + esc(c.date) + '</div>' +
        '    </div>' +
        '    <a class="doc-comment-article" href="articles.html" title="زیر این مقاله ثبت شده">📄 ' + esc(c.article) + '</a>' +
        '    ' + badge +
        '  </div>' +
        '  <p class="doc-comment-text">' + esc(c.text) + '</p>' +
        replyBlock +
        '  <div class="doc-replybox" id="reply-' + c.id + '">' +
        '    <textarea class="doc-textarea doc-reply-input" rows="3" placeholder="پاسخ خود را بنویسید... (پاسخ شما با بج «پاسخ دندانپزشک» در سایت نمایش داده می‌شود)"></textarea>' +
        '    <div class="doc-editor-actions">' +
        '      <button type="button" class="doc-btn doc-btn--primary doc-btn--sm" data-action="send">ارسال پاسخ</button>' +
        '      <button type="button" class="doc-btn doc-btn--ghost doc-btn--sm" data-action="cancel">انصراف</button>' +
        '    </div>' +
        '  </div>' +
        (c.reply ? '' : '  <div><button type="button" class="doc-btn doc-btn--ghost doc-btn--sm" data-action="reply">پاسخ</button></div>') +
        '</article>';
    }).join('');
  }

  if (list) {
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-action]');
      if (!btn) return;
      var card = e.target.closest('.doc-comment-card');
      var id = parseInt(card.getAttribute('data-id'), 10);
      var box = document.getElementById('reply-' + id);
      var action = btn.getAttribute('data-action');

      if (action === 'reply') {
        if (box) {
          box.classList.add('is-open');
          var ta = box.querySelector('.doc-reply-input');
          if (ta) ta.focus();
          btn.style.display = 'none';
        }
      } else if (action === 'cancel') {
        if (box) box.classList.remove('is-open');
        var replyBtn = card.querySelector('[data-action="reply"]');
        if (replyBtn) replyBtn.style.display = '';
      } else if (action === 'send') {
        var input = box ? box.querySelector('.doc-reply-input') : null;
        var text = input ? input.value.trim() : '';
        if (!text) {
          docToast('متن پاسخ خالی است', 'error');
          if (input) input.focus();
          return;
        }
        var db = DocDB.load();
        var c = db.comments.find(function (x) { return x.id === id; });
        if (c) {
          c.reply = text;
          c.status = 'answered';
          DocDB.save(db);
          render();
          docToast('پاسخ شما ثبت شد و با بج «پاسخ دندانپزشک» نمایش داده می‌شود ✅');
        }
      }
    });
  }

  document.querySelectorAll('#commentFilters .doc-pill').forEach(function (pill) {
    pill.addEventListener('click', function () {
      document.querySelectorAll('#commentFilters .doc-pill').forEach(function (p) { p.classList.remove('is-active'); });
      pill.classList.add('is-active');
      currentFilter = pill.getAttribute('data-filter');
      render();
    });
  });

  render();
})();
