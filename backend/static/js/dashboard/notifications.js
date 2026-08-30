/**
 * Dentura — Notifications Page Interactions
 * Tab switching, mark-all-read, and toggle settings.
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

    /* ================= TAB SWITCHING ================= */
    (function initTabs() {
        var tabs = document.querySelectorAll('.notif-tab');
        var panels = document.querySelectorAll('.notif-panel');
        if (!tabs.length) return;

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var targetId = 'panel-' + this.getAttribute('data-tab');

                // Deactivate all
                tabs.forEach(function (t) {
                    t.classList.remove('notif-tab--active');
                    t.setAttribute('aria-selected', 'false');
                });
                panels.forEach(function (p) {
                    p.classList.remove('notif-panel--active');
                    p.hidden = true;
                });

                // Activate clicked
                this.classList.add('notif-tab--active');
                this.setAttribute('aria-selected', 'true');
                var target = document.getElementById(targetId);
                if (target) {
                    target.classList.add('notif-panel--active');
                    target.hidden = false;
                }
            });
        });
    })();

    /* ================= MARK ALL AS READ ================= */
    (function initMarkAllRead() {
        var btn = document.getElementById('notifMarkAllBtn');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var unreadCards = document.querySelectorAll('.notif-card--unread');
            unreadCards.forEach(function (card) {
                card.classList.remove('notif-card--unread');
                var dot = card.querySelector('.notif-card-dot');
                if (dot) dot.remove();
            });

            // Hide all notification badges
            var badges = document.querySelectorAll('.dash-notif-badge, .dash-bottomnav-badge');
            badges.forEach(function (badge) {
                badge.style.display = 'none';
            });

            // Visual feedback
            this.classList.add('notif-mark-all--done');
            this.innerHTML =
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<polyline points="20 6 9 17 4 12"/>' +
                '</svg> همه خوانده شد ✓';

            var self = this;
            setTimeout(function () {
                self.classList.remove('notif-mark-all--done');
            }, 2000);
        });
    })();

})();
