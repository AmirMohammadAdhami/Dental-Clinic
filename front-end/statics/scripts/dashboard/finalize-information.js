/**
 * Dentura — Finalize Information Page Interactions
 * Booking switch, medical chips, textarea counter, header scroll.
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

    /* ================= NAV PILL (real <span>, push via margin) ================= */
    (function initNavPills() {
        var icons = document.querySelectorAll('.dash-nav-icon[data-tooltip]');
        if (!icons.length) return;
        icons.forEach(function (icon) {
            var pill = document.createElement('span');
            pill.className = 'dash-nav-pill';
            pill.textContent = icon.getAttribute('data-tooltip');
            icon.appendChild(pill);
        });
        var pills = document.querySelectorAll('.dash-nav-pill');
        function clearPush() {
            icons.forEach(function (icon) { icon.style.marginLeft = ''; });
            pills.forEach(function (p) { p.classList.remove('is-active'); });
        }
        icons.forEach(function (icon, index) {
            icon.addEventListener('mouseenter', function () {
                clearPush();
                pills[index].classList.add('is-active');
                if (index > 0) {
                    var pillW = pills[index].scrollWidth || 100;
                    icons[index - 1].style.marginLeft = (pillW + 10) + 'px';
                }
            });
            icon.addEventListener('mouseleave', function () { clearPush(); });
            icon.addEventListener('click', function (e) {
                var wasActive = pills[index].classList.contains('is-active');
                clearPush();
                if (!wasActive && window.innerWidth <= 620) {
                    e.preventDefault();
                    pills[index].classList.add('is-active');
                }
            });
        });
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.dash-nav-icon')) clearPush();
        });
    })();

    /* ================= BOOKING SWITCH (Self / Other) ================= */
    (function initBookingSwitch() {
        var switchBtns = document.querySelectorAll('.fi-switch-btn');
        if (!switchBtns.length) return;

        var firstNameInput = document.getElementById('fiFirstName');
        var lastNameInput = document.getElementById('fiLastName');
        var nationalCodeInput = document.getElementById('fiNationalCode');

        /* Default patient data (logged-in user) */
        var defaultData = {
            firstName: firstNameInput ? firstNameInput.value : '',
            lastName: lastNameInput ? lastNameInput.value : '',
            nationalCode: nationalCodeInput ? nationalCodeInput.value : ''
        };

        switchBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                /* Update active state */
                switchBtns.forEach(function (b) {
                    b.classList.remove('fi-switch-btn--active');
                    b.setAttribute('aria-checked', 'false');
                });
                this.classList.add('fi-switch-btn--active');
                this.setAttribute('aria-checked', 'true');

                var mode = this.getAttribute('data-booking');

                if (mode === 'self') {
                    /* Restore logged-in user data */
                    if (firstNameInput) {
                        firstNameInput.value = defaultData.firstName;
                        firstNameInput.readOnly = true;
                        firstNameInput.classList.add('fi-form-input--read-only');
                    }
                    if (lastNameInput) {
                        lastNameInput.value = defaultData.lastName;
                        lastNameInput.readOnly = true;
                        lastNameInput.classList.add('fi-form-input--read-only');
                    }
                    if (nationalCodeInput) {
                        nationalCodeInput.value = defaultData.nationalCode;
                        nationalCodeInput.readOnly = true;
                        nationalCodeInput.classList.add('fi-form-input--read-only');
                    }
                } else {
                    /* Clear fields for other person */
                    if (firstNameInput) {
                        firstNameInput.value = '';
                        firstNameInput.readOnly = false;
                        firstNameInput.classList.remove('fi-form-input--read-only');
                        firstNameInput.placeholder = 'نام بیمار';
                    }
                    if (lastNameInput) {
                        lastNameInput.value = '';
                        lastNameInput.readOnly = false;
                        lastNameInput.classList.remove('fi-form-input--read-only');
                        lastNameInput.placeholder = 'نام خانوادگی بیمار';
                    }
                    if (nationalCodeInput) {
                        nationalCodeInput.value = '';
                        nationalCodeInput.readOnly = false;
                        nationalCodeInput.classList.remove('fi-form-input--read-only');
                        nationalCodeInput.placeholder = 'کد ملی ۱۰ رقمی';
                    }

                    /* Focus the first empty field */
                    if (firstNameInput) firstNameInput.focus();
                }
            });
        });
    })();

    /* ================= MEDICAL HISTORY CHIPS ================= */
    (function initMedicalChips() {
        var chips = document.querySelectorAll('.fi-chip');
        if (!chips.length) return;

        chips.forEach(function (chip) {
            chip.addEventListener('click', function () {
                this.classList.toggle('fi-chip--active');
                this.setAttribute('aria-pressed', this.classList.contains('fi-chip--active'));
            });
        });
    })();

    /* ================= TEXTAREA CHARACTER COUNTER ================= */
    (function initTextareaCounter() {
        var textarea = document.getElementById('fiNotes');
        var counter = document.getElementById('fiNotesCount');
        if (!textarea || !counter) return;

        textarea.addEventListener('input', function () {
            var len = this.value.length;
            if (typeof toPersianNum === 'function') {
                counter.textContent = toPersianNum(len);
            } else {
                counter.textContent = String(len);
            }
        });
    })();

    /* ================= CONFIRM BUTTON INTERACTION ================= */
    (function initConfirmButton() {
        function handleConfirm(e) {
            e.preventDefault();
            var btn = this;

            /* Simple validation */
            var firstName = document.getElementById('fiFirstName');
            var lastName = document.getElementById('fiLastName');
            var nationalCode = document.getElementById('fiNationalCode');

            var isValid = true;

            [firstName, lastName, nationalCode].forEach(function (input) {
                if (input && !input.value.trim()) {
                    input.style.borderColor = '#ef4444';
                    input.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.15)';
                    isValid = false;

                    /* Reset border after 2s */
                    setTimeout(function () {
                        input.style.borderColor = '';
                        input.style.boxShadow = '';
                    }, 2000);
                }
            });

            if (isValid) {
                /* Visual confirmation */
                var originalHTML = btn.innerHTML;
                btn.innerHTML =
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
                    'در حال انتقال...';
                btn.style.pointerEvents = 'none';

                setTimeout(function () {
                    btn.innerHTML = originalHTML;
                    btn.style.pointerEvents = '';
                }, 2000);
            }
        }

        /* Attach to both desktop and mobile CTA buttons */
        var btns = document.querySelectorAll('.fi-confirm-btn');
        btns.forEach(function (btn) {
            btn.addEventListener('click', handleConfirm);
        });
    })();

    /* ================= BOTTOM NAV ACTIVE STATE ================= */
    (function initBottomNav() {
        var bottomNav = document.querySelector('.dash-bottomnav');
        if (!bottomNav) return;

        var items = bottomNav.querySelectorAll('.dash-bottomnav-item');
        var currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

        items.forEach(function (item) {
            var href = item.getAttribute('href') || '';
            if (href === currentPage) {
                item.classList.add('is-active');
            }
        });

        var lastScrollY = 0;
        var ticking = false;

        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    var currentY = window.scrollY;
                    if (currentY > lastScrollY && currentY > 100) {
                        bottomNav.style.transform = 'translateY(100%)';
                    } else {
                        bottomNav.style.transform = 'translateY(0)';
                    }
                    lastScrollY = currentY;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    })();

})();
