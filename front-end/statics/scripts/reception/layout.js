/**
 * Dentora — پنل پذیرش: رفتار مشترک (سایدبار، جستجو، میانبرها)
 */
(function () {
  'use strict';

  // ================= SIDEBAR (MOBILE DRAWER) =================
  var sidebar = document.getElementById('rcSidebar');
  var overlay = document.getElementById('rcOverlay');
  var burger = document.getElementById('rcHamburger');

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

  // ================= GLOBAL SEARCH (Ctrl+K) =================
  var searchOverlay = document.getElementById('rcSearchOverlay');
  var searchInput = document.getElementById('rcSearchInput');
  var searchResults = document.getElementById('rcSearchResults');

  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add('is-open');
    searchInput.value = '';
    searchResults.innerHTML = '';
    setTimeout(function () { searchInput.focus(); }, 100);
  }

  function closeSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.remove('is-open');
  }

  if (searchOverlay) {
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape') closeSearch();
    });

    searchOverlay.addEventListener('click', function (e) {
      if (e.target === searchOverlay) closeSearch();
    });

    if (searchInput) {
      searchInput.addEventListener('input', function () {
        var q = searchInput.value.trim().toLowerCase();
        if (q.length < 2) { searchResults.innerHTML = ''; return; }
        var patients = ReceptionData.patients || [];
        var matches = patients.filter(function (p) {
          return (p.firstName + ' ' + p.lastName).toLowerCase().indexOf(q) !== -1 ||
                 p.nationalId.indexOf(q) !== -1 ||
                 p.phone.indexOf(q) !== -1;
        });
        searchResults.innerHTML = matches.length
          ? matches.map(function (p) {
              return '<a href="#" class="rc-search-item" data-patient-id="' + p.id + '">' +
                '<strong>' + p.firstName + ' ' + p.lastName + '</strong>' +
                '<span>' + p.phone + ' — کدملی: ' + p.nationalId + '</span></a>';
            }).join('')
          : '<div class="rc-search-empty">نتیجه‌ای یافت نشد</div>';
      });
    }
  }

  // ================= FULLSCREEN =================
  var fsBtn = document.getElementById('rcFullscreen');
  if (fsBtn) {
    fsBtn.addEventListener('click', function () {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(function () {});
      } else {
        document.exitFullscreen();
      }
    });
  }

  // ================= PENDING COMMENTS BADGE =================
  var badge = document.getElementById('rcPendingBadge');
  if (badge && window.ReceptionData) {
    var pending = ReceptionData.comments.filter(function (c) { return c.status === 'pending'; }).length;
    badge.textContent = pending;
    badge.style.display = pending > 0 ? '' : 'none';
  }

  // ================= LOGOUT =================
  var logoutBtn = document.getElementById('rcLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (confirm('آیا مطمئن هستید که می‌خواهید از پنل پذیرش خارج شوید؟')) {
        window.location.href = logoutBtn.getAttribute('data-href') || '../home/index.html';
      }
    });
  }

  // ================= QUICK ACTIONS (Alt+N / Alt+B) =================
  document.addEventListener('keydown', function (e) {
    if (e.altKey && e.key === 'n') {
      e.preventDefault();
      var newPatientBtn = document.getElementById('rcNewPatientBtn');
      if (newPatientBtn) newPatientBtn.click();
    }
    if (e.altKey && e.key === 'b') {
      e.preventDefault();
      var newAptBtn = document.getElementById('rcNewAptBtn');
      if (newAptBtn) newAptBtn.click();
    }
  });

  // ================= HELPERS =================
  window.rcFormatPrice = function (n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' تومان';
  };

  window.rcDoctorName = function (id) {
    var d = ReceptionData.doctors.find(function (x) { return x.id === id; });
    return d ? d.name : '—';
  };

  window.rcServiceName = function (id) {
    var s = ReceptionData.services.find(function (x) { return x.id === id; });
    return s ? s.name : '—';
  };

  window.rcStatusLabel = function (s) {
    var map = { confirmed: 'تایید شده', pending: 'در انتظار', arrived: 'پذیرش شده', completed: 'انجام شده', cancelled: 'لغو شده' };
    return map[s] || s;
  };

  window.rcStatusClass = function (s) {
    var map = { confirmed: 'rc-st--blue', pending: 'rc-st--orange', arrived: 'rc-st--green', completed: 'rc-st--done', cancelled: 'rc-st--red' };
    return map[s] || '';
  };

})();
