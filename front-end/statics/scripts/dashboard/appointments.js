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
