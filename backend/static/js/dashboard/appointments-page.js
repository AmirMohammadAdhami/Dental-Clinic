/**
 * Dentura — Appointments Page
 * Fetches dashboard data, renders appointment cards, handles filters/search/sort.
 * Service icons come from the API (Appointment.service_icon).
 */
(function () {
    'use strict';

    var API_URL = '/api/dashboard/me/';
    var R = window.DenturaReview;

    var STATUS_LABELS = {
        'RESERVED': '\u0631\u0632\u0631\u0648 \u0634\u062f\u0647',
        'DONE': '\u0627\u0646\u062c\u0627\u0645\u200c\u0634\u062f\u0647',
        'CANCELLED': '\u0644\u063a\u0648\u0634\u062f\u0647',
        'PENDING': '\u067e\u06cc\u0634\u200c\u0631\u0648'
    };

    var STATUS_CSS = {
        'RESERVED': 'reserved',
        'DONE': 'done',
        'CANCELLED': 'cancelled',
        'PENDING': 'pending'
    };

    var allAppointments = [];
    var activeStatus = 'all';
    var searchQuery = '';
    var sortNewest = true;

    /* ---- helpers ---- */
    function getServiceSlug(name) {
        if (!name) return 'checkup';
        var map = { '\u0627\u06cc\u0645\u067e\u0644\u0646\u062a': 'implant', '\u06a9\u0627\u0645\u067e\u0648\u0632\u06cc\u062a': 'beauty', '\u0648\u0646\u06cc\u0631': 'veneer', '\u0644\u0645\u06cc\u0646\u062a': 'laminate', '\u062c\u0631\u0645\u200c\u06af\u06cc\u0631\u06cc': 'cleaning', '\u0628\u0644\u06cc\u0686\u06cc\u0646\u06af': 'cleaning', '\u0686\u06a9\u0627\u067e': 'checkup', '\u0639\u0635\u0628\u200c\u06a9\u0634\u06cc': 'root-canal', '\u06a9\u0648\u062f\u06a9\u0627\u0646': 'kids' };
        for (var k in map) { if (name.indexOf(k) !== -1) return map[k]; }
        return 'beauty';
    }

    /* ---- banner ---- */
    function renderBanner(apt) {
        var section = document.getElementById('nextApptBanner');
        if (!apt) { section.style.display = 'none'; return; }
        section.style.display = '';
        document.getElementById('bannerDoctorName').textContent = '\u062f\u06a9\u062a\u0631 ' + (apt.doctor_name || '');
        document.getElementById('bannerTreatment').textContent = apt.service_name || '';
        document.getElementById('bannerDateTime').textContent = R.jalaliDate(apt.appointment_date || apt.created_at);
        var receiptLink = document.getElementById('bannerReceiptLink');
        if (receiptLink && apt.tracking_code) {
            receiptLink.href = '/dashboard/appointment/' + apt.tracking_code;
        }
    }

    /* ---- card html ---- */
    function renderCard(apt) {
        var slug = getServiceSlug(apt.service_name);
        var iconSrc = apt.service_icon || '';
        var statusCss = STATUS_CSS[apt.status] || 'pending';
        var statusLabel = STATUS_LABELS[apt.status] || apt.status;
        var isCancelled = apt.status === 'CANCELLED';

        var cls = 'dash-apt-card';
        if (isCancelled) cls += ' dash-apt-card--cancelled';

        var h = '<div class="' + cls + '" data-status="' + statusCss + '" data-doctor="' + R.escapeHTML(apt.doctor_name) + '" data-service="' + R.escapeHTML(apt.service_name) + '">';

        h += '<div class="dash-apt-card-status dash-apt-card-status--' + statusCss + '">';
        h += '<span class="dash-apt-status-dot"></span>' + statusLabel + '</div>';

        h += '<div class="dash-apt-card-right">';
        h += '<div class="dash-apt-card-icon dash-apt-card-icon--' + slug + '">';
        h += '<img width="44" height="44" src="' + iconSrc + '" alt="' + R.escapeHTML(apt.service_name) + '"></div>';
        h += '<div class="dash-apt-card-details">';
        h += '<strong>' + R.escapeHTML(apt.service_name) + '</strong>';
        h += '<span>\u062f\u06a9\u062a\u0631 ' + R.escapeHTML(apt.doctor_name) + '</span></div></div>';

        h += '<div class="dash-apt-card-center">';
        h += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
        h += '<span>' + R.jalaliDate(apt.appointment_date || apt.created_at) + '</span></div>';

        h += '<div class="dash-apt-card-left">';
        if (apt.tracking_code) {
            h += '<span class="dash-apt-tracking"><span class="dash-apt-tracking-label">\u06a9\u062f \u067e\u06cc\u06af\u06cc\u0631\u06cc:</span><span class="dash-apt-tracking-code">' + R.escapeHTML(apt.tracking_code) + '</span></span>';
        }
        if (apt.prescription_file) {
            h += '<a href="' + apt.prescription_file + '" class="dash-apt-action-btn dash-apt-action-btn--rx" target="_blank">';
            h += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
            h += '\u062f\u0627\u0646\u0644\u0648\u062f \u0646\u0633\u062e\u0647</a>';
        }
        if (!isCancelled && apt.tracking_code) {
            h += '<a href="/dashboard/appointment/' + apt.tracking_code + '" class="dash-apt-action-btn dash-apt-action-btn--receipt">';
            h += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
            h += '\u0645\u0634\u0627\u0647\u062f\u0647 \u0631\u0633\u06cc\u062f</a>';
        }
        if (apt.status === 'DONE') {
            if (apt.review_status === 'APPROVED' && apt.review_data) {
                h += '<a href="#" class="dash-apt-action-btn dash-apt-action-btn--review" data-review-json="' + R.escapeAttr(JSON.stringify(apt.review_data)) + '" data-doctor="' + R.escapeHTML(apt.doctor_name) + '" data-service="' + R.escapeHTML(apt.service_name) + '">';
                h += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
                h += '\u0645\u0634\u0627\u0647\u062f\u0647 \u0646\u0638\u0631</a>';
            } else if (apt.review_status === 'PENDING') {
                h += '<span class="dash-apt-action-btn dash-apt-action-btn--review-pending">';
                h += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
                h += '\u062f\u0631 \u0627\u0646\u062a\u0638\u0627\u0631 \u062a\u0627\u06cc\u06cc\u062f</span>';
            } else {
                h += '<button class="dash-apt-action-btn dash-apt-action-btn--review" data-apt-id="' + (apt.id || '') + '" data-doctor="' + R.escapeHTML(apt.doctor_name) + '" data-service="' + R.escapeHTML(apt.service_name) + '">';
                h += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
                h += '\u0646\u0648\u0634\u062a\u0646 \u0646\u0638\u0631</button>';
            }
        }
        h += '</div></div>';
        return h;
    }

    /* ---- list render ---- */
    function renderList() {
        var list = document.getElementById('aptList');
        var loading = document.getElementById('aptLoading');
        var empty = document.getElementById('aptEmpty');
        var counter = document.getElementById('aptCounter');

        list.innerHTML = '';
        if (loading) loading.style.display = 'none';

        var filtered = allAppointments.filter(function (a) {
            var s = (a.status || '').toLowerCase();
            var statusMatch = activeStatus === 'all' || s === activeStatus;
            var searchMatch = true;
            if (searchQuery) {
                var doctor = (a.doctor_name || '').toLowerCase();
                var service = (a.service_name || '').toLowerCase();
                searchMatch = doctor.indexOf(searchQuery) !== -1 || service.indexOf(searchQuery) !== -1;
            }
            return statusMatch && searchMatch;
        });

        filtered.sort(function (a, b) {
            var da = new Date(a.appointment_date || a.created_at || 0).getTime();
            var db = new Date(b.appointment_date || b.created_at || 0).getTime();
            return sortNewest ? (db - da) : (da - db);
        });

        if (filtered.length === 0) {
            empty.style.display = '';
        } else {
            empty.style.display = 'none';
            list.innerHTML = filtered.map(renderCard).join('');
        }

        if (counter) counter.textContent = filtered.length + ' \u0646\u0648\u0628\u062a';

        /* re-init interactive bits */
        initTrackingCopy();
        initReceiptModal();
        R.bindAll();
    }

    /* ---- fetch ---- */
    function fetchDashboard() {
        fetch(API_URL, { credentials: 'same-origin' })
            .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
            .then(function (data) {
                allAppointments = data.appointments || [];
                var reserved = allAppointments.filter(function (a) { return a.status === 'RESERVED'; });
                renderBanner(reserved[0] || null);
                renderList();
            })
            .catch(function (err) {
                console.error('Dashboard fetch error:', err);
                var loading = document.getElementById('aptLoading');
                if (loading) loading.innerHTML = '<p class="dash-apt-error">\u062e\u0637\u0627 \u062f\u0631 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0627\u0637\u0644\u0627\u0639\u0627\u062a. \u0644\u0637\u0641\u0627\u064b \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.</p>';
            });
    }

    /* ---- filters ---- */
    function initFilters() {
        var filterBtns = document.querySelectorAll('.dash-apt-filters .dash-filter-btn');
        if (!filterBtns.length) return;
        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                activeStatus = btn.dataset.status || 'all';
                renderList();
            });
        });
    }

    /* ---- search ---- */
    function initSearch() {
        var input = document.getElementById('aptSearch');
        if (!input) return;
        var timer;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                searchQuery = (input.value || '').trim().toLowerCase();
                renderList();
            }, 200);
        });
    }

    /* ---- sort ---- */
    function initSort() {
        var sel = document.getElementById('aptSort');
        if (!sel) return;
        sel.addEventListener('change', function () {
            sortNewest = sel.value === 'newest';
            renderList();
        });
    }

    /* ---- tracking copy ---- */
    function initTrackingCopy() {
        document.querySelectorAll('.dash-apt-tracking-code').forEach(function (code) {
            code.style.cursor = 'pointer';
            code.title = '\u06a9\u0644\u06cc\u06a9 \u0628\u0631\u0627\u06cc \u06a9\u067e\u06cc';
            code.addEventListener('click', function () {
                var text = code.textContent.trim();
                if (!text) return;
                function fb() {
                    var orig = text;
                    code.textContent = '\u2713 \u06a9\u067e\u06cc \u0634\u062f';
                    code.style.color = 'var(--primary)';
                    code.style.fontWeight = '700';
                    setTimeout(function () { code.textContent = orig; code.style.color = ''; code.style.fontWeight = ''; }, 1500);
                }
                if (navigator.clipboard) { navigator.clipboard.writeText(text).then(fb); }
                else { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); fb(); }
            });
        });
    }

    /* ---- receipt modal ---- */
    function initReceiptModal() {
        document.querySelectorAll('.dash-apt-action-btn--receipt').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var card = btn.closest('.dash-apt-card');
                if (!card) return;
                var doctor = card.dataset.doctor || '\u0646\u0627\u0645\u0634\u062e\u0635';
                var service = card.dataset.service || '\u0646\u0627\u0645\u0634\u062e\u0635';
                var dateEl = card.querySelector('.dash-apt-card-center span');
                var date = dateEl ? dateEl.textContent.trim() : '\u0646\u0627\u0645\u0634\u062e\u0635';
                var trackEl = card.querySelector('.dash-apt-tracking-code');
                var tracking = trackEl ? trackEl.textContent.trim() : '-';
                var modal = document.createElement('div');
                modal.className = 'dash-receipt-modal';
                modal.innerHTML = '<div class="dash-receipt-overlay"></div><div class="dash-receipt-card"><button class="dash-receipt-close" aria-label="\u0628\u0633\u062a\u0646"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button><h3 class="dash-receipt-title">\u0631\u0633\u06cc\u062f \u0646\u0648\u0628\u062a</h3><div class="dash-receipt-row"><span>\u0646\u0648\u0639 \u062e\u062f\u0645\u062a:</span><strong>' + service + '</strong></div><div class="dash-receipt-row"><span>\u067e\u0632\u0634\u06a9 \u0645\u0639\u0627\u0644\u062c:</span><strong>\u062f\u06a9\u062a\u0631 ' + doctor + '</strong></div><div class="dash-receipt-row"><span>\u062a\u0627\u0631\u06cc\u062e \u0648 \u0633\u0627\u0639\u062a:</span><strong>' + date + '</strong></div><div class="dash-receipt-row"><span>\u06a9\u062f \u067e\u06cc\u06af\u06cc\u0631\u06cc:</span><strong class="dash-receipt-tracking">' + tracking + '</strong></div></div>';
                document.body.appendChild(modal);
                requestAnimationFrame(function () { modal.classList.add('is-active'); });
                function close() { modal.classList.remove('is-active'); setTimeout(function () { modal.remove(); }, 300); }
                modal.querySelector('.dash-receipt-close').addEventListener('click', close);
                modal.querySelector('.dash-receipt-overlay').addEventListener('click', close);
            });
        });
    }

    /* ---- init ---- */
    function init() {
        initFilters();
        initSearch();
        initSort();
        fetchDashboard();
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
    else { init(); }
})();
