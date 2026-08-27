// Before/After page – fetch data from API and render dynamically

(function () {
  'use strict';

  var API_URL = '/api/before-afters/';
  var ITEMS_PER_PAGE = 9;

  var allData = [];
  var currentFilter = 'all';
  var currentPage = 1;

  // ── Scroll restoration ──
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  // ── Helpers ──
  function toArray(v) { return Array.isArray(v) ? v : (v && v.results ? v.results : []); }

  function esc(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s || ''));
    return d.innerHTML;
  }

  // ── Build filter buttons from unique service_name values ──
  function buildFilters(items) {
    var container = document.getElementById('baFilters');
    if (!container) return;

    // Keep the "همه" button, remove any stale dynamically-added buttons
    container.querySelectorAll('.ba-filter-btn:not([data-filter="all"])').forEach(function (b) { b.remove(); });

    // Collect unique service names preserving order
    var seen = {};
    var services = [];
    items.forEach(function (item) {
      var name = item.service_name;
      if (name && !seen[name]) { seen[name] = true; services.push(name); }
    });

    services.forEach(function (name) {
      var btn = document.createElement('button');
      btn.className = 'ba-filter-btn';
      btn.setAttribute('data-filter', name);
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.textContent = name;
      container.appendChild(btn);
    });
  }

  // ── Render cards for current filter + page ──
  function renderCards() {
    var grid = document.getElementById('baGrid');
    if (!grid) return;

    var filtered = currentFilter === 'all'
      ? allData
      : allData.filter(function (item) { return item.service_name === currentFilter; });

    var totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;

    var start = (currentPage - 1) * ITEMS_PER_PAGE;
    var pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

    grid.innerHTML = '';

    if (pageItems.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;padding:2rem 0;">نمونه کاری یافت نشد.</p>';
    }

    pageItems.forEach(function (item) {
      var serviceName = esc(item.service_name || '');
      var desc = esc(item.description || '');
      var doctorName = esc(item.doctor_name || '');
      var doctorSlug = esc(item.doctor_slug || '');
      var beforeImg = item.before_image || '';
      var afterImg = item.after_image || '';

      var div = document.createElement('div');
      div.className = 'ba-card-item';
      div.setAttribute('data-treatment', serviceName);

      div.innerHTML =
        '<div class="doctor-card" data-ba>' +
          '<div class="doctor-img ba-container" tabindex="0" role="slider"' +
            ' aria-label="مقایسه قبل و بعد ' + desc + '"' +
            ' aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">' +
            '<img class="ba-img ba-after" src="' + afterImg + '" alt="نتیجه بعد از ' + desc + '">' +
            '<img class="ba-img ba-before" src="' + beforeImg + '" alt="وضعیت قبل از ' + desc + '">' +
            '<div class="ba-slider"><div class="ba-handle"></div></div>' +
            '<span class="ba-label ba-label-before">قبل</span>' +
            '<span class="ba-label ba-label-after">بعد</span>' +
          '</div>' +
        '</div>' +
        '<p class="ba-card-desc">' + desc + '</p>' +
        '<div class="ba-card-footer">' +
          '<span class="ba-card-tag" data-filter-link="' + serviceName + '">' + serviceName + '</span>' +
          (doctorName ? (doctorSlug ? '<a href="/doctors/' + doctorSlug + '/" class="ba-card-doctor">دکتر ' + doctorName + '</a>' : '<span class="ba-card-doctor">دکتر ' + doctorName + '</span>') : '') +
        '</div>';

      grid.appendChild(div);
    });

    renderPagination(totalPages);
    initSliders();
  }

  // ── Pagination ──
  function renderPagination(totalPages) {
    var nav = document.getElementById('baPagination');
    if (!nav) return;

    if (totalPages <= 1) { nav.style.display = 'none'; return; }
    nav.style.display = '';

    // Arabic numerals mapping
    var arNums = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    function toAr(n) { return String(n).split('').map(function(c){return arNums[parseInt(c)]||c;}).join(''); }

    var html = '';

    // Next (previous in RTL)
    html += '<button class="ba-page-btn" data-page="prev" aria-label="صفحه قبل">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>';

    // Page numbers (show at most 7 with ellipsis)
    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      var s = Math.max(2, currentPage - 1);
      var e = Math.min(totalPages - 1, currentPage + 1);
      for (var p = s; p <= e; p++) pages.push(p);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    pages.forEach(function (pg) {
      if (pg === '...') {
        html += '<span class="ba-page-dots">...</span>';
      } else {
        var active = pg === currentPage ? ' is-active' : '';
        html += '<button class="ba-page-num' + active + '" data-page="' + pg + '">' + toAr(pg) + '</button>';
      }
    });

    // Previous (next in RTL)
    html += '<button class="ba-page-btn" data-page="next" aria-label="صفحه بعد">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>';

    nav.innerHTML = html;

    // Bind pagination clicks
    nav.querySelectorAll('button[data-page]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = btn.getAttribute('data-page');
        if (val === 'prev') {
          if (currentPage > 1) currentPage--;
        } else if (val === 'next') {
          var tp = Math.ceil((currentFilter === 'all' ? allData : allData.filter(function(i){return i.service_name===currentFilter;}).length) / ITEMS_PER_PAGE);
          if (currentPage < tp) currentPage++;
        } else {
          currentPage = parseInt(val) || 1;
        }
        renderCards();
        document.getElementById('baGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ── Before/After slider (re-init after dynamic render) ──
  function initSliders() {
    document.querySelectorAll('.ba-container').forEach(function (container) {
      // Skip if already initialized
      if (container.dataset.baInit) return;
      container.dataset.baInit = '1';

      var slider = container.querySelector('.ba-slider');
      var handle = container.querySelector('.ba-handle');
      var beforeImg = container.querySelector('.ba-before');
      if (!slider || !handle || !beforeImg) return;

      var isDragging = false;

      function updateSlider(x) {
        var rect = container.getBoundingClientRect();
        var pos = (x - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));
        slider.style.left = (pos * 100) + '%';
        beforeImg.style.clipPath = 'inset(0 ' + ((1 - pos) * 100) + '% 0 0)';
        container.setAttribute('aria-valuenow', Math.round(pos * 100));
      }

      container.addEventListener('mousedown', function (e) {
        isDragging = true; updateSlider(e.clientX);
      });
      document.addEventListener('mousemove', function (e) {
        if (!isDragging) return; e.preventDefault(); updateSlider(e.clientX);
      });
      document.addEventListener('mouseup', function () { isDragging = false; });

      container.addEventListener('touchstart', function (e) {
        isDragging = true; updateSlider(e.touches[0].clientX);
      }, { passive: true });
      container.addEventListener('touchmove', function (e) {
        if (!isDragging) return; e.preventDefault(); updateSlider(e.touches[0].clientX);
      }, { passive: false });
      container.addEventListener('touchend', function () { isDragging = false; });

      container.addEventListener('keydown', function (e) {
        var v = parseInt(container.getAttribute('aria-valuenow')) || 50;
        if (e.key === 'ArrowLeft') { v = Math.min(100, v + 5); }
        else if (e.key === 'ArrowRight') { v = Math.max(0, v - 5); }
        else return;
        e.preventDefault();
        slider.style.left = v + '%';
        beforeImg.style.clipPath = 'inset(0 ' + (100 - v) + '% 0 0)';
        container.setAttribute('aria-valuenow', v);
      });
    });
  }

  // ── Filter button events ──
  function bindFilters() {
    document.getElementById('baFilters').addEventListener('click', function (e) {
      var btn = e.target.closest('.ba-filter-btn');
      if (!btn) return;

      document.querySelectorAll('.ba-filter-btn').forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      currentFilter = btn.getAttribute('data-filter') || 'all';
      currentPage = 1;
      renderCards();
    });
  }

  // ── Tag click → trigger filter ──
  function bindTagClicks() {
    document.addEventListener('click', function (e) {
      var tag = e.target.closest('[data-filter-link]');
      if (!tag) return;
      var target = tag.getAttribute('data-filter-link');
      var btn = document.querySelector('.ba-filter-btn[data-filter="' + target + '"]');
      if (btn) btn.click();
    });
  }

  // ── Fetch from API ──
  async function init() {
    try {
      var res = await fetch(API_URL);
      if (!res.ok) throw new Error('API ' + res.status);
      allData = toArray(await res.json());
    } catch (err) {
      console.error('خطا در دریافت نمونه کارها:', err);
      allData = [];
    }

    buildFilters(allData);
    renderCards();
    bindFilters();
    bindTagClicks();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
