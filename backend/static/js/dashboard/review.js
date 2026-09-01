/**
 * Dentura — Review Modals
 * Write review (create) + View approved review.
 * Shared between appointments page and dashboard page.
 */
var DenturaReview = (function () {
    'use strict';

    var STAR_WRITE_EMPTY = '<svg viewBox="0 0 24 24"><polygon class="star-empty" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    var STAR_WRITE_FILLED = '<svg viewBox="0 0 24 24"><polygon class="star-filled" points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    var STAR_VIEW = '<svg viewBox="0 0 24 24" class="dash-review-view-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    var STAR_VIEW_EMPTY = '<svg viewBox="0 0 24 24" class="dash-review-view-star dash-review-view-star--empty"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

    var WRITE_RATINGS = [
        { key: 'professionalism', label: 'تخصص و مهارت حرفه\u200cای' },
        { key: 'treatment_quality', label: 'کیفیت درمان' },
        { key: 'communication', label: 'ارتباط و برخورد' }
    ];

    var VIEW_RATINGS = [
        { key: 'professionalism_rating', label: 'تخصص و مهارت حرفه\u200cای' },
        { key: 'treatment_quality_rating', label: 'کیفیت درمان' },
        { key: 'communication_rating', label: 'ارتباط و برخورد' }
    ];

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

    /* ---- Gregorian → Jalali conversion ---- */
    var _div = function (a, b) { return ~~(a / b); };
    var _mod = function (a, b) { return a - ~~(a / b) * b; };

    function _jalCal(jy) {
        var breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210,
            1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
        var bl = breaks.length, gy = jy + 621, leapJ = -14, jp = breaks[0], jm, jump = 0, leap, n, i;
        for (i = 1; i < bl; i += 1) {
            jm = breaks[i];
            jump = jm - jp;
            if (jy < jm) break;
            leapJ = leapJ + _div(jump, 33) * 8 + _div(_mod(jump, 33), 4);
            jp = jm;
        }
        n = jy - jp;
        leapJ = leapJ + _div(n, 33) * 8 + _div(_mod(n, 33) + 3, 4);
        if (_mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
        var leapG = _div(gy, 4) - _div((_div(gy, 100) + 1) * 3, 4) - 150;
        var march = 20 + leapJ - leapG;
        if (jump - n < 6) n = n - jump + _div(jump + 4, 33) * 33;
        leap = _mod(_mod(n + 1, 33) - 1, 4);
        if (leap === -1) leap = 4;
        return { leap: leap, gy: gy, march: march };
    }

    function _g2d(gy, gm, gd) {
        var d = _div((gy + _div(gm - 8, 6) + 100100) * 1461, 4)
            + _div(153 * _mod(gm + 9, 12) + 2, 5)
            + gd - 34840408;
        d = d - _div(_div(gy + 100100 + _div(gm - 8, 6), 100) * 3, 4) + 752;
        return d;
    }

    function _toJalali(date) {
        var gy = date.getFullYear(), gm = date.getMonth() + 1, gd = date.getDate();
        var jdn = _g2d(gy, gm, gd);
        var gy2 = _d2g(jdn).gy;
        var jy = gy2 - 621;
        var r = _jalCal(jy);
        var jdn1f = _g2d(gy2, 3, r.march);
        var k = jdn - jdn1f, jm, jd;
        if (k >= 0) {
            if (k <= 185) {
                jm = 1 + _div(k, 31);
                jd = _mod(k, 31) + 1;
                return { year: jy, month: jm, day: jd };
            }
            k -= 186;
        } else {
            jy -= 1;
            k += 179;
            if (r.leap === 1) k += 1;
        }
        jm = 7 + _div(k, 30);
        jd = _mod(k, 30) + 1;
        return { year: jy, month: jm, day: jd };
    }

    function _d2g(jdn) {
        var j, i, gd, gm, gy;
        j = 4 * jdn + 139361631;
        j = j + _div(_div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
        i = _div(_mod(j, 1461), 4) * 5 + 308;
        gd = _div(_mod(i, 153), 5) + 1;
        gm = _mod(_div(i, 153), 12) + 1;
        gy = _div(j, 1461) - 100100 + _div(8 - gm, 6);
        return { gy: gy, gm: gm, gd: gd };
    }

    /* ---- helpers available to pages ---- */
    function jalaliDate(dateStr) {
        try {
            var d = new Date(dateStr);
            var pe = _toJalali(d);
            var JALALI_MONTHS = ['\u0641\u0631\u0648\u0631\u062f\u06cc\u0646','\u0627\u0631\u062f\u06cc\u0628\u0647\u0634\u062a','\u062e\u0631\u062f\u0627\u062f','\u062a\u06cc\u0631','\u0645\u0631\u062f\u0627\u062f','\u0634\u0647\u0631\u06cc\u0648\u0631','\u0645\u0647\u0631','\u0622\u0628\u0627\u0646','\u0622\u0630\u0631','\u062f\u06cc','\u0628\u0647\u0645\u0646','\u0627\u0633\u0641\u0646\u062f'];
            var faDays = ['\u06cc\u06a9\u0634\u0646\u0628\u0647','\u062f\u0648\u0634\u0646\u0628\u0647','\u0633\u0647\u200c\u0634\u0646\u0628\u0647','\u0686\u0647\u0627\u0631\u0634\u0646\u0628\u0647','\u067e\u0646\u062c\u0634\u0646\u0628\u0647','\u062c\u0645\u0639\u0647','\u0634\u0646\u0628\u0647'];
            var weekday = faDays[d.getDay()];
            var month = JALALI_MONTHS[pe.month - 1];
            var hour = String(d.getHours()).padStart(2, '0');
            var min = String(d.getMinutes()).padStart(2, '0');
            return weekday + ' ' + pe.day + ' ' + month + ' \u2014 \u0633\u0627\u0639\u062a ' + hour + ':' + min;
        } catch (e) { return dateStr || ''; }
    }

    function escapeHTML(str) {
        var div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function escapeAttr(str) {
        return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    /* ================= WRITE REVIEW MODAL ================= */
    function openWriteModal(aptId, doctor, service) {
        var modal = document.createElement('div');
        modal.className = 'dash-review-modal';

        var ratingsHTML = '';
        WRITE_RATINGS.forEach(function (r) {
            ratingsHTML += '<div class="dash-review-rating-row">';
            ratingsHTML += '<span class="dash-review-rating-label">' + r.label + '</span>';
            ratingsHTML += '<div class="dash-review-stars" data-field="' + r.key + '" data-value="0">';
            for (var i = 1; i <= 5; i++) {
                ratingsHTML += '<button type="button" class="dash-review-star" data-star="' + i + '">' + STAR_WRITE_EMPTY + '</button>';
            }
            ratingsHTML += '<span class="dash-review-rating-value">\u06f0</span>';
            ratingsHTML += '</div></div>';
        });

        modal.innerHTML =
            '<div class="dash-review-overlay"></div>' +
            '<div class="dash-review-card">' +
            '<button class="dash-review-close" aria-label="\u0628\u0633\u062a\u0646"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
            '<h3 class="dash-review-title">\u0646\u0638\u0631 \u0634\u0645\u0627 \u062f\u0631\u0628\u0627\u0631\u0647 \u062f\u0631\u0645\u0627\u0646</h3>' +
            '<p class="dash-review-subtitle">' + escapeHTML(doctor) + ' \u2014 ' + escapeHTML(service) + '</p>' +
            '<div class="dash-review-form">' +
            '<div class="dash-review-rating-group">' + ratingsHTML + '</div>' +
            '<div class="dash-review-message-group">' +
            '<label class="dash-review-message-label" for="reviewMessage">\u067e\u06cc\u0627\u0645 \u0634\u0645\u0627</label>' +
            '<textarea class="dash-review-message-textarea" id="reviewMessage" placeholder="\u0646\u0638\u0631\u060c \u067e\u06cc\u0634\u0646\u0647\u0627\u062f \u06cc\u0627 \u062a\u062c\u0631\u0628\u0647 \u062e\u0648\u062f \u0631\u0627 \u0628\u0646\u0648\u06cc\u0633\u06cc\u062f..."></textarea>' +
            '</div>' +
            '<button class="dash-review-submit" type="button" disabled>' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
            '\u0627\u0631\u0633\u0627\u0644 \u0646\u0638\u0631</button>' +
            '</div>' +
            '<div class="dash-review-success">' +
            '<div class="dash-review-success-icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>' +
            '<p class="dash-review-success-text">\u0646\u0638\u0631 \u0634\u0645\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06cc\u062a \u062b\u0628\u062a \u0634\u062f!</p>' +
            '<p class="dash-review-success-sub">\u067e\u0633 \u0627\u0632 \u0628\u0631\u0631\u0633\u06cc \u0646\u0645\u0627\u06cc\u0634 \u062f\u0627\u062f\u0647 \u062e\u0648\u0627\u0647\u062f \u0634\u062f.</p>' +
            '</div>' +
            '</div>';

        document.body.appendChild(modal);
        requestAnimationFrame(function () { modal.classList.add('is-active'); });

        var formEl = modal.querySelector('.dash-review-form');
        var successEl = modal.querySelector('.dash-review-success');
        var submitBtn = modal.querySelector('.dash-review-submit');

        /* star clicks */
        modal.querySelectorAll('.dash-review-stars').forEach(function (group) {
            group.querySelectorAll('.dash-review-star').forEach(function (star) {
                star.addEventListener('click', function () {
                    var val = parseInt(star.dataset.star);
                    group.dataset.value = val;
                    group.querySelectorAll('.dash-review-star').forEach(function (s, idx) {
                        s.innerHTML = idx < val ? STAR_WRITE_FILLED : STAR_WRITE_EMPTY;
                    });
                    group.querySelector('.dash-review-rating-value').textContent = val;
                    var allRated = true;
                    modal.querySelectorAll('.dash-review-stars').forEach(function (g) {
                        if (parseInt(g.dataset.value) === 0) allRated = false;
                    });
                    submitBtn.disabled = !allRated;
                });
            });
        });

        function close() {
            modal.classList.remove('is-active');
            setTimeout(function () { modal.remove(); }, 300);
        }
        modal.querySelector('.dash-review-close').addEventListener('click', close);
        modal.querySelector('.dash-review-overlay').addEventListener('click', close);

        /* submit */
        submitBtn.addEventListener('click', function () {
            submitBtn.disabled = true;
            submitBtn.textContent = '\u062f\u0631 \u062d\u0627\u0644 \u0627\u0631\u0633\u0627\u0644...';

            var payload = {
                appointment_id: aptId,
                professionalism_rating: parseInt(modal.querySelector('[data-field="professionalism"]').dataset.value),
                treatment_quality_rating: parseInt(modal.querySelector('[data-field="treatment_quality"]').dataset.value),
                communication_rating: parseInt(modal.querySelector('[data-field="communication"]').dataset.value),
                content: (modal.querySelector('#reviewMessage').value || '').trim()
            };

            fetch('/api/doctor-reviews/create/', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify(payload)
            })
                .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
                .then(function (result) {
                    if (result.ok) {
                        formEl.style.display = 'none';
                        successEl.classList.add('is-visible');
                        setTimeout(close, 2000);
                    } else {
                        var errorMsg = '';
                        if (result.data) {
                            var keys = Object.keys(result.data);
                            for (var k = 0; k < keys.length; k++) {
                                var val = result.data[keys[k]];
                                if (Array.isArray(val)) { errorMsg += val.join(' '); }
                                else { errorMsg += val + ' '; }
                            }
                        }
                        submitBtn.disabled = false;
                        submitBtn.textContent = '\u0627\u0631\u0633\u0627\u0644 \u0646\u0638\u0631';
                        alert(errorMsg || '\u062e\u0637\u0627 \u062f\u0631 \u0627\u0631\u0633\u0627\u0644 \u0646\u0638\u0631. \u0644\u0637\u0641\u0627\u064b \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.');
                    }
                })
                .catch(function () {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '\u0627\u0631\u0633\u0627\u0644 \u0646\u0638\u0631';
                    alert('\u062e\u0637\u0627 \u062f\u0631 \u0627\u0631\u062a\u0628\u0627\u0637 \u0628\u0627 \u0633\u0631\u0648\u0631. \u0644\u0637\u0641\u0627\u064b \u062f\u0648\u0628\u0627\u0631\u0647 \u062a\u0644\u0627\u0634 \u06a9\u0646\u06cc\u062f.');
                });
        });
    }

    /* ================= VIEW APPROVED REVIEW MODAL ================= */
    function openViewModal(reviewData, doctor, service) {
        var starsHTML = function (val) {
            var h = '';
            for (var i = 1; i <= 5; i++) h += i <= val ? STAR_VIEW : STAR_VIEW_EMPTY;
            return h;
        };

        var ratingsHTML = '';
        VIEW_RATINGS.forEach(function (r) {
            var val = reviewData[r.key] || 0;
            ratingsHTML += '<div class="dash-review-view-rating-row">';
            ratingsHTML += '<span class="dash-review-view-rating-label">' + r.label + '</span>';
            ratingsHTML += '<div class="dash-review-view-stars">' + starsHTML(val);
            ratingsHTML += '<span class="dash-review-view-rating-num">' + val + '</span></div></div>';
        });

        var avgRating = reviewData.rating || 0;
        var dateStr = '';
        if (reviewData.created_at) {
            try { dateStr = jalaliDate(reviewData.created_at); } catch (ex) { dateStr = reviewData.created_at; }
        }

        var modal = document.createElement('div');
        modal.className = 'dash-review-view-modal';
        modal.innerHTML =
            '<div class="dash-review-overlay"></div>' +
            '<div class="dash-review-view-card">' +
            '<div class="dash-review-view-header">' +
            '<h3 class="dash-review-view-title">\u0646\u0638\u0631 \u0634\u0645\u0627</h3>' +
            '<button class="dash-review-view-close" aria-label="\u0628\u0633\u062a\u0646"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>' +
            '</div>' +
            '<p class="dash-review-view-subtitle">' + escapeHTML(doctor) + ' \u2014 ' + escapeHTML(service) + '</p>' +
            '<div class="dash-review-view-overall">' +
            '<span class="dash-review-view-overall-score">' + avgRating.toFixed(1) + '</span>' +
            '<span class="dash-review-view-overall-label">\u0645\u06cc\u0627\u0646\u06af\u06cc\u0646 \u0627\u0645\u062a\u06cc\u0627\u0632</span>' +
            '</div>' +
            '<div class="dash-review-view-ratings">' + ratingsHTML + '</div>' +
            (reviewData.content ? '<div class="dash-review-view-message">' + escapeHTML(reviewData.content) + '</div>' : '') +
            (dateStr ? '<div class="dash-review-view-date">' + dateStr + '</div>' : '') +
            '</div>';

        document.body.appendChild(modal);
        requestAnimationFrame(function () { modal.classList.add('is-active'); });

        function close() {
            modal.classList.remove('is-active');
            setTimeout(function () { modal.remove(); }, 300);
        }
        modal.querySelector('.dash-review-view-close').addEventListener('click', close);
        modal.querySelector('.dash-review-overlay').addEventListener('click', close);
    }

    /* ================= AUTO-BIND FUNCTIONS ================= */

    /** Bind write-review buttons (class contains --review, has data-apt-id) */
    function bindWriteButtons() {
        document.querySelectorAll('[data-apt-id].dash-apt-action-btn--review, [data-apt-id].dash-past-btn--review').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                openWriteModal(btn.dataset.aptId, btn.dataset.doctor, btn.dataset.service);
            });
        });
    }

    /** Bind view-review buttons (has data-review-json) */
    function bindViewButtons() {
        document.querySelectorAll('[data-review-json]').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                var data;
                try { data = JSON.parse(btn.dataset.reviewJson); } catch (ex) { return; }
                openViewModal(data, btn.dataset.doctor || '', btn.dataset.service || '');
            });
        });
    }

    /** Bind all review buttons at once */
    function bindAll() {
        bindWriteButtons();
        bindViewButtons();
    }

    return {
        jalaliDate: jalaliDate,
        escapeHTML: escapeHTML,
        escapeAttr: escapeAttr,
        openWriteModal: openWriteModal,
        openViewModal: openViewModal,
        bindWriteButtons: bindWriteButtons,
        bindViewButtons: bindViewButtons,
        bindAll: bindAll
    };
})();
