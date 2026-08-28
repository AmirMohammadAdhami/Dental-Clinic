document.addEventListener('DOMContentLoaded', function () {
  window.scrollTo(0, 0);

  var ITEMS_PER_PAGE = 6;
  var currentPage = 1;
  var allArticles = [];

  /* ─── Helpers ─── */
  function toArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  function toPersianNum(n) {
    var p = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(n).replace(/\d/g, function (d) { return p[parseInt(d)]; });
  }

  function getFirstImage(files) {
    if (!files || !files.length) return null;
    var img = files.find(function (f) { return f.media_type === 'IMAGE' && f.file; });
    return img ? img.file : null;
  }

  function getFirstVideo(files) {
    if (!files || !files.length) return null;
    var v = files.find(function (f) { return f.media_type === 'VIDEO' && (f.video_url || f.file); });
    return v ? (v.video_url || v.file) : null;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      var d = new Date(dateStr);
      var j = d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
      return j;
    } catch (e) { return dateStr; }
  }

  /* ═══════════════════════════════════════════
     Fetch & Render Filters from Services API
     ═══════════════════════════════════════════ */
  async function fetchAndRenderFilters() {
    var container = document.getElementById('articlesFilters');
    if (!container) return;

    try {
      var res = await fetch('/api/services/');
      if (!res.ok) throw new Error('Services API not OK');
      var services = toArray(await res.json());

      services.forEach(function (svc) {
        var btn = document.createElement('button');
        btn.className = 'articles-filter-btn';
        btn.setAttribute('data-filter', svc.name);
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
        btn.textContent = svc.name;
        container.appendChild(btn);
      });

      // Bind filter events
      var filterBtns = container.querySelectorAll('.articles-filter-btn');
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) {
            b.classList.remove('is-active');
            b.setAttribute('aria-selected', 'false');
          });
          btn.classList.add('is-active');
          btn.setAttribute('aria-selected', 'true');
          applyFilter(true);
        });
      });

      // Read ?cat= from URL and activate matching filter
      var urlParams = new URLSearchParams(window.location.search);
      var initialCat = urlParams.get('cat');
      if (initialCat) {
        filterBtns.forEach(function (b) {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
          if (b.getAttribute('data-filter') === initialCat) {
            b.classList.add('is-active');
            b.setAttribute('aria-selected', 'true');
          }
        });
      }

    } catch (err) {
      console.error('خطا در دریافت فیلترها:', err);
    }
  }

  /* ═══════════════════════════════════════════
     Fetch & Render Articles from API
     ═══════════════════════════════════════════ */
  async function fetchAndRenderArticles() {
    var grid = document.getElementById('articlesGrid');
    var featuredSection = document.getElementById('featuredSection');
    var featuredCard = document.getElementById('featuredCard');
    if (!grid) return;

    try {
      var res = await fetch('/api/home-videos/');
      if (!res.ok) throw new Error('Articles API not OK');
      allArticles = toArray(await res.json());

      // --- Featured Article (special_article === true) ---
      var featured = allArticles.find(function (a) { return a.special_article === true; });
      if (featured && featuredCard && featuredSection) {
        var featImg = getFirstImage(featured.files) || '/static/images/home-video-preview/preview-1.jpg';
        featuredSection.style.display = '';
        featuredCard.innerHTML =
          '<a href="/blog/article/' + featured.slug + '/" class="featured-card-img">' +
            '<img src="' + featImg + '" alt="' + featured.title + '">' +
            '<span class="featured-badge">مقاله ویژه</span>' +
          '</a>' +
          '<div class="featured-card-body">' +
            '<span class="featured-tag">' + (featured.category_name || '') + '</span>' +
            '<h2 class="featured-title">' + featured.title + '</h2>' +
            '<p class="featured-desc">' + (featured.abstract || '') + '</p>' +
            '<a href="/blog/article/' + featured.slug + '/" class="featured-cta">' +
              'مطالعه مقاله' +
              '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
            '</a>' +
          '</div>';
      }

      // --- Article Grid ---
      grid.innerHTML = '';
      allArticles.forEach(function (article) {
        var coverImg = getFirstImage(article.files) || '/static/images/home-video-preview/preview-1.jpg';

        var card = document.createElement('article');
        card.className = 'article-card';
        card.setAttribute('data-category', article.category_name || '');

        card.innerHTML =
          '<a href="/blog/article/' + article.slug + '/" class="article-card-link">' +
            '<div class="article-card-thumb">' +
              '<img src="' + coverImg + '" alt="' + article.title + '">' +
            '</div>' +
            '<div class="article-card-body">' +
              '<div class="article-card-meta">' +
                '<div class="article-card-author">' +
                  '<img src="' + (article.profile_photo || '/static/images/doctors/default.jpg') + '" alt="' + article.full_name + '" class="article-card-avatar">' +
                  '<span>' + article.full_name + '</span>' +
                '</div>' +
                '<span class="article-card-date">' + formatDate(article.created_at) + '</span>' +
              '</div>' +
              '<h3 class="article-card-title">' + article.title + '</h3>' +
              '<div class="article-card-footer">' +
                '<span class="article-card-tag">' + (article.category_name || '') + '</span>' +
                '<span class="article-card-more">' +
                  'مطالعه مقاله' +
                  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>' +
                '</span>' +
              '</div>' +
            '</div>' +
          '</a>';

        grid.appendChild(card);
      });

      // --- Popular Articles Sidebar (sorted by view_count desc, top 7) ---
      var sorted = allArticles.slice().sort(function (a, b) { return (b.view_count || 0) - (a.view_count || 0); });
      renderPopularArticles(sorted.slice(0, 7));

      // Init filters & pagination
      applyFilter(false);

    } catch (err) {
      console.error('خطا در دریافت مقالات:', err);
    }
  }

  /* ═══════════════════════════════════════════
     Popular Articles Sidebar
     ═══════════════════════════════════════════ */
  function renderPopularArticles(articles) {
    var list = document.getElementById('popularList');
    if (!list) return;
    list.innerHTML = '';
    articles.forEach(function (article, i) {
      var li = document.createElement('li');
      li.className = 'sidebar-popular-item';
      li.innerHTML =
        '<span class="sidebar-popular-num">' + toPersianNum(i + 1) + '</span>' +
        '<a href="/blog/article/' + article.slug + '/" class="sidebar-popular-link">' + article.title + '</a>';
      list.appendChild(li);
    });
  }

  /* ═══════════════════════════════════════════
     Filter Logic
     ═══════════════════════════════════════════ */
  function getActiveFilter() {
    var active = document.querySelector('.articles-filter-btn.is-active');
    return active ? active.getAttribute('data-filter') : 'all';
  }

  function applyFilter(animate) {
    var filter = getActiveFilter();
    var cards = document.querySelectorAll('.article-card');
    var visibleCount = 0;

    cards.forEach(function (card) {
      var category = card.getAttribute('data-category');
      var show = (filter === 'all' || category === filter);

      if (show) {
        visibleCount++;
        card.style.display = '';
        if (animate) {
          card.style.opacity = '0';
          card.style.transform = 'translateY(16px)';
          requestAnimationFrame(function () {
            card.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        setTimeout(function () { card.style.display = 'none'; }, 300);
      }
    });

    currentPage = 1;
    showPage(1, false);
  }

  /* ═══════════════════════════════════════════
     Pagination
     ═══════════════════════════════════════════ */
  function getVisibleCards() {
    var filter = getActiveFilter();
    var cards = document.querySelectorAll('.article-card');
    var visible = [];
    cards.forEach(function (card) {
      var category = card.getAttribute('data-category');
      if (filter === 'all' || category === filter) visible.push(card);
    });
    return visible;
  }

  function showPage(page, scrollToTop) {
    var visible = getVisibleCards();
    var total = visible.length;
    var totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    currentPage = Math.max(1, Math.min(page, totalPages || 1));
    var start = (currentPage - 1) * ITEMS_PER_PAGE;
    var end = start + ITEMS_PER_PAGE;

    visible.forEach(function (card, i) {
      if (i >= start && i < end) {
        card.style.display = '';
        card.style.opacity = '0';
        card.style.transform = 'translateY(12px)';
        requestAnimationFrame(function () {
          card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        });
      } else {
        card.style.display = 'none';
      }
    });

    renderPaginationDots(totalPages);

    if (scrollToTop) {
      var el = document.querySelector('.articles-filters-section');
      if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
    }
  }

  function renderPaginationDots(totalPages) {
    var nav = document.getElementById('articlesPagination');
    if (!nav) return;
    if (totalPages <= 1) { nav.innerHTML = ''; return; }

    var html = '';
    html += '<button class="ba-page-btn pagination-prev" aria-label="صفحه بعد" ' + (currentPage <= 1 ? 'disabled' : '') + '>';
    html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
    html += '</button>';

    var pages = [];
    if (totalPages <= 7) {
      for (var i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (var j = Math.max(2, currentPage - 1); j <= Math.min(totalPages - 1, currentPage + 1); j++) pages.push(j);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    pages.forEach(function (p) {
      if (p === '...') {
        html += '<span class="ba-page-dots">...</span>';
      } else {
        html += '<button class="ba-page-num' + (p === currentPage ? ' is-active' : '') + '" data-page="' + p + '">' + toPersianNum(p) + '</button>';
      }
    });

    html += '<button class="ba-page-btn pagination-next" aria-label="صفحه قبل" ' + (currentPage >= totalPages ? 'disabled' : '') + '>';
    html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    html += '</button>';

    nav.innerHTML = html;

    nav.querySelectorAll('.ba-page-num').forEach(function (btn) {
      btn.addEventListener('click', function () { showPage(parseInt(btn.getAttribute('data-page')), true); });
    });
    var prevBtn = nav.querySelector('.pagination-prev');
    var nextBtn = nav.querySelector('.pagination-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { showPage(currentPage - 1, true); });
    if (nextBtn) nextBtn.addEventListener('click', function () { showPage(currentPage + 1, true); });
  }

  /* ═══════════════════════════════════════════
     Search
     ═══════════════════════════════════════════ */
  function performSearch(query) {
    var q = (query || '').trim().toLowerCase();
    var cards = document.querySelectorAll('.article-card');

    cards.forEach(function (card) {
      var title = (card.querySelector('.article-card-title') || {}).textContent || '';
      var category = card.getAttribute('data-category') || '';
      var match = !q || title.toLowerCase().indexOf(q) !== -1 || category.toLowerCase().indexOf(q) !== -1;
      if (match) {
        card.style.display = '';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        setTimeout(function () { card.style.display = 'none'; }, 300);
      }
    });

    if (q) {
      document.querySelectorAll('.articles-filter-btn').forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      var allBtn = document.querySelector('.articles-filter-btn[data-filter="all"]');
      if (allBtn) { allBtn.classList.add('is-active'); allBtn.setAttribute('aria-selected', 'true'); }
    }

    currentPage = 1;
    showPage(1, true);
  }

  var searchInput = document.querySelector('.sidebar-search-input');
  var searchBtn = document.querySelector('.sidebar-search-btn');
  if (searchInput) searchInput.addEventListener('input', function () { performSearch(this.value); });
  if (searchBtn) searchBtn.addEventListener('click', function () { performSearch(searchInput.value); });

  /* ═══════════════════════════════════════════
     Mobile Search Overlay
     ═══════════════════════════════════════════ */
  var mobileFab = document.getElementById('mobileSearchFab');
  var mobileOverlay = document.getElementById('mobileSearchOverlay');
  var mobileClose = document.getElementById('mobileSearchClose');
  var mobileInput = document.getElementById('mobileSearchInput');
  var mobileSubmit = document.getElementById('mobileSearchSubmit');

  if (mobileFab && mobileOverlay) {
    mobileFab.addEventListener('click', function () {
      mobileOverlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(function () { mobileInput.focus(); }, 100);
    });

    function closeMobileSearch() {
      mobileOverlay.classList.remove('is-open');
      document.body.style.overflow = '';
      if (mobileInput) mobileInput.value = '';
    }

    if (mobileClose) mobileClose.addEventListener('click', closeMobileSearch);
    mobileOverlay.addEventListener('click', function (e) { if (e.target === mobileOverlay) closeMobileSearch(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileOverlay.classList.contains('is-open')) closeMobileSearch();
    });
    if (mobileSubmit) mobileSubmit.addEventListener('click', function () { performSearch(mobileInput.value); closeMobileSearch(); });
    if (mobileInput) mobileInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { performSearch(mobileInput.value); closeMobileSearch(); }
    });
  }

  /* ═══════════════════════════════════════════
     Init
     ═══════════════════════════════════════════ */
  (async function init() {
    await Promise.all([fetchAndRenderFilters(), fetchAndRenderArticles()]);
  })();
});
