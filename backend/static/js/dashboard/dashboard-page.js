/**
 * Dentura — Dashboard Page
 * Fetches dashboard data, renders services, gallery, past appointments.
 * Service icons come from the API (Service.icon / Appointment.service_icon).
 */
(function () {
    'use strict';

    var API_DASHBOARD = '/api/dashboard/me/';
    var API_SERVICES = '/api/services/';
    var R = window.DenturaReview;

    function getServiceSlug(serviceName) {
        if (!serviceName) return 'beauty';
        var map = { '\u0627\u06cc\u0645\u067e\u0644\u0646\u062a': 'implant', '\u0632\u06cc\u0628\u0627\u06cc\u06cc': 'beauty', '\u0644\u0645\u06cc\u0646\u062a': 'laminate', '\u0639\u0635\u0628\u200c\u06a9\u0634\u06cc': 'root-canal', '\u06a9\u0648\u062f\u06a9\u0627\u0646': 'kids', '\u062c\u0631\u0645\u200c\u06af\u06cc\u0631\u06cc': 'cleaning' };
        for (var key in map) { if (serviceName.indexOf(key) !== -1) return map[key]; }
        return 'beauty';
    }

    function renderNextAppointment(appointments) {
        var reserved = appointments.filter(function (a) { return a.status === 'RESERVED'; });
        if (!reserved.length) return;
        var next = reserved[0];
        var section = document.getElementById('next-appointment');
        section.style.display = '';
        document.getElementById('next-doc-name').textContent = '\u062f\u06a9\u062a\u0631 ' + (next.doctor_name || '');
        document.getElementById('next-service-name').textContent = next.service_name;
        document.getElementById('next-date').textContent = R.jalaliDate(next.appointment_date || next.created_at);
        if (next.tracking_code) {
            document.getElementById('next-receipt-link').href = '/dashboard/appointment/' + next.tracking_code;
        }
    }

    function renderServices(services) {
        var grid = document.getElementById('services-grid');
        if (!services.length) return;
        var slugNames = { 'implant': 'implant', 'beauty': 'beauty', 'laminate': 'laminate', 'root-canal': 'root-canal', 'kids': 'kids', 'cleaning': 'cleaning' };
        var html = '';
        services.forEach(function (s) {
            var slug = s.slug || slugNames[s.name] || s.name || 'beauty';
            var iconSrc = s.icon || '';
            var badgeHTML = s.badge ? '<span class="dash-service-badge dash-service-badge--special">' + R.escapeHTML(s.badge) + '</span>' : '';
            html += '<a href="/dashboard/select-doctors/' + slug + '" class="dash-service-card">' + badgeHTML +
                '<div class="dash-service-icon"><img width="1795" height="576" src="' + iconSrc + '" alt="' + R.escapeHTML(s.name) + '"></div>' +
                '<h3 class="dash-service-title">' + R.escapeHTML(s.name) + '</h3>' +
                '<p class="dash-service-desc">' + R.escapeHTML(s.description || '') + '</p>' +
                '<span class="dash-service-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span></a>';
        });
        grid.innerHTML = html;
    }

    function renderGallery(galleryItems) {
        if (!galleryItems.length) return;
        var section = document.getElementById('gallery-section');
        section.style.display = '';
        var grid = document.getElementById('gallery-grid');
        var html = '';
        galleryItems.forEach(function (item) {
            html += '<div class="dash-img-card">' +
                '<div class="dash-img-card-img" data-ba tabindex="0" role="slider" aria-label="\u0645\u0642\u0627\u06cc\u0633\u0647 \u0642\u0628\u0644 \u0648 \u0628\u0639\u062f ' + R.escapeHTML(item.service_name) + '">' +
                '<img class="ba-img ba-after" width="1408" height="768" src="' + item.after_image + '" alt="' + R.escapeHTML(item.service_name) + ' - \u0628\u0639\u062f">' +
                '<img class="ba-img ba-before" width="1408" height="768" src="' + item.before_image + '" alt="' + R.escapeHTML(item.service_name) + ' - \u0642\u0628\u0644">' +
                '<div class="ba-slider"><div class="ba-handle"></div></div>' +
                '<span class="ba-label ba-label-before">\u0642\u0628\u0644</span>' +
                '<span class="ba-label ba-label-after">\u0628\u0639\u062f</span>' +
                '<span class="dash-img-badge">' + R.escapeHTML(item.service_name) + '</span>' +
                '<button class="dash-img-action dash-img-download" data-src="' + item.after_image + '" aria-label="\u062f\u0627\u0646\u0644\u0648\u062f \u062a\u0635\u0648\u06cc\u0631">' +
                '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                '</button>' +
                '</div>' +
                '<div class="dash-img-card-info">' +
                '<span class="dash-img-card-doctor">' + R.escapeHTML(item.doctor_name) + '</span>' +
                '<span class="dash-img-card-date">' + R.jalaliDate(item.created_at) + '</span>' +
                '</div></div>';
        });
        grid.innerHTML = html;
    }

    function renderPastAppointments(appointments) {
        var past = appointments.filter(function (a) { return a.status === 'DONE' || a.status === 'CANCELLED'; });
        if (!past.length) return;
        var section = document.getElementById('past-section');
        section.style.display = '';
        var list = document.getElementById('past-list');
        var html = '';
        past.forEach(function (item) {
            var slug = getServiceSlug(item.service_name);
            var iconSrc = item.service_icon || '';
            html += '<div class="dash-past-card">' +
                '<div class="dash-past-right">' +
                '<div class="dash-past-icon dash-past-icon--' + slug + '"><img width="1795" height="576" src="' + iconSrc + '" alt="' + R.escapeHTML(item.service_name) + '"></div>' +
                '<div class="dash-past-details"><strong>' + R.escapeHTML(item.service_name) + '</strong><span>' + R.escapeHTML(item.doctor_name) + '</span></div>' +
                '</div>' +
                '<div class="dash-past-center">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
                '<span>' + R.jalaliDate(item.appointment_date || item.created_at) + '</span>' +
                '</div>' +
                '<div class="dash-past-left">' +
                (item.prescription_file ? '<a href="' + item.prescription_file + '" class="dash-past-btn dash-past-btn--download" download><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>\u062f\u0627\u0646\u0644\u0648\u062f \u0646\u0633\u062e\u0647</a>' : '') +
                '<a href="/dashboard/appointment/' + item.tracking_code + '" class="dash-past-btn dash-past-btn--view"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>\u0645\u0634\u0627\u0647\u062f\u0647 \u0631\u0633\u06cc\u062f</a>' +
                (item.status === 'DONE' ? (item.review_status === 'APPROVED' && item.review_data ? '<a href="#" class="dash-past-btn dash-past-btn--review" data-review-json="' + R.escapeAttr(JSON.stringify(item.review_data)) + '" data-doctor="' + R.escapeHTML(item.doctor_name) + '" data-service="' + R.escapeHTML(item.service_name) + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>\u0645\u0634\u0627\u0647\u062f\u0647 \u0646\u0638\u0631</a>' : item.review_status === 'PENDING' ? '<span class="dash-past-btn dash-past-btn--review-pending"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>\u062f\u0631 \u0627\u0646\u062a\u0638\u0627\u0631 \u062a\u0627\u06cc\u06cc\u062f</span>' : '<button class="dash-past-btn dash-past-btn--review" data-apt-id="' + (item.id || '') + '" data-doctor="' + R.escapeHTML(item.doctor_name) + '" data-service="' + R.escapeHTML(item.service_name) + '"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>\u0646\u0648\u0634\u062a\u0646 \u0646\u0638\u0631</button>') : '') +
                '</div></div>';
        });
        list.innerHTML = html;
    }

    Promise.all([
        fetch(API_DASHBOARD, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; }),
        fetch(API_SERVICES, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : null; })
    ]).then(function (results) {
        var dashData = results[0];
        var servicesData = results[1];
        if (dashData) {
            try { renderNextAppointment(dashData.appointments || []); } catch (e) { console.error('renderNextAppointment:', e); }
            try { renderGallery(dashData.gallery || []); } catch (e) { console.error('renderGallery:', e); }
            try { renderPastAppointments(dashData.appointments || []); } catch (e) { console.error('renderPastAppointments:', e); }
        }
        var svcRaw = servicesData;
        if (svcRaw && svcRaw.results) svcRaw = svcRaw.results;
        var servicesList = (svcRaw && Array.isArray(svcRaw)) ? svcRaw : (dashData && dashData.services ? dashData.services : []);
        try { renderServices(servicesList); } catch (e) { console.error('renderServices:', e); }
    })
        .then(function () {
            if (R && R.bindAll) R.bindAll();

            document.querySelectorAll('[data-ba]').forEach(function (card) {
                if (card._baInit) return;
                card._baInit = true;
                var beforeImg = card.querySelector('.ba-before');
                var sliderLine = card.querySelector('.ba-slider');
                var labelBefore = card.querySelector('.ba-label-before');
                var labelAfter = card.querySelector('.ba-label-after');
                if (!beforeImg) return;
                var isDragging = false;
                var currentPct = 50;
                function setPosition(pct) {
                    currentPct = Math.max(0, Math.min(100, pct));
                    beforeImg.style.clipPath = 'inset(0 ' + (100 - currentPct) + '% 0 0)';
                    if (sliderLine) sliderLine.style.left = currentPct + '%';
                    if (labelBefore) labelBefore.style.opacity = currentPct > 20 ? '1' : '0';
                    if (labelAfter) labelAfter.style.opacity = currentPct < 80 ? '1' : '0';
                    card.setAttribute('aria-valuenow', Math.round(currentPct));
                }
                function updateFromPointer(x) {
                    var rect = card.getBoundingClientRect();
                    var pos = (x - rect.left) / rect.width;
                    setPosition(pos * 100);
                }
                card.addEventListener('mousedown', function (e) { isDragging = true; updateFromPointer(e.clientX); });
                card.addEventListener('touchstart', function (e) { isDragging = true; updateFromPointer(e.touches[0].clientX); }, { passive: true });
                window.addEventListener('mousemove', function (e) { if (isDragging) updateFromPointer(e.clientX); });
                window.addEventListener('touchmove', function (e) { if (isDragging) updateFromPointer(e.touches[0].clientX); }, { passive: true });
                window.addEventListener('mouseup', function () { isDragging = false; });
                window.addEventListener('touchend', function () { isDragging = false; });
                setPosition(50);
            });
        })
        .catch(function (err) { console.error('Dashboard page error:', err); });
})();
