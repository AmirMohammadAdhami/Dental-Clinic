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

    /* ================= TOOLTIP BEHAVIOR ================= */
    (function initTooltips() {
        const icons = document.querySelectorAll('.dash-nav-icon[data-tooltip]');
        if (!icons.length) return;

        icons.forEach(function (icon) {
            /* Desktop: show tooltip on hover */
            icon.addEventListener('mouseenter', function () {
                this.classList.add('tooltip-visible');
            });
            icon.addEventListener('mouseleave', function () {
                this.classList.remove('tooltip-visible');
            });

            /* Mobile: toggle tooltip on tap */
            icon.addEventListener('click', function (e) {
                /* If it's an actual link, let it navigate on first tap */
                const isVisible = this.classList.contains('tooltip-visible');

                /* Hide all other tooltips */
                icons.forEach(function (other) {
                    if (other !== icon) other.classList.remove('tooltip-visible');
                });

                /* On mobile, first tap shows tooltip, second tap navigates */
                if (!isVisible && window.innerWidth <= 620) {
                    e.preventDefault();
                    this.classList.add('tooltip-visible');
                }
            });
        });

        /* Close tooltips when tapping outside */
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.dash-nav-icon')) {
                icons.forEach(function (icon) {
                    icon.classList.remove('tooltip-visible');
                });
            }
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
        var downloadBtns = document.querySelectorAll('.dash-gallery-download');
        if (!downloadBtns.length) return;

        downloadBtns.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                /* Visual feedback: briefly enlarge and change icon */
                this.classList.add('downloading');
                var originalHTML = this.innerHTML;

                this.innerHTML =
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<polyline points="20 6 9 17 4 12"/>' +
                    '</svg>';

                var self = this;
                setTimeout(function () {
                    self.classList.remove('downloading');
                    self.innerHTML = originalHTML;
                }, 1800);
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
})();
