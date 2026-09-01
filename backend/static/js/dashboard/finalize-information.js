/**
 * Dentura — Finalize Information Page (API-driven)
 * GET/PATCH /api/appointments/<tracking_code>/
 *
 * - Booking mode: for myself (prefilled, readonly, identity stays on the
 *   user account) vs for someone else (editable, saved on the appointment).
 * - Medical history chips synced with MedicalRecord via the API.
 * - Additional notes synced with Appointment.additional_notes.
 * - 30-minute reservation timer: starts when the page loads; on expiry the
 *   slot is released automatically and the user is sent back.
 * - Confirm: PATCH -> status PENDING -> RESERVED (success panel on page).
 */

(function () {
    'use strict';

    /* ================= CONFIG ================= */
    var trackingCode = (function () {
        var parts = window.location.pathname.split('/').filter(Boolean);
        var idx = parts.indexOf('finalize_information');
        return idx !== -1 && parts[idx + 1] ? decodeURIComponent(parts[idx + 1]) : '';
    })();

    var API = {
        detail: '/api/appointments/' + encodeURIComponent(trackingCode) + '/'
    };

    var state = {
        appointment: null,
        bookingFor: 'self',
        selectedRecordIds: []
    };

    /* ================= HELPERS ================= */
    function toFa(num) {
        var digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/\d/g, function (d) { return digits[d]; });
    }

    function faDecimal(str) { return String(str).replace('.', '٫'); }

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    function getCSRFToken() {
        var name = 'csrftoken';
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i].trim();
            if (c.substring(0, name.length + 1) === (name + '=')) {
                return decodeURIComponent(c.substring(name.length + 1));
            }
        }
        return '';
    }

    function getJSON(url) {
        return fetch(url, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
            .then(function (r) {
                return r.json().then(function (data) { return { ok: r.ok, data: data }; });
            });
    }

    /* Accurate Gregorian -> Jalali (jalaali algorithm) */
    var div = function (a, b) { return ~~(a / b); };
    var mod = function (a, b) { return a - ~~(a / b) * b; };

    function jalCal(jy) {
        var breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
            1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
        var bl = breaks.length, gy = jy + 621, leapJ = -14, jp = breaks[0], jm, jump = 0, leap, n, i;
        for (i = 1; i < bl; i += 1) {
            jm = breaks[i];
            jump = jm - jp;
            if (jy < jm) break;
            leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
            jp = jm;
        }
        n = jy - jp;
        leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
        if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
        var leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
        var march = 20 + leapJ - leapG;
        if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
        leap = mod(mod(n + 1, 33) - 1, 4);
        if (leap === -1) leap = 4;
        return { leap: leap, gy: gy, march: march };
    }

    function g2d(gy, gm, gd) {
        var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4)
            + div(153 * mod(gm + 9, 12) + 2, 5)
            + gd - 34840408;
        d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
        return d;
    }

    function d2g(jdn) {
        var j, i, gd, gm, gy;
        j = 4 * jdn + 139361631;
        j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
        i = div(mod(j, 1461), 4) * 5 + 308;
        gd = div(mod(i, 153), 5) + 1;
        gm = mod(div(i, 153), 12) + 1;
        gy = div(j, 1461) - 100100 + div(8 - gm, 6);
        return { gy: gy, gm: gm, gd: gd };
    }

    function toJalali(date) {
        var gy = date.getFullYear(), gm = date.getMonth() + 1, gd = date.getDate();
        var jdn = g2d(gy, gm, gd);
        var gy2 = d2g(jdn).gy;
        var jy = gy2 - 621;
        var r = jalCal(jy);
        var jdn1f = g2d(gy2, 3, r.march);
        var k = jdn - jdn1f, jm, jd;
        if (k >= 0) {
            if (k <= 185) {
                jm = 1 + div(k, 31);
                jd = mod(k, 31) + 1;
                return { year: jy, month: jm, day: jd };
            }
            k -= 186;
        } else {
            jy -= 1;
            k += 179;
            if (r.leap === 1) k += 1;
        }
        jm = 7 + div(k, 30);
        jd = mod(k, 30) + 1;
        return { year: jy, month: jm, day: jd };
    }

    var JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    var DAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

    function jalaliLabel(date) {
        var pe = toJalali(date);
        return DAY_NAMES[date.getDay()] + ' ' + toFa(pe.day) + ' ' + JALALI_MONTHS[pe.month - 1];
    }

    function timeLabel(date) {
        var h = String(date.getHours()).padStart(2, '0');
        var m = String(date.getMinutes()).padStart(2, '0');
        return toFa(h + ':' + m);
    }


    /* ================= DOM REFS ================= */
    var timerBar = document.getElementById('fiTimerBar');
    var timerCount = document.getElementById('fiTimerCount');
    var errorBar = document.getElementById('fiErrorBar');
    var backLink = document.getElementById('fiBackLink');
    var firstNameInput = document.getElementById('fiFirstName');
    var lastNameInput = document.getElementById('fiLastName');
    var nationalCodeInput = document.getElementById('fiNationalCode');
    var chipsWrap = document.getElementById('fiChips');
    var notesInput = document.getElementById('fiNotes');
    var notesCounter = document.getElementById('fiNotesCount');
    var summaryPhoto = document.getElementById('fiSummaryPhoto');
    var summaryDoctor = document.getElementById('fiSummaryDoctor');
    var summarySpeciality = document.getElementById('fiSummarySpeciality');
    var summaryDate = document.getElementById('fiSummaryDate');
    var summaryService = document.getElementById('fiSummaryService');
    var summaryDay = document.getElementById('fiSummaryDay');
    var summaryPrice = document.getElementById('fiSummaryPrice');
    var ctaWrap = document.getElementById('fiCtaWrap');
    var successPanel = document.getElementById('fiSuccessPanel');
    var successTracking = document.getElementById('fiSuccessTracking');
    var switchBtns = document.querySelectorAll('.fi-switch-btn');

    function showError(msg) {
        if (!errorBar) return;
        var span = document.getElementById('fiErrorText');
        if (span && msg) span.textContent = msg;
        errorBar.style.display = '';
    }

    /* ================= RENDER ================= */
    function renderSummary(data) {
        var dt = data.appointment_date ? new Date(data.appointment_date) : null;
        if (summaryPhoto && data.doctor.photo) summaryPhoto.src = data.doctor.photo;
        if (summaryDoctor) summaryDoctor.textContent = 'دکتر ' + (data.doctor.name || '').replace(/^دکتر\s*/, '');
        if (summarySpeciality) summarySpeciality.textContent = data.doctor.speciality || '';
        if (summaryService) summaryService.textContent = data.service || '';
        if (summaryPrice) summaryPrice.textContent = toFa(Number(data.price || data.deposit_price).toLocaleString('en-US')) + ' تومان';
        if (dt) {
            if (summaryDate) summaryDate.textContent = jalaliLabel(dt) + ' — ساعت ' + timeLabel(dt);
            var today = new Date(); today.setHours(0, 0, 0, 0);
            var day0 = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
            var diff = Math.round((day0 - today) / 86400000);
            if (summaryDay) summaryDay.textContent = diff <= 0 ? 'امروز' : diff === 1 ? 'فردا' : toFa(diff) + ' روز دیگر';
        }
        if (data.service_slug && backLink) {
            backLink.href = '/dashboard/select-doctors/' + encodeURIComponent(data.service_slug);
        }
    }

    function renderPatientFields() {
        var p = state.bookingFor === 'self'
            ? state.appointment.patient
            : state.appointment.other_patient;

        if (firstNameInput) firstNameInput.value = p.first_name || '';
        if (lastNameInput) lastNameInput.value = p.last_name || '';
        if (nationalCodeInput) nationalCodeInput.value = p.national_code || '';

        var readOnly = state.bookingFor === 'self';
        [firstNameInput, lastNameInput, nationalCodeInput].forEach(function (input) {
            if (!input) return;
            input.readOnly = readOnly;
            input.classList.toggle('fi-form-input--read-only', readOnly);
        });
    }

    function renderChips() {
        if (!chipsWrap) return;
        var html = '';
        (state.appointment.medical_records || []).forEach(function (record) {
            var selected = state.selectedRecordIds.indexOf(record.id) !== -1;
            html += '<button type="button" class="fi-chip' + (selected ? ' fi-chip--active' : '') + '"'
                + ' data-record-id="' + record.id + '" aria-pressed="' + selected + '">'
                + '<span class="fi-chip-check">'
                + '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
                + '</span>'
                + escapeHTML(record.description)
                + '</button>';
        });
        chipsWrap.innerHTML = html;

        chipsWrap.querySelectorAll('.fi-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                var id = parseInt(this.getAttribute('data-record-id'), 10);
                var idx = state.selectedRecordIds.indexOf(id);
                if (idx === -1) {
                    state.selectedRecordIds.push(id);
                    this.classList.add('fi-chip--active');
                    this.setAttribute('aria-pressed', 'true');
                } else {
                    state.selectedRecordIds.splice(idx, 1);
                    this.classList.remove('fi-chip--active');
                    this.setAttribute('aria-pressed', 'false');
                }
            });
        });
    }

    /* ================= 30-MINUTE COUNTDOWN ================= */
    var countdownHandle = null;

    function onReservationExpired() {
        showError('زمان رزرو به پایان رسید و نوبت آزاد شد. لطفاً نوبت دیگری انتخاب کنید.');
        if (timerBar) timerBar.style.display = 'none';
        if (ctaWrap) ctaWrap.style.display = 'none';
    }

    function startCountdown(expiresAt) {
        if (!timerBar || !timerCount) return;
        clearInterval(countdownHandle);

        function tick() {
            var remaining = new Date(expiresAt).getTime() - Date.now();
            if (remaining <= 0) {
                clearInterval(countdownHandle);
                onReservationExpired();
                return;
            }
            var totalSec = Math.floor(remaining / 1000);
            var mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
            var ss = String(totalSec % 60).padStart(2, '0');
            timerCount.textContent = toFa(mm + ':' + ss);
        }

        timerBar.style.display = '';
        tick();
        countdownHandle = setInterval(tick, 1000);
    }


    /* ================= BOOKING SWITCH (self / other) ================= */
    function initBookingSwitch() {
        if (!switchBtns.length) return;
        switchBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchBtns.forEach(function (b) {
                    b.classList.remove('fi-switch-btn--active');
                    b.setAttribute('aria-checked', 'false');
                });
                this.classList.add('fi-switch-btn--active');
                this.setAttribute('aria-checked', 'true');
                state.bookingFor = this.getAttribute('data-booking') || 'self';
                renderPatientFields();
                if (state.bookingFor === 'other' && firstNameInput) firstNameInput.focus();
            });
        });
    }

    /* ================= NOTES COUNTER ================= */
    function initNotesCounter() {
        if (!notesInput || !notesCounter) return;
        notesInput.addEventListener('input', function () {
            notesCounter.textContent = toFa(this.value.length);
        });
    }

    /* ================= CONFIRM (PATCH) ================= */
    function confirmReservation() {
        var confirmBtns = document.querySelectorAll('.fi-confirm-btn');
        var original = [];
        confirmBtns.forEach(function (b) { original.push(b.innerHTML); });

        // Client-side validation for "other" mode
        if (state.bookingFor === 'other') {
            var missing = false;
            [firstNameInput, lastNameInput, nationalCodeInput].forEach(function (input) {
                if (input && !input.value.trim()) {
                    input.style.borderColor = '#ef4444';
                    input.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.15)';
                    missing = true;
                    setTimeout(function () {
                        input.style.borderColor = '';
                        input.style.boxShadow = '';
                    }, 2000);
                }
            });
            if (missing) return;
        }

        confirmBtns.forEach(function (b) {
            b.style.pointerEvents = 'none';
            b.innerHTML = 'در حال ثبت رزرو...';
        });

        var payload = {
            booking_for: state.bookingFor,
            additional_notes: notesInput ? notesInput.value : '',
            medical_record_ids: state.selectedRecordIds
        };
        if (state.bookingFor === 'other') {
            payload.first_name = firstNameInput ? firstNameInput.value.trim() : '';
            payload.last_name = lastNameInput ? lastNameInput.value.trim() : '';
            payload.national_code = nationalCodeInput ? nationalCodeInput.value.trim() : '';
        }
fetch(API.detail, {
            method: 'PATCH',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(payload)
        }).then(function (r) {
            return r.json().then(function (data) { return { ok: r.ok, status: r.status, data: data }; });
        }).then(function (res) {
            if (res.ok) {
                // Confirmed: stay on the page and show the success state.
                state.appointment = res.data;
                if (timerBar) timerBar.style.display = 'none';
                if (ctaWrap) ctaWrap.style.display = 'none';
                if (successPanel) successPanel.style.display = '';
                if (successTracking) successTracking.textContent = toFa(res.data.tracking_code || trackingCode);
                confirmBtns.forEach(function (b) { b.style.pointerEvents = ''; b.innerHTML = original[0]; });
                return;
            }
            confirmBtns.forEach(function (b, i) {
                b.style.pointerEvents = '';
                b.innerHTML = original[i];
            });
            if (res.status === 409) {
                showError(typeof res.data.detail === 'string' ? res.data.detail : 'زمان رزرو به پایان رسید.');
                if (timerBar) timerBar.style.display = 'none';
                if (ctaWrap) ctaWrap.style.display = 'none';
            } else if (res.data && res.data.booking_for) {
                showError('برای رزرو برای دیگری، نام، نام خانوادگی و کد ملی الزامی است.');
            } else {
                var msg = (res.data && (res.data.detail || res.data.first_name || res.data.last_name || res.data.national_code));
                showError(typeof msg === 'string' ? msg : 'خطا در ثبت رزرو. دوباره تلاش کنید.');
            }
        }).catch(function (err) {
            console.error('confirmReservation:', err);
            confirmBtns.forEach(function (b, i) {
                b.style.pointerEvents = '';
                b.innerHTML = original[i];
            });
            showError('خطا در ارتباط با سرور. دوباره تلاش کنید.');
        });
    }

    function initConfirmButtons() {
        document.querySelectorAll('.fi-confirm-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                confirmReservation();
            });
        });
    }

    /* ================= LOAD ================= */
    function loadAppointment() {
        getJSON(API.detail).then(function (res) {
            if (!res.ok) {
                showError((res.data && res.data.detail) || 'نوبت مورد نظر یافت نشد یا به حساب شما تعلق ندارد.');
                return;
            }
            var data = res.data;
            state.appointment = data;

            if (data.status === 'PENDING' && data.expires_at) {
                // 30-minute timer starts (restarts) with this page load.
                startCountdown(data.expires_at);
            } else if (data.status === 'RESERVED') {
                // Already confirmed: show success panel.
                if (ctaWrap) ctaWrap.style.display = 'none';
                if (successPanel) {
                    successPanel.style.display = '';
                    if (successTracking) successTracking.textContent = toFa(data.tracking_code);
                }
            } else {
                showError('این نوبت دیگر معتبر نیست. لطفاً نوبت دیگری انتخاب کنید.');
                if (ctaWrap) ctaWrap.style.display = 'none';
                return;
            }

            state.bookingFor = data.booking_for === 'other' ? 'other' : 'self';
            switchBtns.forEach(function (b) {
                var active = (b.getAttribute('data-booking') === state.bookingFor);
                b.classList.toggle('fi-switch-btn--active', active);
                b.setAttribute('aria-checked', active ? 'true' : 'false');
            });

            renderSummary(data);
            renderPatientFields();

            state.selectedRecordIds = (data.medical_records || [])
                .filter(function (r) { return r.selected; })
                .map(function (r) { return r.id; });
            renderChips();

            if (notesInput) {
                notesInput.value = data.additional_notes || '';
                if (notesCounter) notesCounter.textContent = toFa((data.additional_notes || '').length);
            }
        }).catch(function (err) {
            console.error('loadAppointment:', err);
            showError('خطا در ارتباط با سرور.');
        });
    }

    /* ================= INIT ================= */
    function init() {
        initBookingSwitch();
        initNotesCounter();
        initConfirmButtons();
        loadAppointment();
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); }
    else { init(); }
})();
