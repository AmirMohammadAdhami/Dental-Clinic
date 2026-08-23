/**
 * Dentura — Gallery Page Interactions
 * Lightbox, filtering, scroll reveal, and download.
 */
(function () {
    'use strict';

    /* ================= FILTER BAR ================= */
    (function initFilters() {
        var filterBtns = document.querySelectorAll('.dash-filter-btn');
        var cards = document.querySelectorAll('.dash-img-card');
        var counter = document.querySelector('.dash-page-meta');
        if (!filterBtns.length || !cards.length) return;

        filterBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
                btn.classList.add('is-active');

                var filter = btn.dataset.filter;
                var visibleCount = 0;

                cards.forEach(function (card) {
                    var show = filter === 'all' || card.dataset.type === filter;
                    card.style.display = show ? '' : 'none';
                    if (show) visibleCount++;
                });

                if (counter) {
                    counter.textContent = visibleCount + ' تصویر';
                }

                // Rebuild lightbox image list from visible cards
                allImages.length = 0;
                cards.forEach(function (card) {
                    if (card.style.display === 'none') return;
                    var baAfter = card.querySelector('.ba-after');
                    var imgEl = baAfter || card.querySelector('.dash-img-card-img img');
                    if (imgEl) allImages.push(imgEl.src);
                });
            });
        });
    })();

    /* ================= LIGHTBOX ================= */
    (function initLightbox() {
        var lightbox = document.getElementById('dashLightbox');
        if (!lightbox) return;

        var overlay = lightbox.querySelector('.dash-lightbox-overlay');
        var img = lightbox.querySelector('.dash-lightbox-img');
        var closeBtn = lightbox.querySelector('.dash-lightbox-close');
        var prevBtn = lightbox.querySelector('.dash-lightbox-prev');
        var nextBtn = lightbox.querySelector('.dash-lightbox-next');
        var counterEl = lightbox.querySelector('.dash-lightbox-counter');

        var allImages = [];
        var currentIndex = 0;

        // Build image list from visible cards (use ba-after if present, otherwise first img)
        document.querySelectorAll('.dash-img-card').forEach(function (card) {
            var baAfter = card.querySelector('.ba-after');
            var imgEl = baAfter || card.querySelector('.dash-img-card-img img');
            if (imgEl) {
                allImages.push(imgEl.src);
            }
        });

        function open(index) {
            currentIndex = index;
            img.src = allImages[currentIndex];
            counterEl.textContent = (currentIndex + 1) + ' / ' + allImages.length;
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
            counterEl.textContent = (currentIndex + 1) + ' / ' + allImages.length;
        }

        // Open from zoom buttons
        document.querySelectorAll('.dash-img-zoom').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var card = btn.closest('.dash-img-card');
                var visibleCards = Array.from(document.querySelectorAll('.dash-img-card')).filter(function (c) {
                    return c.style.display !== 'none';
                });
                var idx = visibleCards.indexOf(card);
                if (idx >= 0) open(idx);
            });
        });

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', close);
        prevBtn.addEventListener('click', function () { navigate(-1); });
        nextBtn.addEventListener('click', function () { navigate(1); });

        document.addEventListener('keydown', function (e) {
            if (!lightbox.classList.contains('is-active')) return;
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowLeft') navigate(1);   // RTL: left = next
            if (e.key === 'ArrowRight') navigate(-1);  // RTL: right = prev
        });
    })();

    /* ================= DOWNLOAD ================= */
    (function initDownload() {
        document.querySelectorAll('.dash-img-download').forEach(function (btn) {
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

                // Visual feedback
                btn.classList.add('downloading');
                var orig = btn.innerHTML;
                btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
                setTimeout(function () {
                    btn.classList.remove('downloading');
                    btn.innerHTML = orig;
                }, 1500);
            });
        });
    })();

    /* ================= BEFORE-AFTER SLIDER ================= */
    (function initBA() {
        document.querySelectorAll('[data-ba]').forEach(function (card) {
            if (card._baInit) return;
            card._baInit = true;
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
            card.addEventListener('mousedown', function (e) {
                // Don't intercept clicks on buttons
                if (e.target.closest('button')) return;
                isDragging = true; updateFromPointer(e.clientX);
            });
            card.addEventListener('touchstart', function (e) {
                if (e.target.closest('button')) return;
                isDragging = true; updateFromPointer(e.touches[0].clientX);
            }, { passive: true });
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

    /* ================= SCROLL REVEAL ================= */
    (function initScrollReveal() {
        var cards = document.querySelectorAll('.dash-img-card');
        if (!cards.length) return;

        if (!('IntersectionObserver' in window)) {
            cards.forEach(function (c) { c.style.opacity = '1'; c.style.transform = 'none'; });
            return;
        }

        // Initially hide cards
        cards.forEach(function (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
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
    })();

    /* ================= HEADER SCROLL ================= */
    (function initHeaderScroll() {
        var header = document.querySelector('.dash-header');
        if (!header) return;
        var ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    header.classList.toggle('is-scrolled', window.scrollY > 30);
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    })();

})();
