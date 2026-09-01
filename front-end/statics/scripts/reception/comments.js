/**
 * Dentora — پنل پذیرش: صفحه مدیریت کامنت‌ها
 */
(function () {
  'use strict';

  var comments = ReceptionData.comments;
  var list = document.getElementById('commentsList');

  function render(filter) {
    var data = filter === 'all' ? comments : comments.filter(function (c) { return c.status === filter; });
    list.innerHTML = data.map(function (c) {
      var statusBadge = c.status === 'approved'
        ? '<span class="rc-st rc-st--green">تایید شده</span>'
        : '<span class="rc-st rc-st--orange">در انتظار</span>';

      var actions = '';
      if (c.status === 'pending') {
        actions = '<div class="rc-comment-actions">' +
          '<button class="rc-btn rc-btn--success rc-btn--sm" onclick="approveComment(' + c.id + ')">✅ تایید انتشار</button>' +
          '<button class="rc-btn rc-btn--danger rc-btn--sm" onclick="deleteComment(' + c.id + ')">🗑️ حذف کامنت</button>' +
        '</div>';
      } else {
        actions = '<div class="rc-comment-actions"><button class="rc-btn rc-btn--danger rc-btn--sm" onclick="deleteComment(' + c.id + ')">🗑️ حذف</button></div>';
      }

      return '<div class="rc-comment-card" id="comment-' + c.id + '">' +
        '<div class="rc-comment-head">' +
          '<span class="rc-comment-user">' + c.user + ' — ' + statusBadge + '</span>' +
          '<span class="rc-comment-date">' + c.date + '</span>' +
        '</div>' +
        '<div class="rc-comment-article">📄 ' + c.article + '</div>' +
        '<div class="rc-comment-text">' + c.text + '</div>' +
        actions +
      '</div>';
    }).join('');

    if (!data.length) {
      list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-faint)">کامنتی یافت نشد</div>';
    }
  }

  render('all');

  document.querySelectorAll('.rc-pill[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.rc-pill[data-filter]').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      render(btn.dataset.filter);
    });
  });

  window.approveComment = function (id) {
    var c = comments.find(function (x) { return x.id === id; });
    if (c) { c.status = 'approved'; render('all'); }
  };

  window.deleteComment = function (id) {
    if (confirm('آیا از حذف این کامنت مطمئن هستید؟')) {
      comments = comments.filter(function (x) { return x.id !== id; });
      render('all');
    }
  };

})();
