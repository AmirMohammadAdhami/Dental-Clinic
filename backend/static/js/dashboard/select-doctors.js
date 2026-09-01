/**
 * Dentura — Select Doctors Page (API-driven)
 * Doctor list (filtered by service, server-side sorting), 30-day Jalali
 * calendar with real availability states (تعطیل / پر / available),
 * slot selection and booking (POST /api/appointments/).
 *
 * Data sources:
 *   GET /api/doctors/?service=<slug>&sort=<rating|availability|experience>
 *   GET /api/doctors/<slug>/availability/?days=30
 *   POST /api/appointments/  {slot, service}
 */

(function () {
    'use strict';

    /* ================= CONFIG ================= */
    var serviceSlug = (function () {
        var parts = window.location.pathname.split('/').filter(Boolean);
        // /dashboard/select-doctors/<service>/
        var idx = parts.indexOf('select-doctors');
        return idx !== -1 && parts[idx + 1] ? decodeURIComponent(parts[idx + 1]) : '';
    })();

    var API = {
        doctors: '/api/doctors/',
        availability: function (slug) { return '/api/doctors/' + encodeURIComponent(slug) + '/availability/?days=30'; },
        createAppointment: '/api/appointments/'
    };

    var state = {
        sort: 'rating',
        availabilityData: null,     // response of availability API
        selectedDay: null,          // Date object (local midnight)
        selectedSlot: null          // selected slot object
    };

    /* ================= SMALL HELPERS ================= */
    function toFa(num) {
        var digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
        return String(num).replace(/\d/g, function (d) { return digits[d]; });
    }

    function faDecimal(str) {
        return String(str).replace('.', '٫');
    }

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.textContent = str == null ? '' : String(str);
        return div.innerHTML;
    }

    function getJSON(url) {
        return fetch(url, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            });
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

    /* ================= JALALI (PERSIAN) CALENDAR ================= */
    /* Accurate Gregorian -> Jalali conversion (jalaali algorithm). */
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
    // Indexed by JS getDay(): 0=Sunday ... 6=Saturday
    var DAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];

    function dayName(date) { return DAY_NAMES[date.getDay()]; }

    function jalaliLabel(date) {
        var pe = toJalali(date);
        return toFa(pe.day) + ' ' + JALALI_MONTHS[pe.month - 1];
    }


    /* ================= HEADER SCROLL EFFECT ================= */
    (function initHeaderScroll() {
        var header = document.querySelector('.dash-header');
        if (!header) return;
        var ticking = false;
        function onScroll() {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    header.classList.toggle('is-scrolled', window.scrollY > 30);
                    ticking = false;
                });
                ticking = true;
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    })();

    /* ================= DOCTOR LIST ================= */
    var grid = document.getElementById('doctorsGrid');
    var emptyEl = document.getElementById('doctorsEmpty');
    var errorEl = document.getElementById('doctorsError');

    // Assigned by the calendar-modal module below (it binds the book buttons
    // rendered by loadDoctors).
    var bindBookButtons = function () {};

    function availabilityBadgeText(doctor) {
        if (!doctor.first_available_at) return null;
        var now = new Date();
        var first = new Date(doctor.first_available_at);
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var firstDay = new Date(first.getFullYear(), first.getMonth(), first.getDate());
        var diffDays = Math.round((firstDay - today) / 86400000);
        var label = diffDays <= 0 ? 'امروز' : diffDays === 1 ? 'فردا' : toFa(diffDays) + ' روز دیگر';
        return 'اولین نوبت خالی: ' + label;
    }

    function doctorCardHTML(doctor) {
        var photo = (doctor.doctor_photos && doctor.doctor_photos.profile_photo) || '';
        var rating = doctor.rating ? Number(doctor.rating) : 0;
        var stars = '⭐'.repeat(Math.max(1, Math.min(5, Math.round(rating))));
        var badge = availabilityBadgeText(doctor);
        var badgeHTML = badge
            ? '<span class="sel-doctor-availability"><span class="sel-avail-dot"></span>' + escapeHTML(badge) + '</span>'
            : '<span class="sel-doctor-availability sel-doctor-availability--none"><span class="sel-avail-dot"></span>بدون نوبت خالی</span>';

        var h = '<div class="sel-doctor-card"'
            + ' data-slug="' + escapeHTML(doctor.slug) + '"'
            + ' data-rating="' + rating + '"'
            + ' data-experience="' + (doctor.years_of_experience || 0) + '">';
        h += '<div class="sel-doctor-img-wrap">';
        h += '<img width="513" height="768" src="' + escapeHTML(photo) + '" alt="'
            + escapeHTML(doctor.full_name) + '" class="sel-doctor-img" loading="lazy">';
        h += badgeHTML;
        h += '</div>';
        h += '<div class="sel-doctor-info">';
        h += '<h3 class="sel-doctor-name">' + escapeHTML(doctor.full_name) + '</h3>';
        h += '<p class="sel-doctor-specialty">' + escapeHTML(doctor.speciality) + '</p>';
        h += '<div class="sel-doctor-rating">';
        h += '<span class="sel-stars">' + stars + '</span>';
        h += '<span class="sel-rating-num">' + faDecimal(rating.toFixed(1)) + '</span>';
        h += '<span class="sel-review-count">از ' + toFa(doctor.review_count || 0) + ' نظر</span>';
        h += '</div>';
        h += '<div class="sel-doctor-exp"><span>🎓</span> ' + toFa(doctor.years_of_experience || 0) + '+ سال سابقه</div>';
        h += '</div>';
        h += '<div class="sel-doctor-actions">';
        h += '<a href="/doctors/' + encodeURIComponent(doctor.slug) + '/" class="btn btn-outline btn-sm sel-btn-profile">مشاهده پروفایل</a>';
        h += '<button class="btn btn-primary btn-sm sel-btn-book" data-doctor-slug="' + escapeHTML(doctor.slug) + '" data-doctor-name="' + escapeHTML(doctor.full_name) + '">انتخاب و مشاهده زمان‌ها ←</button>';
        h += '</div>';
        h += '</div>';
        return h;
    }

    function showGridState(which) {
        if (emptyEl) emptyEl.style.display = which === 'empty' ? '' : 'none';
        if (errorEl) errorEl.style.display = which === 'error' ? '' : 'none';
    }

    function loadDoctors() {
        showGridState('none');
        var url = API.doctors + '?service=' + encodeURIComponent(serviceSlug) + '&sort=' + encodeURIComponent(state.sort);
        return getJSON(url).then(function (data) {
            var items = data && data.results ? data.results : data;
            if (!grid) return;
            grid.querySelectorAll('.sel-doctor-card:not(.sel-skeleton-card)').forEach(function (c) { c.remove(); });
            var skeletons = grid.querySelectorAll('.sel-skeleton-card');
            skeletons.forEach(function (s) { s.remove(); });

            if (!items || !items.length) { showGridState('empty'); return; }

            var html = '';
            items.forEach(function (d) { html += doctorCardHTML(d); });
            grid.insertAdjacentHTML('beforeend', html);
            bindBookButtons();
        }).catch(function (err) {
            console.error('loadDoctors:', err);
            grid.querySelectorAll('.sel-skeleton-card').forEach(function (s) { s.remove(); });
            showGridState('error');
        });
    }

    /* ================= SORT PILLS (server-side) ================= */
    (function initFilters() {
        var pills = document.querySelectorAll('.sel-filter-pill');
        if (!pills.length) return;
        pills.forEach(function (pill) {
            pill.addEventListener('click', function () {
                if (this.classList.contains('sel-filter-pill--active')) return;
                pills.forEach(function (p) { p.classList.remove('sel-filter-pill--active'); });
                this.classList.add('sel-filter-pill--active');
                state.sort = this.getAttribute('data-sort') || 'rating';
                loadDoctors();
            });
        });
    })();

    (function initRetry() {
        var retry = document.getElementById('doctorsRetry');
        if (retry) retry.addEventListener('click', loadDoctors);
    })();


    /* ================= CALENDAR MODAL ================= */
    (function initCalendarModal() {
        var overlay = document.getElementById('calendarModal');
        var backdrop = document.getElementById('modalBackdrop');
        var closeBtn = document.getElementById('modalClose');
        var calStrip = document.getElementById('calStrip');
        var slotsSection = document.getElementById('slotsSection');
        var morningGroup = document.getElementById('morningGroup');
        var afternoonGroup = document.getElementById('afternoonGroup');
        var morningSlots = document.getElementById('morningSlots');
        var afternoonSlots = document.getElementById('afternoonSlots');
        var slotsEmpty = document.getElementById('slotsEmpty');
        var availabilityError = document.getElementById('availabilityError');
        var modalFooter = document.getElementById('modalFooter');
        var doctorNameEl = document.getElementById('modalDoctorName');
        var selectedDayText = document.getElementById('selectedDayText');
        var selectedTimeText = document.getElementById('selectedTimeText');
        var confirmBtn = document.getElementById('confirmSlotBtn');

        if (!overlay || !calStrip) return;

        var currentDoctor = { slug: '', name: '' };

        function resetSelection() {
            state.selectedDay = null;
            state.selectedSlot = null;
            if (modalFooter) modalFooter.style.display = 'none';
            if (slotsSection) slotsSection.style.display = 'none';
            if (availabilityError) availabilityError.style.display = 'none';
        }

        /* ---- Day strip (30 days, Jalali) ---- */
        function buildCalendar() {
            calStrip.innerHTML = '';
            var days = (state.availabilityData && state.availabilityData.days) || [];
            var today = new Date();
            today.setHours(0, 0, 0, 0);

            days.forEach(function (day, i) {
                var date = new Date(today);
                date.setDate(today.getDate() + i);

                var pe = toJalali(date);
                var isSelectable = day.status === 'available';

                var card = document.createElement('div');
                card.className = 'sel-cal-card' + (isSelectable ? '' : ' sel-cal-card--disabled');
                card.setAttribute('data-index', i);

                var dayNum = document.createElement('span');
                dayNum.className = 'sel-cal-day-num';
                dayNum.textContent = toFa(pe.day);

                var dayLabel = document.createElement('span');
                dayLabel.className = 'sel-cal-day-label';
                dayLabel.textContent = i === 0 ? 'امروز' : i === 1 ? 'فردا' : dayName(date);

                var monthLabel = document.createElement('span');
                monthLabel.className = 'sel-cal-month-label';
                monthLabel.textContent = JALALI_MONTHS[pe.month - 1];

                card.appendChild(dayLabel);
                card.appendChild(dayNum);
                card.appendChild(monthLabel);

                if (day.status === 'closed') {
                    var closedBadge = document.createElement('span');
                    closedBadge.className = 'sel-cal-badge sel-cal-badge--closed';
                    closedBadge.textContent = 'تعطیل';
                    card.appendChild(closedBadge);
                } else if (day.status === 'full') {
                    var fullBadge = document.createElement('span');
                    fullBadge.className = 'sel-cal-badge sel-cal-badge--full';
                    fullBadge.textContent = 'پر';
                    card.appendChild(fullBadge);
                }

                if (isSelectable) {
                    card.addEventListener('click', function () {
                        calStrip.querySelectorAll('.sel-cal-card').forEach(function (c) {
                            c.classList.remove('sel-cal-card--active');
                        });
                        card.classList.add('sel-cal-card--active');
                        state.selectedDay = date;
                        showTimeSlots(day);
                    });
                }

                calStrip.appendChild(card);
            });
        }


        /* ---- Time slots for a selected day ---- */
        function slotButtonHTML(slot) {
            var price = (state.availabilityData && state.availabilityData.deposit_price) || 0;
            var priceText = toFa(Number(price).toLocaleString('en-US')) + ' تومان بیعانه';
            var disabled = slot.is_booked ? ' sel-slot-btn--disabled' : '';
            var dis = slot.is_booked ? ' disabled' : '';
            return '<button type="button" class="sel-slot-btn' + disabled + '"' + dis
                + ' data-slot-id="' + slot.id + '"'
                + ' data-slot-time="' + escapeHTML(slot.time) + '">'
                + '<span class="sel-slot-time">' + toFa(slot.time) + '</span>'
                + '<span class="sel-slot-price">' + priceText + '</span>'
                + '</button>';
        }

        function showTimeSlots(day) {
            if (!slotsSection) return;
            slotsSection.style.display = '';
            if (slotsEmpty) slotsEmpty.style.display = 'none';
            if (modalFooter) modalFooter.style.display = 'none';
            state.selectedSlot = null;

            var morning = '';
            var afternoon = '';
            (day.slots || []).forEach(function (slot) {
                var hour = parseInt(slot.time.split(':')[0], 10);
                if (hour < 12) morning += slotButtonHTML(slot);
                else afternoon += slotButtonHTML(slot);
            });

            if (morningGroup) morningGroup.style.display = morning ? '' : 'none';
            if (afternoonGroup) afternoonGroup.style.display = afternoon ? '' : 'none';
            if (morningSlots) morningSlots.innerHTML = morning;
            if (afternoonSlots) afternoonSlots.innerHTML = afternoon;
            if (!morning && !afternoon && slotsEmpty) slotsEmpty.style.display = '';

            slotsSection.querySelectorAll('.sel-slot-btn:not(.sel-slot-btn--disabled)').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    slotsSection.querySelectorAll('.sel-slot-btn').forEach(function (s) {
                        s.classList.remove('sel-slot-btn--active');
                    });
                    btn.classList.add('sel-slot-btn--active');
                    var slotId = parseInt(btn.getAttribute('data-slot-id'), 10);
                    var slotTime = btn.getAttribute('data-slot-time');
                    state.selectedSlot = { id: slotId, time: slotTime };
                    updateFooter();
                });
            });
        }

        function updateFooter() {
            if (!state.selectedDay || !state.selectedSlot || !modalFooter) {
                if (modalFooter) modalFooter.style.display = 'none';
                return;
            }
            modalFooter.style.display = '';
            if (selectedDayText) selectedDayText.textContent = dayName(state.selectedDay) + ' ' + jalaliLabel(state.selectedDay);
            if (selectedTimeText) selectedTimeText.textContent = 'ساعت ' + toFa(state.selectedSlot.time);
        }

        /* ---- Load availability from API ---- */
        function loadAvailability() {
            resetSelection();
            if (calStrip) calStrip.innerHTML = '';
            if (slotsSection) slotsSection.style.display = 'none';
            if (availabilityError) availabilityError.style.display = 'none';

            return getJSON(API.availability(currentDoctor.slug)).then(function (data) {
                state.availabilityData = data;
                buildCalendar();
            }).catch(function (err) {
                console.error('loadAvailability:', err);
                if (availabilityError) availabilityError.style.display = '';
            });
        }


        /* ---- Confirm (Plan B): create PENDING appointment ---- */
        function confirmBooking() {
            if (!state.selectedSlot || !confirmBtn) return;
            var originalHTML = confirmBtn.innerHTML;
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = 'در حال ثبت نوبت...';

            fetch(API.createAppointment, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({
                    slot: state.selectedSlot.id,
                    service: serviceSlug
                })
            }).then(function (r) {
                return r.json().then(function (data) { return { ok: r.ok, data: data }; });
            }).then(function (res) {
                if (res.ok && res.data.tracking_code) {
                    window.location.href = '/dashboard/finalize_information/' + encodeURIComponent(res.data.tracking_code);
                    return;
                }
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = originalHTML;
                if (availabilityError) {
                    var msg = res.data && (res.data.slot || res.data.detail || res.data.service);
                    availabilityError.textContent = msg || 'خطا در ثبت نوبت. لطفاً دوباره تلاش کنید.';
                    availabilityError.style.display = '';
                }
                loadAvailability(); // refresh (e.g. slot was just taken)
            }).catch(function (err) {
                console.error('confirmBooking:', err);
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = originalHTML;
                if (availabilityError) {
                    availabilityError.textContent = 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.';
                    availabilityError.style.display = '';
                }
            });
        }

        if (confirmBtn) confirmBtn.addEventListener('click', confirmBooking);

        /* ---- Open / close ---- */
        bindBookButtons = function () {
            document.querySelectorAll('.sel-btn-book').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    currentDoctor.slug = this.getAttribute('data-doctor-slug') || '';
                    currentDoctor.name = this.getAttribute('data-doctor-name') || '';
                    if (doctorNameEl) {
                        doctorNameEl.textContent = 'دکتر ' + currentDoctor.name.replace(/^دکتر\s*/, '');
                    }
                    loadAvailability();
                    overlay.classList.add('sel-modal-open');
                    document.body.style.overflow = 'hidden';
                });
            });
        }

        function closeModal() {
            overlay.classList.remove('sel-modal-open');
            document.body.style.overflow = '';
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('sel-modal-open')) {
                closeModal();
            }
        });
    })();

    /* ================= INIT ================= */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDoctors);
    } else {
        loadDoctors();
    }
})();
