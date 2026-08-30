/**
 * Dentura — Appointments Page Interactions
 * Search, filter, sort, tracking code copy, and receipt modal.
 */
(function () {
    'use strict';

    var cards = document.querySelectorAll('.dash-apt-card');
    var searchInput = document.getElementById('aptSearch');
    var sortSelect = document.getElementById('aptSort');
    var filterBtns = document.querySelectorAll('.dash-apt-filters .dash-filter-btn');
    var counterEl = document.querySelector('.dash-page-meta');
    var activeStatus = 'all';

    function getVisibleCards() {
        return Array.from(cards).filter(function (c) {
            return c.style.display !== 'none';
        });
    }

    function updateCounter() {
        if (counterEl) {
            counterEl.textContent = getVisibleCards().length + ' نوبت';
        }
    }

    function applyFilters() {
        var query = (searchInput ? searchInput.value.trim().toLowerCase() : '');

        cards.forEach(function (card) {
            var status = card.dataset.status;
            var doctor = (card.dataset.doctor || '').toLowerCase();
            var service = (card.dataset.service || '').toLowerCase();

            var matchStatus = activeStatus === 'all' || status === activeStatus;
            var matchSearch = !query || doctor.indexOf(query) !== -1 || service.indexOf(query) !== -1;

            card.style.display = (matchStatus && matchSearch) ? '' : 'none';
        });

        updateCounter();
    }

    function applySort() {
        var list = document.getElementById('aptList');
        if (!list) return;

        var sorted = Array.from(cards);
        var newest = sortSelect ? sortSelect.value === 'newest' : true;

        // Move active card to top if sorting by newest
        sorted.sort(function (a, b) {
            if (newest) {
                if (a.dataset.status === 'pending') return -1;
                if (b.dataset.status === 'pending') return 1;
            }
            return 0;
        });

        sorted.forEach(function (card) {
            list.appendChild(card);
        });
    }

    /* ================= FILTER TABS ================= */
    if (filterBtns.length) {
        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                activeStatus = btn.dataset.status;
                applyFilters();
            });
        });
    }

    /* ================= SEARCH ================= */
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            applyFilters();
        });
    }

    /* ================= SORT ================= */
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            applySort();
        });
    }

    /* ================= TRACKING CODE COPY ================= */
    document.querySelectorAll('.dash-apt-tracking-code').forEach(function (code) {
        code.style.cursor = 'pointer';
        code.title = 'کلیک برای کپی';

        code.addEventListener('click', function () {
            var text = code.textContent.trim();
            if (!text) return;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(function () {
                    showCopyFeedback(code);
                });
            } else {
                // Fallback
                var ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                showCopyFeedback(code);
            }
        });
    });

    function showCopyFeedback(el) {
        var orig = el.textContent;
        el.textContent = '✓ کپی شد';
        el.style.color = 'var(--primary)';
        el.style.fontWeight = '700';
        setTimeout(function () {
            el.textContent = orig;
            el.style.color = '';
            el.style.fontWeight = '';
        }, 1500);
    }

    /* ================= RECEIPT MODAL ================= */
    (function initReceiptModal() {
        document.querySelectorAll('.dash-apt-action-btn--receipt').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var card = btn.closest('.dash-apt-card');
                if (!card) return;

                var doctor = card.dataset.doctor || 'نامشخص';
                var service = card.dataset.service || 'نامشخص';
                var dateEl = card.querySelector('.dash-apt-card-center span');
                var date = dateEl ? dateEl.textContent.trim : 'نامشخص';
                var trackingEl = card.querySelector('.dash-apt-tracking-code');
                var tracking = trackingEl ? trackingEl.textContent.trim() : '-';

                // Create modal
                var modal = document.createElement('div');
                modal.className = 'dash-receipt-modal';
                modal.innerHTML =
                    '<div class="dash-receipt-overlay"></div>' +
                    '<div class="dash-receipt-card">' +
                    '  <button class="dash-receipt-close" aria-label="بستن">' +
                    '    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
                    '  </button>' +
                    '  <h3 class="dash-receipt-title">رسید نوبت</h3>' +
                    '  <div class="dash-receipt-row"><span>نوع خدمت:</span><strong>' + service + '</strong></div>' +
                    '  <div class="dash-receipt-row"><span>پزشک معالج:</span><strong>دکتر ' + doctor + '</strong></div>' +
                    '  <div class="dash-receipt-row"><span>تاریخ و ساعت:</span><strong>' + date + '</strong></div>' +
                    '  <div class="dash-receipt-row"><span>کد پیگیری:</span><strong class="dash-receipt-tracking">' + tracking + '</strong></div>' +
                    '  <div class="dash-receipt-row"><span>وضعیت:</span><strong>' + getStatusLabel(card.dataset.status) + '</strong></div>' +
                    '  <div class="dash-receipt-divider"></div>' +
                    '  <div class="dash-receipt-row dash-receipt-total"><span>مبلغ قابل پرداخت:</span><strong>۲,۵۰۰,۰۰۰ تومان</strong></div>' +
                    '</div>';

                document.body.appendChild(modal);

                // Animate in
                requestAnimationFrame(function () {
                    modal.classList.add('is-active');
                });

                // Close handlers
                modal.querySelector('.dash-receipt-close').addEventListener('click', closeModal);
                modal.querySelector('.dash-receipt-overlay').addEventListener('click', closeModal);

                function closeModal() {
                    modal.classList.remove('is-active');
                    setTimeout(function () { modal.remove(); }, 300);
                }
            });
        });

        function getStatusLabel(status) {
            switch (status) {
                case 'done': return '✅ انجام‌شده';
                case 'pending': return '🟡 در انتظار مراجعه';
                case 'cancelled': return '🔴 لغوشده';
                default: return status;
            }
        }
    })();

    /* ================= REVIEW MODAL ================= */
    (function initReviewModal() {
        var STAR_SVG_EMPTY = '<svg viewBox="0 0 24 24"><polygon class="star-empty" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        var STAR_SVG_FILLED = '<svg viewBox="0 0 24 24"><polygon class="star-filled" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        var RATINGS = [
            { key: 'professionalism', label: 'تخصص و مهارت حرفه‌ای' },
            { key: 'treatment_quality', label: 'کیفیت درمان' },
            { key: 'communication', label: 'ارتباط و برخورد' }
        ];

        document.querySelectorAll('.dash-apt-action-btn--review').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                var aptId = btn.dataset.aptId || '';
                var doctor = btn.dataset.doctor || '';
                var service = btn.dataset.service || '';

                var modal = document.createElement('div');
                modal.className = 'dash-review-modal';

                var ratingsHTML = '';
                RATINGS.forEach(function(r) {
                    ratingsHTML += '<div class="dash-review-rating-row">';
                    ratingsHTML += '<span class="dash-review-rating-label">' + r.label + '</span>';
                    ratingsHTML += '<div class="dash-review-stars" data-field="' + r.key + '" data-value="0">';
                    for (var i = 1; i <= 5; i++) {
                        ratingsHTML += '<button type="button" class="dash-review-star" data-star="' + i + '">' + STAR_SVG_EMPTY + '</button>';
                    }
                    ratingsHTML += '<span class="dash-review-rating-value">۰</span>';
                    ratingsHTML += '</div></div>';
                });

                modal.innerHTML =
                    '<div class="dash-review-overlay"></div>' +
                    '<div class="dash-review-card">' +
                    '<button class="dash-review-close" aria-label="بستن"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
                    '<h3 class="dash-review-title">نظر شما درباره درمان</h3>' +
                    '<p class="dash-review-subtitle">' + doctor + ' — ' + service + '</p>' +
                    '<div class="dash-review-form">' +
                    '<div class="dash-review-rating-group">' + ratingsHTML + '</div>' +
                    '<div class="dash-review-message-group">' +
                    '<label class="dash-review-message-label" for="reviewMessage">پیام شما</label>' +
                    '<textarea class="dash-review-message-textarea" id="reviewMessage" placeholder="نظر، پیشنهاد یا تجربه خود را بنویسید..."></textarea>' +
                    '</div>' +
                    '<button class="dash-review-submit" type="button" disabled>' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
                    'ارسال نظر</button>' +
                    '</div>' +
                    '<div class="dash-review-success">' +
                    '<div class="dash-review-success-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                    '<p class="dash-review-success-text">نظر شما با موفقیت ثبت شد!</p>' +
                    '<p class="dash-review-success-sub">پس از بررسی نمایش داده خواهد شد.</p>' +
                    '</div>' +
                    '</div>';

                document.body.appendChild(modal);
                requestAnimationFrame(function() { modal.classList.add('is-active'); });

                var formEl = modal.querySelector('.dash-review-form');
                var successEl = modal.querySelector('.dash-review-success');
                var submitBtn = modal.querySelector('.dash-review-submit');

                modal.querySelectorAll('.dash-review-stars').forEach(function(group) {
                    group.querySelectorAll('.dash-review-star').forEach(function(star) {
                        star.addEventListener('click', function() {
                            var val = parseInt(star.dataset.star);
                            group.dataset.value = val;
                            group.querySelectorAll('.dash-review-star').forEach(function(s, idx) {
                                s.innerHTML = idx < val ? STAR_SVG_FILLED : STAR_SVG_EMPTY;
                            });
                            group.querySelector('.dash-review-rating-value').textContent = val;
                            var allRated = true;
                            modal.querySelectorAll('.dash-review-stars').forEach(function(g) {
                                if (parseInt(g.dataset.value) === 0) allRated = false;
                            });
                            submitBtn.disabled = !allRated;
                        });
                    });
                });

                function closeModal() {
                    modal.classList.remove('is-active');
                    setTimeout(function() { modal.remove(); }, 300);
                }
                modal.querySelector('.dash-review-close').addEventListener('click', closeModal);
                modal.querySelector('.dash-review-overlay').addEventListener('click', closeModal);

                submitBtn.addEventListener('click', function() {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'در حال ارسال...';
                    setTimeout(function() {
                        formEl.style.display = 'none';
                        successEl.classList.add('is-visible');
                        setTimeout(closeModal, 2000);
                    }, 800);
                });
            });
        });
    })();

    /* ================= HEADER SCROLL ================= */
    (function initHeaderScroll() {
        var header = document.querySelector('.dash-header');
        if (!header) return;
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    header.classList.toggle('is-scrolled', window.scrollY > 30);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    })();

})();
