/**
 * Dentura — Gallery Page (Dynamic)
 * Fetches services + gallery items from API, renders cards,
 * initializes before/after slider, lightbox, filters, download.
 */
(function () {
    'use strict';

    /* ================= CONFIG ================= */
    var GALLERY_API = '/api/gallery/';
    var SERVICES_API = '/api/services/';

    /* ================= STATE ================= */
    var allItems = [];       // full gallery dataset from API
    var visibleItems = [];   // currently visible after filter
    var allImages = [];      // after-image URLs for lightbox (visible only)
    var activeFilter = 'all';

    /* ================= HELPERS ================= */
    function getCookie(name) {
        var parts = document.cookie.split(';');
        for (var i = 0; i < parts.length; i++) {
            var c = parts[i].trim();
            if (c.substring(0, name.length + 1) === name + '=') {
                return decodeURIComponent(c.substring(name.length + 1));
            }
        }
        return '';
    }

    function apiFetch(url) {
        return fetch(url, {
            credentials: 'same-origin',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Accept': 'application/json'
            }
        }).then(function (res) {
            if (!res.ok) throw new Error('API ' + res.status);
            return res.json();
        });
    }

    function formatDate(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long' });
    }

    function esc(str) {
        if (!str) return '';
        var el = document.createElement('span');
        el.textContent = str;
        return el.innerHTML;
    }

    /* ================= DOM REFS ================= */
    var filterBar     = document.getElementById('filterBar');
    var grid          = document.getElementById('galleryGrid');
    var loadingEl     = document.getElementById('galleryLoading');
    var emptyEl       = document.getElementById('galleryEmpty');
    var errorEl       = document.getElementById('galleryError');
    var counterEl     = document.getElementById('galleryCounter');

    /* ================= RENDER: FILTERS ================= */
    function renderFilters(services) {
        if (!filterBar || !services.length) return;
        services.forEach(function (s) {
            var btn = document.createElement('button');
            btn.className = 'dash-filter-btn';
            btn.dataset.filter = s.name;
            btn.textContent = s.name;
            filterBar.appendChild(btn);
        });
        initFilters();
    }

    /* ================= RENDER: CARDS ================= */
    function renderCards(items) {
        if (!grid) return;
        grid.innerHTML = '';

        if (!items.length) {
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = '';
            return;
        }

        var html = '';
        items.forEach(function (item, idx) {
            var beforeUrl = item.before_image || '';
            var afterUrl  = item.after_image  || '';
            var desc      = item.description  || '';
            var svcName   = item.service_name || '';
            var docName   = item.doctor_name  || '';
            var dateStr   = formatDate(item.updated_at);

            html += '<div class="dash-img-card" data-type="' + esc(svcName) + '">'
                + '<div class="dash-img-card-img" data-ba tabindex="0" role="slider" aria-label="مقایسه قبل و بعد ' + esc(svcName) + '">'
                +   '<img class="ba-img ba-after"  src="' + esc(afterUrl)  + '" alt="' + esc(svcName) + ' - بعد">'
                +   '<img class="ba-img ba-before" src="' + esc(beforeUrl) + '" alt="' + esc(svcName) + ' - قبل">'
                +   '<div class="ba-slider"><div class="ba-handle"></div></div>'
                +   '<span class="ba-label ba-label-before">قبل</span>'
                +   '<span class="ba-label ba-label-after">بعد</span>'
                +   '<button class="dash-img-action dash-img-download" data-src="' + esc(afterUrl) + '" aria-label="دانلود تصویر">'
                +     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
                +   '</button>'
                +   '<button class="dash-img-action dash-img-zoom" data-index="' + idx + '" aria-label="بزرگ‌نمایی">'
                +     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>'
                +   '</button>'
                + '</div>'
                + '<div class="dash-img-card-info">'
                +   (desc ? '<p class="dash-img-card-desc">' + esc(desc) + '</p>' : '')
                +   '<div class="dash-img-card-meta">'
                +     '<span class="dash-img-badge">' + esc(svcName) + '</span>'
                +     '<span class="dash-img-card-doctor">' + esc(docName) + '</span>'
                +     '<span class="dash-img-card-date">' + esc(dateStr) + '</span>'
                +   '</div>'
                + '</div>'
                + '</div>';
        });

        grid.innerHTML = html;

        if (loadingEl) loadingEl.style.display = 'none';
        if (emptyEl)   emptyEl.style.display = 'none';

        updateCounter(items.length);
        initBA();
        initLightbox();
        initDownload();
        initScrollReveal();
    }

    function updateCounter(count) {
        if (counterEl) {
            counterEl.textContent = count + ' تصویر';
        }
    }

    /* ================= FILTER ================= */
    function applyFilter(type) {
        activeFilter = type;
        visibleItems = (type === 'all')
            ? allItems.slice()
            : allItems.filter(function (item) { return item.service_name === type; });

        renderCards(visibleItems);
    }

    function initFilters() {
        if (!filterBar) return;
        var btns = filterBar.querySelectorAll('.dash-filter-btn');
        btns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                btns.forEach(function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');
                applyFilter(btn.dataset.filter);
            });
        });
    }

    /* ================= BEFORE-AFTER SLIDER ================= */
    function initBA() {
        document.querySelectorAll('[data-ba]').forEach(function (card) {
            if (card._baInit) return;
            card._baInit = true;
            var beforeImg   = card.querySelector('.ba-before');
            var sliderLine  = card.querySelector('.ba-slider');
            var labelBefore = card.querySelector('.ba-label-before');
            var labelAfter  = card.querySelector('.ba-label-after');
            if (!beforeImg) return;

            var isDragging = false;
            var currentPct = 50;

            function setPosition(pct) {
                currentPct = Math.max(0, Math.min(100, pct));
                beforeImg.style.clipPath = 'inset(0 ' + (100 - currentPct) + '% 0 0)';
                if (sliderLine)  sliderLine.style.left = currentPct + '%';
                if (labelBefore) labelBefore.style.opacity = currentPct > 20 ? '1' : '0';
                if (labelAfter)  labelAfter.style.opacity  = currentPct < 80 ? '1' : '0';
                card.setAttribute('aria-valuenow', Math.round(currentPct));
            }

            function updateFromPointer(x) {
                var rect = card.getBoundingClientRect();
                var pos  = (x - rect.left) / rect.width;
                setPosition(pos * 100);
            }

            card.addEventListener('mousedown', function (e) {
                if (e.target.closest('button')) return;
                isDragging = true;
                updateFromPointer(e.clientX);
            });
            card.addEventListener('touchstart', function (e) {
                if (e.target.closest('button')) return;
                isDragging = true;
                updateFromPointer(e.touches[0].clientX);
            }, { passive: true });

            window.addEventListener('mousemove', function (e) {
                if (isDragging) updateFromPointer(e.clientX);
            });
            window.addEventListener('touchmove', function (e) {
                if (isDragging) updateFromPointer(e.touches[0].clientX);
            }, { passive: true });
            window.addEventListener('mouseup',   function () { isDragging = false; });
            window.addEventListener('touchend',  function () { isDragging = false; });

            card.addEventListener('keydown', function (e) {
                var STEP = 5;
                switch (e.key) {
                    case 'ArrowRight': setPosition(currentPct + STEP); e.preventDefault(); break;
                    case 'ArrowLeft':  setPosition(currentPct - STEP); e.preventDefault(); break;
                    case 'Home': setPosition(0);   e.preventDefault(); break;
                    case 'End':  setPosition(100); e.preventDefault(); break;
                }
            });

            setPosition(50);
        });
    }

    /* ================= LIGHTBOX ================= */
    function initLightbox() {
        var lightbox = document.getElementById('dashLightbox');
        if (!lightbox) return;

        var overlay   = lightbox.querySelector('.dash-lightbox-overlay');
        var img       = lightbox.querySelector('.dash-lightbox-img');
        var closeBtn  = lightbox.querySelector('.dash-lightbox-close');
        var prevBtn   = lightbox.querySelector('.dash-lightbox-prev');
        var nextBtn   = lightbox.querySelector('.dash-lightbox-next');
        var counterEl2 = lightbox.querySelector('.dash-lightbox-counter');

        var currentIndex = 0;

        // Build image list from visible cards
        allImages = [];
        document.querySelectorAll('#galleryGrid .dash-img-card').forEach(function (card) {
            if (card.style.display === 'none') return;
            var baAfter = card.querySelector('.ba-after');
            if (baAfter && baAfter.src) allImages.push(baAfter.src);
        });

        function open(index) {
            currentIndex = index;
            img.src = allImages[currentIndex];
            counterEl2.textContent = (currentIndex + 1) + ' / ' + allImages.length;
            lightbox.classList.add('is-active');
            document.body.style.overflow = 'hidden';
        }

        function close() {
            lightbox.classList.remove('is-active');
            document.body.style.overflow = '';
        }

        function navigate(dir) {
            currentIndex = (currentIndex + dir + allImages.length) % allImages.length;
            img.src = allImages[currentIndex];
            counterEl2.textContent = (currentIndex + 1) + ' / ' + allImages.length;
        }

        // Remove old listeners by replacing elements
        var newZoomBtns = document.querySelectorAll('#galleryGrid .dash-img-zoom');
        newZoomBtns.forEach(function (btn) {
            var newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var card = newBtn.closest('.dash-img-card');
                var visibleCards = Array.from(document.querySelectorAll('#galleryGrid .dash-img-card'))
                    .filter(function (c) { return c.style.display !== 'none'; });
                var idx = visibleCards.indexOf(card);
                if (idx >= 0) open(idx);
            });
        });

        closeBtn.onclick = close;
        overlay.onclick  = close;
        prevBtn.onclick  = function () { navigate(-1); };
        nextBtn.onclick  = function () { navigate(1);  };

        document.onkeydown = function (e) {
            if (!lightbox.classList.contains('is-active')) return;
            if (e.key === 'Escape')     close();
            if (e.key === 'ArrowLeft')  navigate(1);   // RTL
            if (e.key === 'ArrowRight') navigate(-1);
        };
    }

    /* ================= DOWNLOAD ================= */
    function initDownload() {
        document.querySelectorAll('#galleryGrid .dash-img-download').forEach(function (btn) {
            var newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var src = newBtn.dataset.src;
                if (!src) return;

                var a = document.createElement('a');
                a.href = src;
                a.download = src.split('/').pop();
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                newBtn.classList.add('downloading');
                var orig = newBtn.innerHTML;
                newBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                setTimeout(function () {
                    newBtn.classList.remove('downloading');
                    newBtn.innerHTML = orig;
                }, 1500);
            });
        });
    }

    /* ================= SCROLL REVEAL ================= */
    function initScrollReveal() {
        var cards = document.querySelectorAll('#galleryGrid .dash-img-card');
        if (!cards.length) return;

        if (!('IntersectionObserver' in window)) {
            cards.forEach(function (c) { c.style.opacity = '1'; c.style.transform = 'none'; });
            return;
        }

        cards.forEach(function (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)';
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'none';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

        cards.forEach(function (card, i) {
            card.style.transitionDelay = (i % 3) * 0.08 + 's';
            observer.observe(card);
        });
    }

    /* ================= INIT ================= */
    function init() {
        // Fetch services → render filter buttons
        apiFetch(SERVICES_API)
            .then(function (data) {
                var services = Array.isArray(data) ? data : (data.results || []);
                renderFilters(services);
            })
            .catch(function () { /* filters stay with "همه تصاویر" only */ });

        // Fetch gallery → render cards
        apiFetch(GALLERY_API)
            .then(function (data) {
                var items = Array.isArray(data) ? data : (data.results || []);
                allItems = items;
                visibleItems = items.slice();
                renderCards(visibleItems);
            })
            .catch(function () {
                if (loadingEl) loadingEl.style.display = 'none';
                if (errorEl)   errorEl.style.display = '';
            });
    }

    /* ================= BOOT ================= */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
