/**
 * Dentura — Doctor Panel: Comments (مدیریت دیدگاه‌ها)
 * لیست دیدگاه‌ها با فیلتر و پاسخ inline — all via API
 */
(function () {
  'use strict';

  var list = document.getElementById('commentsList');
  var currentFilter = 'all';
  var allComments = [];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initial(name) {
    return name ? name.trim().charAt(0) : '؟';
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    var d = new Date(isoStr);
    return toPersianNum(d.getFullYear()) + '/' + toPersianNum(String(d.getMonth() + 1).padStart(2, '0')) + '/' + toPersianNum(String(d.getDate()).padStart(2, '0'));
  }

  function render() {
    if (!list) return;
    var items = allComments;
    if (currentFilter === 'pending') {
      items = items.filter(function (c) { return c.status === 'PENDING'; });
    }

    var pendingCount = allComments.filter(function (c) { return c.status === 'PENDING'; }).length;
    var pendingLabel = document.getElementById('pendingCountLabel');
    if (pendingLabel) pendingLabel.textContent = toPersianNum(pendingCount) + ' دیدگاه در انتظار پاسخ شماست';

    if (!items.length) {
      list.innerHTML = '<div class="doc-empty">دیدگاهی در این وضعیت وجود ندارد. 💬</div>';
      return;
    }

    list.innerHTML = items.map(function (c) {
      var hasReply = c.replies && c.replies.length > 0;

      // Badge: green for answered, orange for pending
      var badgeHtml = hasReply
        ? '<span class="doc-badge doc-badge--answered"><span class="doc-badge-dot"></span>پاسخ داده‌شده</span>'
        : '<span class="doc-badge doc-badge--pending"><span class="doc-badge-dot"></span>در انتظار پاسخ</span>';

      // Doctor reply block with special styling
      var replyBlock = '';
      if (hasReply) {
        var reply = c.replies[0];
        var doctorName = reply.user_name || 'دندانپزشک';
        var replyDate = formatDate(reply.created_at);
        replyBlock =
          '<div class="doc-comment-reply-block">' +
          '  <div class="doc-comment-reply-header">' +
          '    <div class="doc-comment-reply-avatar">🦷</div>' +
          '    <div class="doc-comment-reply-info">' +
          '      <span class="doc-comment-reply-name">' + esc(doctorName) + '</span>' +
          '      <span class="doc-comment-reply-date">' + replyDate + '</span>' +
          '    </div>' +
          '    <span class="doc-badge doc-badge--doctor">پاسخ دندانپزشک</span>' +
          '  </div>' +
          '  <p class="doc-comment-reply-text">' + esc(reply.content) + '</p>' +
          '</div>';
      }

      // Reply form is only shown when comment has no reply yet
      var replyForm = hasReply ? '' :
        '<div class="doc-replybox" id="reply-' + c.id + '">' +
        '  <textarea class="doc-textarea doc-reply-input" rows="3" placeholder="پاسخ خود را بنویسید..."></textarea>' +
        '  <div class="doc-editor-actions">' +
        '    <button type="button" class="doc-btn doc-btn--primary doc-btn--sm" data-action="send">ارسال پاسخ</button>' +
        '    <button type="button" class="doc-btn doc-btn--ghost doc-btn--sm" data-action="cancel">انصراف</button>' +
        '  </div>' +
        '</div>';

      // Reply button only shown when no reply yet
      var replyBtn = hasReply ? '' :
        '<div><button type="button" class="doc-btn doc-btn--ghost doc-btn--sm" data-action="reply">پاسخ</button></div>';

      return '<article class="doc-card doc-comment-card doc-comment-card--' + (hasReply ? 'replied' : 'pending') + '" data-id="' + c.id + '">' +
        '  <div class="doc-comment-head">' +
        '    <span class="doc-comment-avatar">' + esc(initial(c.user_name)) + '</span>' +
        '    <div>' +
        '      <div class="doc-comment-name">' + esc(c.user_name) + '</div>' +
        '      <div class="doc-comment-meta">' + formatDate(c.created_at) + '</div>' +
        '    </div>' +
        '    <a class="doc-comment-article" href="/doctors/dashboard/articles/" title="زیر این مقاله ثبت شده">📄 ' + esc(c.article_title) + '</a>' +
        '    ' + badgeHtml +
        '  </div>' +
        '  <p class="doc-comment-text">' + esc(c.content) + '</p>' +
        replyBlock +
        replyForm +
        replyBtn +
        '</article>';
    }).join('');
  }

  // ── Events ──
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
        apiFetch('POST', '/doctor-dashboard/comments/' + id + '/reply/', {
          content: text
        }).then(function () {
          return apiFetch('GET', '/doctor-dashboard/comments/');
        }).then(function (data) {
          allComments = data || [];
          render();
          docToast('پاسخ شما ثبت شد ✅');
        }).catch(function () {
          docToast('خطا در ارسال پاسخ', 'error');
        });
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

  // ── Load Data ──
  apiFetch('GET', '/doctor-dashboard/comments/').then(function (data) {
    allComments = data || [];
    render();
  }).catch(function () {
    list.innerHTML = '<div class="doc-empty">خطا در بارگذاری دیدگاه‌ها</div>';
  });
})();
