/**
 * Dentura — Dashboard Page Interactions
 * All behaviors are static-friendly and do NOT require a backend.
 */

(function () {
    'use strict';

    /* ================= HEADER SCROLL EFFECT ================= */
    (function initHeaderScroll() {
        const header = document.querySelector('.dash-header');
        if (!header) return;

        let ticking = false;

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

        /* Create a <span> pill inside each icon */
        icons.forEach(function (icon) {
            var pill = document.createElement('span');
            pill.className = 'dash-nav-pill';
            pill.textContent = icon.getAttribute('data-tooltip');
            icon.appendChild(pill);
        });

        var pills = document.querySelectorAll('.dash-nav-pill');

        function clearPush() {
            icons.forEach(function (icon) {
                icon.style.marginLeft = '';
            });
            pills.forEach(function (p) { p.classList.remove('is-active'); });
        }

        icons.forEach(function (icon, index) {
            icon.addEventListener('mouseenter', function () {
                clearPush();
                pills[index].classList.add('is-active');

                /* Push the adjacent icon to the right (lower index in DOM = right in RTL)
                   by adding margin-left. Only the immediate neighbour needs the margin;
                   items further right ride along for free. */
                if (index > 0) {
                    var pillW = pills[index].scrollWidth || 100;
                    icons[index - 1].style.marginLeft = (pillW + 10) + 'px';
                }
            });

            icon.addEventListener('mouseleave', function () {
                clearPush();
            });

            /* Mobile: toggle on tap */
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

    /* ================= NOTIFICATION BADGE ANIMATION ================= */
    (function initNotifBadge() {
        var badge = document.querySelector('.dash-notif-badge');
        if (!badge) return;

        /* Pulse animation is handled by CSS keyframes.
           This adds a subtle scale bounce on page load. */
        badge.style.animation = 'none';
        /* Force reflow */
        void badge.offsetWidth;
        badge.style.animation = '';
    })();

    /* ================= SERVICE CARD HOVER RIPPLE ================= */
    (function initServiceCards() {
        var cards = document.querySelectorAll('.dash-service-card');
        if (!cards.length) return;

        cards.forEach(function (card) {
            card.addEventListener('mouseenter', function (e) {
                var rect = this.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;

                var ripple = document.createElement('span');
                ripple.className = 'dash-service-ripple';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                this.appendChild(ripple);

                ripple.addEventListener('animationend', function () {
                    ripple.remove();
                });
            });
        });
    })();

    /* ================= GALLERY DOWNLOAD BUTTON ================= */
    (function initGalleryDownload() {
        var downloadBtns = document.querySelectorAll('.dash-img-download');
        if (!downloadBtns.length) return;

        downloadBtns.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var src = btn.dataset.src;
                if (!src) return;

                var a = document.createElement('a');
                a.href = src;
                a.download = src.split('/').pop();
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                /* Visual feedback */
                this.classList.add('downloading');
                var originalHTML = this.innerHTML;

                this.innerHTML =
                    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<polyline points="20 6 9 17 4 12"/>' +
                    '</svg>';

                var self = this;
                setTimeout(function () {
                    self.classList.remove('downloading');
                    self.innerHTML = originalHTML;
                }, 1500);
            });
        });
    })();

    /* ================= PAST APPOINTMENT CARD HOVER ================= */
    (function initPastCards() {
        var cards = document.querySelectorAll('.dash-past-card');
        if (!cards.length) return;

        cards.forEach(function (card) {
            card.addEventListener('mouseenter', function () {
                this.style.transform = 'translateX(-4px)';
            });
            card.addEventListener('mouseleave', function () {
                this.style.transform = '';
            });
        });
    })();

    /* ================= BEFORE-AFTER SLIDER ================= */
    (function initBA() {
        document.querySelectorAll('[data-ba]').forEach(function (card) {
            if (card._baInit) return;
            card._baInit = true;
            var container = card.querySelector('.ba-container') || card;
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
            card.addEventListener('keydown', function (e) {
                var STEP = 5;
                switch (e.key) {
                    case 'ArrowRight': setPosition(currentPct + STEP); e.preventDefault(); break;
                    case 'ArrowLeft': setPosition(currentPct - STEP); e.preventDefault(); break;
                    case 'Home': setPosition(0); e.preventDefault(); break;
                    case 'End': setPosition(100); e.preventDefault(); break;
                }
            });
            setPosition(50);
        });
    })();

    /* ================= SCROLL REVEAL ANIMATION ================= */
    (function initScrollReveal() {
        var sections = document.querySelectorAll('.dash-section');
        if (!sections.length) return;

        if (!('IntersectionObserver' in window)) {
            sections.forEach(function (s) {
                s.classList.add('is-visible');
            });
            return;
        }

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
        );

        sections.forEach(function (section) {
            observer.observe(section);
        });
    })();

    /* ================= APPOINTMENT BANNER GLOW ================= */
    (function initBannerGlow() {
        var banner = document.querySelector('.dash-appointment-banner');
        if (!banner) return;

        banner.addEventListener('mousemove', function (e) {
            var rect = this.getBoundingClientRect();
            var x = ((e.clientX - rect.left) / rect.width) * 100;
            var y = ((e.clientY - rect.top) / rect.height) * 100;
            this.style.setProperty('--glow-x', x + '%');
            this.style.setProperty('--glow-y', y + '%');
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
    })();
})();
