/**
 * Dentura — Notification Badge
 * Fetches unread notification count and updates badge elements.
 */
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        fetch('/api/notifications/?unread=true', { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (data) {
                if (!data) return;
                var items = data.results || data;
                var badges = document.querySelectorAll('.dash-notif-badge, .dash-bottomnav-badge');
                badges.forEach(function (b) {
                    if (items.length > 0) {
                        b.textContent = items.length > 9 ? '\u2b1b+' : items.length;
                        b.style.display = '';
                    } else {
                        b.style.display = 'none';
                    }
                });
            })
            .catch(function () {});
    });
})();
