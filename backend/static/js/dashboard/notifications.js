/**
 * Dentura — Notifications Page
 * Fetches notifications & reminder settings from the API and renders them.
 */

(function () {
    'use strict';

    var API_BASE = '/api';

    /* ================= SVG ICONS ================= */
    var ICONS = {
        APPOINTMENT: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
        GALLERY: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        PRESCRIPTION: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y1="13"/><line x1="16" y1="17" x2="8" y1="17"/><polyline points="10 9 9 9 8 9"/></svg>',
        CHECKUP_REMINDER: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
        INVOICE: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y1="13"/><line x1="16" y1="17" x2="8" y1="17"/></svg>',
        GENERAL: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
    };

    /* ================= HELPER: CSRF TOKEN ================= */
    function getCSRFToken() {
        var name = 'csrftoken';
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i].trim();
            if (c.substring(0, name.length + 1) === name + '=') {
                return decodeURIComponent(c.substring(name.length + 1));
            }
        }
        return '';
    }

    /* ================= HELPER: GROUP BY DATE ================= */
    function groupByDate(notifications) {
        var groups = {};
        var now = new Date();
        var todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        var weekAgoStart = new Date(todayStart);
        weekAgoStart.setDate(weekAgoStart.getDate() - 7);

        notifications.forEach(function (n) {
            var d = new Date(n.created_at);
            var label;
            if (d >= todayStart) {
                label = '\u0627\u0645\u0631\u0648\u0632'; // امروز
            } else if (d >= yesterdayStart) {
                label = '\u062f\u06cc\u0631\u0648\u0632'; // دیروز
            } else if (d >= weekAgoStart) {
                label = '\u0647\u0641\u062a\u0647 \u06af\u0630\u0634\u062a\u0647'; // هفته گذشته
            } else {
                label = '\u0642\u062f\u06cc\u0645\u06cc\u200c\u062a\u0631'; // قدیمی‌تر
            }
            if (!groups[label]) groups[label] = [];
            groups[label].push(n);
        });

        return groups;
    }

    /* ================= HELPER: RENDER A SINGLE NOTIF CARD ================= */
    var CHECK_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

    function renderCard(n) {
        var colorClass = 'notif-card-icon--' + n.icon_color;
        var unreadClass = n.is_read ? '' : ' notif-card--unread';
        var dot = n.is_read ? '' : '<div class="notif-card-dot"></div>';
        var icon = ICONS[n.notification_type] || ICONS.GENERAL;
        var linkAttr = n.link ? ' data-link="' + n.link + '" style="cursor:pointer"' : '';
        var readBtn = n.is_read
            ? ''
            : '<button class="notif-card-read-btn" data-notif-id="' + n.id + '" title="خوانده شد">' + CHECK_SVG + '</button>';

        return '<div class="notif-card' + unreadClass + '" data-id="' + n.id + '"' + linkAttr + '>'
            + dot
            + '<div class="notif-card-icon ' + colorClass + '">' + icon + '</div>'
            + '<div class="notif-card-content">'
            + '<p class="notif-card-text">' + n.message + '</p>'
            + '<span class="notif-card-meta">' + n.time_since + '</span>'
            + '</div>'
            + readBtn
            + '</div>';
    }

    /* ================= HELPER: RENDER ALL NOTIFICATIONS ================= */
    function renderNotifications(notifications) {
        var container = document.getElementById('notifContainer');
        var emptyState = document.getElementById('notifEmpty');
        var loading = document.getElementById('notifLoading');

        if (loading) loading.style.display = 'none';

        if (!notifications.length) {
            container.innerHTML = '';
            emptyState.style.display = '';
            return;
        }

        emptyState.style.display = 'none';
        var groups = groupByDate(notifications);
        var html = '';

        var groupOrder = [
            '\u0627\u0645\u0631\u0648\u0632',       // امروز
            '\u062f\u06cc\u0631\u0648\u0632',       // دیروز
            '\u0647\u0641\u062a\u0647 \u06af\u0630\u0634\u062a\u0647', // هفته گذشته
            '\u0642\u062f\u06cc\u0645\u06cc\u200c\u062a\u0631'        // قدیمی‌تر
        ];
        groupOrder.forEach(function (label) {
            if (!groups[label]) return;
            html += '<div class="notif-date-group">';
            html += '<h3 class="notif-date-label">' + label + '</h3>';
            groups[label].forEach(function (n) {
                html += renderCard(n);
            });
            html += '</div>';
        });

        container.innerHTML = html;

        // Update unread badge count
        var unreadCount = notifications.filter(function (n) { return !n.is_read; }).length;
        var badges = document.querySelectorAll('.dash-notif-badge, .dash-bottomnav-badge');
        badges.forEach(function (b) {
            if (unreadCount > 0) {
                b.textContent = unreadCount > 9 ? '\u2b1b+' : toPersianNum(unreadCount);
                b.style.display = '';
            } else {
                b.style.display = 'none';
            }
        });

        // Click card to navigate
        container.querySelectorAll('[data-link]').forEach(function (card) {
            card.addEventListener('click', function (e) {
                // Don't navigate if clicking the read button
                if (e.target.closest('.notif-card-read-btn')) return;
                var link = this.getAttribute('data-link');
                if (link) window.location.href = link;
            });
        });

        // Read button click — animate then mark as read
        container.querySelectorAll('.notif-card-read-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var self = this;
                var id = self.getAttribute('data-notif-id');

                // Start fill + checkmark draw
                self.classList.add('is-done');

                // After draw completes, fade out
                setTimeout(function () {
                    self.classList.add('is-fade');
                }, 450);

                // After fade, remove button + mark read
                setTimeout(function () {
                    var card = self.closest('.notif-card');
                    if (card) {
                        card.classList.remove('notif-card--unread');
                        var dot = card.querySelector('.notif-card-dot');
                        if (dot) dot.remove();
                    }
                    self.remove();
                    // Tell server
                    markAsRead(id);
                }, 750);
            });
        });
    }

    /* ================= FETCH NOTIFICATIONS ================= */
    function fetchNotifications() {
        fetch(API_BASE + '/notifications/', {
            credentials: 'include'
        })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function (data) {
            var list = data.results || data;
            renderNotifications(list);
        })
        .catch(function (err) {
            console.error('Failed to load notifications:', err);
            var loading = document.getElementById('notifLoading');
            if (loading) loading.innerHTML = '<p>\u062e\u0637\u0627 \u062f\u0631 \u0628\u0627\u0631\u06af\u0630\u0627\u0631\u06cc \u0627\u0639\u0644\u0627\u0646\u200c\u0647\u0627</p>';
        });
    }

    /* ================= MARK SINGLE AS READ ================= */
    function markAsRead(notifId) {
        fetch(API_BASE + '/notifications/' + notifId + '/read/', {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'X-CSRFToken': getCSRFToken() }
        })
        .then(function (res) {
            if (res.ok) {
                var card = document.querySelector('.notif-card[data-id="' + notifId + '"]');
                if (card) {
                    card.classList.remove('notif-card--unread');
                    var dot = card.querySelector('.notif-card-dot');
                    if (dot) dot.remove();
                }
            }
        });
    }

    /* ================= MARK ALL AS READ ================= */
    function initMarkAllRead() {
        var btn = document.getElementById('notifMarkAllBtn');
        if (!btn) return;

        btn.addEventListener('click', function () {
            var self = this;
            fetch(API_BASE + '/notifications/mark-all-read/', {
                method: 'POST',
                credentials: 'include',
                headers: { 'X-CSRFToken': getCSRFToken() }
            })
            .then(function (res) {
                if (res.ok) {
                    document.querySelectorAll('.notif-card--unread').forEach(function (card) {
                        card.classList.remove('notif-card--unread');
                        var dot = card.querySelector('.notif-card-dot');
                        if (dot) dot.remove();
                    });

                    document.querySelectorAll('.dash-notif-badge, .dash-bottomnav-badge').forEach(function (b) {
                        b.style.display = 'none';
                    });

                    self.classList.add('notif-mark-all--done');
                    self.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> \u0647\u0645\u0647 \u062e\u0648\u0627\u0646\u062f\u0647 \u0634\u062f \u2713';

                    setTimeout(function () {
                        self.classList.remove('notif-mark-all--done');
                    }, 2000);
                }
            });
        });
    }

    /* ================= REMINDER SETTINGS ================= */
    function fetchReminderSettings() {
        fetch(API_BASE + '/reminders/settings/', {
            credentials: 'include'
        })
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function (data) {
            document.querySelectorAll('.notif-toggle-input[data-setting]').forEach(function (toggle) {
                var key = toggle.getAttribute('data-setting');
                if (data.hasOwnProperty(key)) {
                    toggle.checked = data[key];
                }
            });
        })
        .catch(function (err) {
            console.error('Failed to load reminder settings:', err);
        });
    }

    function initSettingsToggles() {
        document.querySelectorAll('.notif-toggle-input[data-setting]').forEach(function (toggle) {
            toggle.addEventListener('change', function () {
                var key = this.getAttribute('data-setting');
                var payload = {};
                payload[key] = this.checked;

                fetch(API_BASE + '/reminders/settings/', {
                    method: 'PATCH',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCSRFToken()
                    },
                    body: JSON.stringify(payload)
                })
                .then(function (res) {
                    if (!res.ok) throw new Error('HTTP ' + res.status);
                    if (typeof showToast === 'function') {
                        showToast('\u062a\u0646\u0638\u06cc\u0645\u0627\u062a \u0630\u062e\u06cc\u0631\u0647 \u0634\u062f', 'success');
                    }
                })
                .catch(function (err) {
                    console.error('Failed to save setting:', err);
                    if (typeof showToast === 'function') {
                        showToast('\u062e\u0637\u0627 \u062f\u0631 \u0630\u062e\u06cc\u0631\u0647 \u062a\u0646\u0638\u06cc\u0645\u0627\u062a', 'error');
                    }
                });
            });
        });
    }

    /* ================= TAB SWITCHING ================= */
    function initTabs() {
        var tabs = document.querySelectorAll('.notif-tab');
        var panels = document.querySelectorAll('.notif-panel');
        if (!tabs.length) return;

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                var targetId = 'panel-' + this.getAttribute('data-tab');

                tabs.forEach(function (t) {
                    t.classList.remove('notif-tab--active');
                    t.setAttribute('aria-selected', 'false');
                });
                panels.forEach(function (p) {
                    p.classList.remove('notif-panel--active');
                    p.hidden = true;
                });

                this.classList.add('notif-tab--active');
                this.setAttribute('aria-selected', 'true');
                var target = document.getElementById(targetId);
                if (target) {
                    target.classList.add('notif-panel--active');
                    target.hidden = false;
                }
            });
        });
    }

    /* ================= HEADER SCROLL ================= */
    function initHeaderScroll() {
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
    }

    /* ================= INIT ================= */
    document.addEventListener('DOMContentLoaded', function () {
        initHeaderScroll();
        initTabs();
        initMarkAllRead();
        initSettingsToggles();

        fetchNotifications();
        fetchReminderSettings();
    });

})();
