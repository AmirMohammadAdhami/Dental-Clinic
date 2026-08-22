document.addEventListener('DOMContentLoaded', function () {

    // Prevent browser from restoring scroll position on refresh
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // ================= CATEGORY FILTER =================
    var filterBtns = document.querySelectorAll('.articles-filter-btn');
    var cards = document.querySelectorAll('.article-card');
    var ITEMS_PER_PAGE = 6;
    var currentPage = 1;

    // --- Read ?cat= from URL and activate matching filter ---
    var urlParams = new URLSearchParams(window.location.search);
    var initialCat = urlParams.get('cat');
    if (initialCat) {
        filterBtns.forEach(function (b) {
            b.classList.remove('is-active');
            b.setAttribute('aria-selected', 'false');
        });
        var target = document.querySelector('.articles-filter-btn[data-filter="' + initialCat + '"]');
        if (target) {
            target.classList.add('is-active');
            target.setAttribute('aria-selected', 'true');
        }
    }

    function getActiveFilter() {
        var active = document.querySelector('.articles-filter-btn.is-active');
        return active ? active.getAttribute('data-filter') : 'all';
    }

    function applyFilter(animate) {
        var filter = getActiveFilter();
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
                setTimeout(function () {
                    card.style.display = 'none';
                }, 300);
            }
        });
        currentPage = 1;
        updatePagination(visibleCount);
    }

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

    // ================= PAGINATION =================
    function getVisibleCards() {
        var filter = getActiveFilter();
        var visible = [];
        cards.forEach(function (card) {
            var category = card.getAttribute('data-category');
            if (filter === 'all' || category === filter) {
                visible.push(card);
            }
        });
        return visible;
    }

    function showPage(page, scrollToTop) {
        var visible = getVisibleCards();
        var total = visible.length;
        var totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        currentPage = Math.max(1, Math.min(page, totalPages));

        visible.forEach(function (card, i) {
            var start = (currentPage - 1) * ITEMS_PER_PAGE;
            var end = start + ITEMS_PER_PAGE;
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
            window.scrollTo({ top: document.querySelector('.articles-filters-section').offsetTop - 100, behavior: 'smooth' });
        }
    }

    function renderPaginationDots(totalPages) {
        var nav = document.querySelector('.articles-pagination');
        if (!nav) return;
        if (totalPages <= 1) {
            nav.style.display = 'none';
            return;
        }
        nav.style.display = '';
        var html = '';
        // Prev arrow
        html += '<button class="ba-page-btn pagination-prev" aria-label="صفحه قبل" ' + (currentPage >= totalPages ? 'disabled' : '') + '>';
        html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
        html += '</button>';

        // Page numbers with smart ellipsis
        var pages = [];
        if (totalPages <= 7) {
            for (var i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            for (var j = Math.max(2, currentPage - 1); j <= Math.min(totalPages - 1, currentPage + 1); j++) {
                pages.push(j);
            }
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

        // Next arrow
        html += '<button class="ba-page-btn pagination-next" aria-label="صفحه بعد" ' + (currentPage <= 1 ? 'disabled' : '') + '>';
        html += '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
        html += '</button>';

        nav.innerHTML = html;

        // Attach events
        nav.querySelectorAll('.ba-page-num').forEach(function (btn) {
            btn.addEventListener('click', function () {
                showPage(parseInt(btn.getAttribute('data-page')), true);
            });
        });
        var prevBtn = nav.querySelector('.pagination-prev');
        var nextBtn = nav.querySelector('.pagination-next');
        if (prevBtn) prevBtn.addEventListener('click', function () { showPage(currentPage + 1, true); });
        if (nextBtn) nextBtn.addEventListener('click', function () { showPage(currentPage - 1, true); });
    }

    function toPersianNum(n) {
        var persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
        return String(n).replace(/\d/g, function (d) { return persianDigits[parseInt(d)]; });
    }

    function updatePagination() {
        var visible = getVisibleCards();
        var totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
        renderPaginationDots(totalPages);
        showPage(1, true);
    }

    // ================= SEARCH =================
    var searchInput = document.querySelector('.sidebar-search-input');
    var searchBtn = document.querySelector('.sidebar-search-btn');

    function performSearch() {
        var query = (searchInput.value || '').trim().toLowerCase();
        cards.forEach(function (card) {
            var title = (card.querySelector('.article-card-title') || {}).textContent || '';
            if (!query || title.toLowerCase().indexOf(query) !== -1) {
                card.style.display = '';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            } else {
                card.style.display = 'none';
            }
        });
        if (query) {
            filterBtns.forEach(function (b) {
                b.classList.remove('is-active');
                b.setAttribute('aria-selected', 'false');
            });
            filterBtns[0].classList.add('is-active');
            filterBtns[0].setAttribute('aria-selected', 'true');
        }
        currentPage = 1;
        var visible = getVisibleCards();
        var totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
        renderPaginationDots(totalPages);
        showPage(1, true);
    }

    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    // ================= MOBILE SEARCH OVERLAY =================
    var mobileFab = document.getElementById('mobileSearchFab');
    var mobileOverlay = document.getElementById('mobileSearchOverlay');
    var mobileClose = document.getElementById('mobileSearchClose');
    var mobileInput = document.getElementById('mobileSearchInput');
    var mobileSubmit = document.getElementById('mobileSearchSubmit');

    if (mobileFab && mobileOverlay) {
        mobileFab.addEventListener('click', function () {
            mobileOverlay.classList.add('is-open');
            document.body.style.overflow = 'hidden';
            setTimeout(function () {
                mobileInput.focus();
            }, 100);
        });

        function closeMobileSearch() {
            mobileOverlay.classList.remove('is-open');
            document.body.style.overflow = '';
            if (mobileInput) mobileInput.value = '';
        }

        if (mobileClose) {
            mobileClose.addEventListener('click', closeMobileSearch);
        }

        mobileOverlay.addEventListener('click', function (e) {
            if (e.target === mobileOverlay) closeMobileSearch();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && mobileOverlay.classList.contains('is-open')) {
                closeMobileSearch();
            }
        });

        function performMobileSearch() {
            var query = (mobileInput.value || '').trim().toLowerCase();
            cards.forEach(function (card) {
                var title = (card.querySelector('.article-card-title') || {}).textContent || '';
                if (!query || title.toLowerCase().indexOf(query) !== -1) {
                    card.style.display = '';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                } else {
                    card.style.display = 'none';
                }
            });
            if (query) {
                filterBtns.forEach(function (b) {
                    b.classList.remove('is-active');
                    b.setAttribute('aria-selected', 'false');
                });
                filterBtns[0].classList.add('is-active');
                filterBtns[0].setAttribute('aria-selected', 'true');
            }
            closeMobileSearch();
            currentPage = 1;
            var visible = getVisibleCards();
            var totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE);
            renderPaginationDots(totalPages);
            showPage(1);
        }

        if (mobileSubmit) {
            mobileSubmit.addEventListener('click', performMobileSearch);
        }
        if (mobileInput) {
            mobileInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') performMobileSearch();
            });
        }
    }

    // ================= INIT =================
    // Apply initial filter from URL
    applyFilter(false);
    showPage(1);

});
