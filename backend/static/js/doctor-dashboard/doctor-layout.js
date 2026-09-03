/**
 * Dentura — Doctor Panel: Shared Layout
 * سایدبار موبایل، لینک فعال، مودال خروج، توست و بج دیدگاه‌های در انتظار
 */
(function () {
  'use strict';

  // ================= CSRF TOKEN =================
  function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return '';
  }

  // ================= JWT TOKEN REFRESH =================
  function refreshAccessToken() {
    return fetch('/api/token/refresh/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('Refresh failed');
      return res.json();
    });
  }

  window.API_BASE = '/api';
  window.apiFetch = function (method, url, body, _retry) {
    var opts = {
      method: method,
      headers: {
        'X-CSRFToken': getCookie('csrftoken'),
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    };
    if (body && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }
    return fetch(API_BASE + url, opts).then(function (res) {
      // Auto-refresh on 401 (token expired)
      if (res.status === 401 && !_retry) {
        return refreshAccessToken().then(function () {
          return window.apiFetch(method, url, body, true);
        }).catch(function () {
          window.location.href = '/accounts/login/';
          throw { status: 401, data: { detail: 'بارگذاری انجام نشد' } };
        });
      }
      if (!res.ok) {
        return res.json().then(function (data) {
          throw { status: res.status, data: data };
        }).catch(function (e) {
          if (e.status) throw e;
          throw { status: res.status, data: { detail: 'خطای سرور' } };
        });
      }
      if (res.status === 204) return null;
      return res.json();
    });
  };

  // ================= TOAST =================
  var toastEl = null;
  var toastTimer = null;

  window.docToast = function (msg, type) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'doc-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.className = 'doc-toast is-visible' + (type === 'error' ? ' doc-toast--error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 3400);
  };

  // ================= GENERIC CONFIRM MODAL =================
  window.docConfirm = function (title, text, okLabel, okClass, onOk) {
    var modal = document.createElement('div');
    modal.className = 'doc-modal';
    modal.innerHTML =
      '<div class="doc-modal-panel" role="dialog" aria-modal="true">' +
      '  <h2 class="doc-modal-title"></h2>' +
      '  <p class="doc-modal-text"></p>' +
      '  <div class="doc-modal-actions">' +
      '    <button type="button" class="doc-btn ' + okClass + '"></button>' +
      '    <button type="button" class="doc-btn doc-btn--ghost" data-close>انصراف</button>' +
      '  </div>' +
      '</div>';
    modal.querySelector('.doc-modal-title').textContent = title;
    modal.querySelector('.doc-modal-text').textContent = text;
    var okBtn = modal.querySelector('.doc-btn:not(.doc-btn--ghost)');
    okBtn.textContent = okLabel || 'تأیید';

    function close() {
      modal.classList.remove('is-open');
      setTimeout(function () { modal.remove(); }, 300);
    }

    okBtn.addEventListener('click', function () { close(); if (onOk) onOk(); });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.hasAttribute('data-close')) close();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
    return modal;
  };

  // ================= SIDEBAR (MOBILE DRAWER) =================
  var sidebar = document.getElementById('docSidebar');
  var overlay = document.getElementById('docOverlay');
  var burger = document.getElementById('docHamburger');

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (sidebar && overlay && burger) {
    burger.addEventListener('click', function () {
      var open = sidebar.classList.toggle('is-open');
      overlay.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSidebar();
    });
    sidebar.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeSidebar);
    });
  }

  // ================= LOAD PROFILE INFO =================
  var sideName = document.getElementById('docSideName');
  var sideRole = document.getElementById('docSideRole');
  var sideAvatar = document.getElementById('docSideAvatar');

  apiFetch('GET', '/doctor-dashboard/profile/').then(function (data) {
    if (sideName) sideName.textContent = data.full_name || '—';
    if (sideRole) sideRole.textContent = data.speciality || '—';
    if (sideAvatar && data.doctor_photos && data.doctor_photos.profile_photo) {
      sideAvatar.innerHTML = '<img src="' + data.doctor_photos.profile_photo + '" alt="' + (data.full_name || '') + '">';
    }
  }).catch(function () { /* silently fail */ });

  // ================= PENDING COMMENTS BADGE =================
  var badge = document.getElementById('docPendingBadge');
  if (badge) {
    apiFetch('GET', '/doctor-dashboard/comments/').then(function (data) {
      var comments = Array.isArray(data) ? data : [];
      var pending = comments.filter(function (c) { return c.status === 'PENDING'; }).length;
      badge.textContent = toPersianNum(pending);
      badge.style.display = pending > 0 ? '' : 'none';
    }).catch(function () {
      badge.style.display = 'none';
    });
  }

  // ================= LOGOUT CONFIRM =================
  var logoutLink = document.getElementById('docLogout');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      docConfirm('خروج از حساب کاربری', 'آیا مطمئن هستید که می‌خواهید از پنل پزشک خارج شوید؟', 'بله، خارج می‌شوم', 'doc-btn--danger', function () {
        window.location.href = logoutLink.getAttribute('href');
      });
    });
  }
})();
