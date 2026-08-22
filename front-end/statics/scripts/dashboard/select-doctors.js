/**
 * Dentura — Select Doctors Page Interactions
 * Sorting, calendar modal, time-slot selection.
 */

(function () {
    'use strict';

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

    /* ================= TOOLTIP BEHAVIOR ================= */
    (function initTooltips() {
        var icons = document.querySelectorAll('.dash-nav-icon[data-tooltip]');
        if (!icons.length) return;
        icons.forEach(function (icon) {
            icon.addEventListener('mouseenter', function () { this.classList.add('tooltip-visible'); });
            icon.addEventListener('mouseleave', function () { this.classList.remove('tooltip-visible'); });
            icon.addEventListener('click', function (e) {
                var isVisible = this.classList.contains('tooltip-visible');
                icons.forEach(function (other) { if (other !== icon) other.classList.remove('tooltip-visible'); });
                if (!isVisible && window.innerWidth <= 620) { e.preventDefault(); this.classList.add('tooltip-visible'); }
            });
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.dash-nav-icon')) {
                icons.forEach(function (icon) { icon.classList.remove('tooltip-visible'); });
            }
        });
    })();

    /* ================= FILTER / SORT ================= */
    (function initFilters() {
        var pills = document.querySelectorAll('.sel-filter-pill');
        var cards = document.querySelectorAll('.sel-doctor-card');
        if (!pills.length || !cards.length) return;

        pills.forEach(function (pill) {
            pill.addEventListener('click', function () {
                pills.forEach(function (p) { p.classList.remove('sel-filter-pill--active'); });
                this.classList.add('sel-filter-pill--active');

                var sortBy = this.getAttribute('data-sort');
                var arr = Array.prototype.slice.call(cards);

                arr.sort(function (a, b) {
                    var aVal = parseFloat(a.getAttribute('data-' + sortBy) || '0');
                    var bVal = parseFloat(b.getAttribute('data-' + sortBy) || '0');
                    if (sortBy === 'experience') return bVal - aVal;
                    if (sortBy === 'availability') return aVal - bVal;
                    return bVal - aVal; // rating
                });

                var grid = cards[0].parentNode;
                arr.forEach(function (card) { grid.appendChild(card); });
            });
        });
    })();

    /* ================= CALENDAR MODAL ================= */
    (function initCalendarModal() {
        var overlay = document.getElementById('calendarModal');
        var backdrop = document.getElementById('modalBackdrop');
        var panel = document.getElementById('modalPanel');
        var closeBtn = document.getElementById('modalClose');
        var calStrip = document.getElementById('calStrip');
        var slotsSection = document.getElementById('slotsSection');
        var morningSlots = document.getElementById('morningSlots');
        var afternoonSlots = document.getElementById('afternoonSlots');
        var modalFooter = document.getElementById('modalFooter');
        var doctorNameEl = document.getElementById('modalDoctorName');
        var selectedDayText = document.getElementById('selectedDayText');
        var selectedTimeText = document.getElementById('selectedTimeText');

        if (!overlay || !calStrip) return;

        var bookBtns = document.querySelectorAll('.sel-btn-book');
        var selectedDay = null;
        var selectedTime = null;

        // Weekend days in JS: 5=Friday, 6=Saturday (Iranian weekend)
        var weekendDays = [5, 6];

        // Persian day names
        var dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
        var monthNames = ['ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن', 'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر'];

        // Persian month names
        var persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

        // Simple Gregorian to approximate Persian date conversion
        function toPersianDate(date) {
            var gY = date.getFullYear();
            var gM = date.getMonth() + 1;
            var gD = date.getDate();
            var offset = gY <= 1979 ? 11 : 10;
            var jY = gY - 621 + offset;
            var dayOfYear;
            var monthsArr = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            if (gY % 4 === 0) monthsArr[1] = 29;
            dayOfYear = 0;
            for (var i = 0; i < gM - 1; i++) dayOfYear += monthsArr[i];
            dayOfYear += gD;
            var farvardinEnd = offset === 10 ? 79 : 80;
            var jM, jD;
            if (dayOfYear <= farvardinEnd) {
                jM = 1;
                jD = dayOfYear;
            } else {
                dayOfYear -= farvardinEnd;
                jM = Math.ceil(dayOfYear / 30.5) + 1;
                if (jM > 12) jM = 12;
                jD = dayOfYear - Math.floor((jM - 2) * 30.5);
                if (jD <= 0) jD = 1;
            }
            return { year: jY, month: jM, day: jD };
        }

        // Simulate availability: some days have no slots
        function dayHasSlots(date) {
            // weekends are closed
            if (weekendDays.indexOf(date.getDay()) !== -1) return false;
            // Random: ~20% chance a weekday is full
            var hash = date.getDate() + date.getMonth() * 31;
            return hash % 5 !== 0;
        }

        // Build calendar strip for next 14 days
        function buildCalendar() {
            calStrip.innerHTML = '';
            var today = new Date();
            today.setHours(0, 0, 0, 0);

            for (var i = 0; i < 14; i++) {
                var date = new Date(today);
                date.setDate(today.getDate() + i);

                var hasSlots = dayHasSlots(date);
                var isWeekend = weekendDays.indexOf(date.getDay()) !== -1;
                var isFull = !hasSlots && !isWeekend;
                var pe = toPersianDate(date);
                var dayName = dayNames[date.getDay()];

                var card = document.createElement('div');
                card.className = 'sel-cal-card' + (isFull || isWeekend ? ' sel-cal-card--disabled' : '');
                card.setAttribute('data-index', i);

                var dayNum = document.createElement('span');
                dayNum.className = 'sel-cal-day-num';
                dayNum.textContent = pe.day;

                var dayLabel = document.createElement('span');
                dayLabel.className = 'sel-cal-day-label';
                dayLabel.textContent = i === 0 ? 'امروز' : i === 1 ? 'فردا' : dayName;

                var monthLabel = document.createElement('span');
                monthLabel.className = 'sel-cal-month-label';
                monthLabel.textContent = persianMonths[pe.month - 1];

                card.appendChild(dayLabel);
                card.appendChild(dayNum);
                card.appendChild(monthLabel);

                if (isWeekend) {
                    var closedBadge = document.createElement('span');
                    closedBadge.className = 'sel-cal-badge sel-cal-badge--closed';
                    closedBadge.textContent = 'تعطیل';
                    card.appendChild(closedBadge);
                } else if (isFull) {
                    var fullBadge = document.createElement('span');
                    fullBadge.className = 'sel-cal-badge sel-cal-badge--full';
                    fullBadge.textContent = 'تکمیل';
                    card.appendChild(fullBadge);
                }

                if (hasSlots) {
                    card.addEventListener('click', function () {
                        document.querySelectorAll('.sel-cal-card').forEach(function (c) {
                            c.classList.remove('sel-cal-card--active');
                        });
                        this.classList.add('sel-cal-card--active');
                        selectedDay = this.getAttribute('data-index');
                        showTimeSlots(parseInt(selectedDay, 10));
                    });
                }

                calStrip.appendChild(card);
            }
        }

        // Morning slots
        var morningTimes = ['۱۰:۰۰', '۱۰:۳۰', '۱۱:۰۰', '۱۱:۳۰', '۱۲:۰۰', '۱۲:۳۰'];
        var afternoonTimes = ['۱۶:۰۰', '۱۶:۳۰', '۱۷:۰۰', '۱۷:۳۰', '۱۸:۰۰', '۱۸:۳۰', '۱۹:۰۰', '۱۹:۳۰'];

        function buildSlotGrid(container, times, dayIndex) {
            container.innerHTML = '';
            times.forEach(function (time) {
                // Simulate: some slots are taken based on day and time
                var hash = dayIndex * 7 + time.charCodeAt(1);
                var isTaken = hash % 4 === 0;

                var slot = document.createElement('button');
                slot.className = 'sel-slot-btn' + (isTaken ? ' sel-slot-btn--disabled' : '');
                slot.disabled = isTaken;

                var timeSpan = document.createElement('span');
                timeSpan.className = 'sel-slot-time';
                timeSpan.textContent = time;

                var priceSpan = document.createElement('span');
                priceSpan.className = 'sel-slot-price';
                priceSpan.textContent = '۲۰۰,۰۰۰ تومان بیعانه';

                slot.appendChild(timeSpan);
                slot.appendChild(priceSpan);

                if (!isTaken) {
                    slot.addEventListener('click', function () {
                        document.querySelectorAll('.sel-slot-btn').forEach(function (s) {
                            s.classList.remove('sel-slot-btn--active');
                        });
                        this.classList.add('sel-slot-btn--active');
                        selectedTime = time;
                        updateFooter();
                    });
                }

                container.appendChild(slot);
            });
        }

        function showTimeSlots(dayIndex) {
            slotsSection.style.display = '';
            selectedTime = null;
            modalFooter.style.display = 'none';
            document.querySelectorAll('.sel-slot-btn').forEach(function (s) {
                s.classList.remove('sel-slot-btn--active');
            });

            buildSlotGrid(morningSlots, morningTimes, dayIndex);
            buildSlotGrid(afternoonSlots, afternoonTimes, dayIndex);
        }

        function updateFooter() {
            if (!selectedDay || !selectedTime) {
                modalFooter.style.display = 'none';
                return;
            }
            modalFooter.style.display = '';
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            var targetDate = new Date(today);
            targetDate.setDate(today.getDate() + parseInt(selectedDay, 10));
            var pe = toPersianDate(targetDate);
            selectedDayText.textContent = pe.day + ' ' + persianMonths[pe.month - 1];
            selectedTimeText.textContent = selectedTime;
        }

        // Open modal
        bookBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                var doctorName = this.getAttribute('data-doctor') || '';
                doctorNameEl.textContent = 'دکتر ' + doctorName;
                selectedDay = null;
                selectedTime = null;
                modalFooter.style.display = 'none';
                slotsSection.style.display = 'none';
                buildCalendar();
                overlay.classList.add('sel-modal-open');
                document.body.style.overflow = 'hidden';
            });
        });

        // Close modal
        function closeModal() {
            overlay.classList.remove('sel-modal-open');
            document.body.style.overflow = '';
        }

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        if (backdrop) backdrop.addEventListener('click', closeModal);

        // Close on Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && overlay.classList.contains('sel-modal-open')) {
                closeModal();
            }
        });
    })();

    /* ================= BOTTOM NAV ================= */
    (function initBottomNav() {
        var bottomNav = document.querySelector('.dash-bottomnav');
        if (!bottomNav) return;
        var items = bottomNav.querySelectorAll('.dash-bottomnav-item');
        var currentPage = window.location.pathname.split('/').pop() || 'select-doctors.html';
        items.forEach(function (item) {
            var href = item.getAttribute('href') || '';
            if (href === currentPage) item.classList.add('is-active');
        });
    })();

})();
