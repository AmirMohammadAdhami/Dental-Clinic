document.addEventListener('DOMContentLoaded', function () {
    window.scrollTo(0, 0);

    // ================= READING PROGRESS BAR =================
    var progressBar = document.getElementById('readingProgress');
    var postBody = document.getElementById('postBody');

    function updateProgress() {
        if (!progressBar || !postBody) return;
        var rect = postBody.getBoundingClientRect();
        var bodyTop = rect.top + window.scrollY;
        var bodyHeight = rect.height;
        var scrolled = window.scrollY - bodyTop;
        var total = bodyHeight - window.innerHeight;
        var pct = Math.max(0, Math.min(100, (scrolled / total) * 100));
        progressBar.style.width = pct + '%';
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // ================= TABLE OF CONTENTS HIGHLIGHTING =================
    var tocLinks = document.querySelectorAll('.post-toc-link, .post-toc-sub');
    var sections = [];

    tocLinks.forEach(function (link) {
        var id = link.getAttribute('href').replace('#', '');
        var el = document.getElementById(id);
        if (el) sections.push({ id: id, el: el, link: link });
    });

    function updateTocHighlight() {
        var scrollPos = window.scrollY + 120;
        var active = null;

        for (var i = 0; i < sections.length; i++) {
            if (sections[i].el.offsetTop <= scrollPos) {
                active = sections[i];
            }
        }

        tocLinks.forEach(function (l) { l.classList.remove('is-active'); });
        if (active) active.link.classList.add('is-active');
    }

    window.addEventListener('scroll', updateTocHighlight, { passive: true });
    updateTocHighlight();

    // Smooth scroll for TOC links
    tocLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var id = link.getAttribute('href').replace('#', '');
            var el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ================= IMAGE LIGHTBOX =================
    // Create lightbox element
    var lightbox = document.createElement('div');
    lightbox.className = 'post-lightbox';
    lightbox.innerHTML = '<button class="post-lightbox-close" aria-label="بستن"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg></button><img src="" alt="">';
    document.body.appendChild(lightbox);

    var lightboxImg = lightbox.querySelector('img');
    var lightboxClose = lightbox.querySelector('.post-lightbox-close');

    function openLightbox(src, alt) {
        lightboxImg.src = src;
        lightboxImg.alt = alt || '';
        lightbox.classList.add('is-open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('is-open');
        document.body.style.overflow = '';
    }

    // Attach lightbox to featured image and post body images
    var zoomableImages = document.querySelectorAll('.post-featured-img img, .post-body img');
    zoomableImages.forEach(function (img) {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function () {
            openLightbox(img.src, img.alt);
        });
    });

    lightboxClose.addEventListener('click', function (e) {
        e.stopPropagation();
        closeLightbox();
    });

    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
            closeLightbox();
        }
    });

    // ================= MEDIA GALLERY =================
    var gallery = document.getElementById('postGallery');
    if (gallery) {
        var mainImg = document.getElementById('galleryMainImg');
        var mainVideo = document.getElementById('galleryVideo');
        var videoPlayer = mainVideo ? mainVideo.querySelector('video') : null;
        var thumbs = gallery.querySelectorAll('.post-gallery-thumb');
        var prevBtn = document.getElementById('galleryPrev');
        var nextBtn = document.getElementById('galleryNext');
        var currentIndex = 0;

        function showMedia(index) {
            if (index < 0 || index >= thumbs.length) return;
            thumbs[currentIndex].classList.remove('is-active');
            currentIndex = index;
            thumbs[currentIndex].classList.add('is-active');

            var thumb = thumbs[currentIndex];
            var type = thumb.getAttribute('data-type');
            var src = thumb.getAttribute('data-src');

            if (type === 'video') {
                mainImg.style.display = 'none';
                mainVideo.style.display = 'block';
                videoPlayer.src = src;
                videoPlayer.play();
            } else {
                if (videoPlayer) { videoPlayer.pause(); videoPlayer.src = ''; }
                mainVideo.style.display = 'none';
                mainImg.style.display = '';
                mainImg.style.opacity = '0';
                mainImg.src = src;
                mainImg.onload = function () {
                    mainImg.style.transition = 'opacity 0.3s ease';
                    mainImg.style.opacity = '1';
                };
            }
        }

        thumbs.forEach(function (t, i) {
            t.addEventListener('click', function () { showMedia(i); });
        });
        if (prevBtn) prevBtn.addEventListener('click', function () {
            showMedia(currentIndex > 0 ? currentIndex - 1 : thumbs.length - 1);
        });
        if (nextBtn) nextBtn.addEventListener('click', function () {
            showMedia(currentIndex < thumbs.length - 1 ? currentIndex + 1 : 0);
        });
    }

    // ================= COPY LINK =================
    var copyBtn = document.getElementById('copyLinkBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            navigator.clipboard.writeText(window.location.href).then(function () {
                copyBtn.style.background = 'var(--primary)';
                copyBtn.style.color = '#ffffff';
                copyBtn.style.borderColor = 'var(--primary)';
                setTimeout(function () {
                    copyBtn.style.background = '';
                    copyBtn.style.color = '';
                    copyBtn.style.borderColor = '';
                }, 1500);
            });
        });
    }

    // ================= TESTIMONIALS STACKED DECK =================
    var postDeck = document.querySelector('.post-testimonials .testimonials-deck');
    if (postDeck) {
        var postCards = Array.from(postDeck.querySelectorAll('.testimonial-card'));
        var postDotsContainer = document.querySelector('.post-testimonials .testimonials-dots');
        var postPrevBtn = document.querySelector('.post-testimonials .testimonials-prev');
        var postNextBtn = document.querySelector('.post-testimonials .testimonials-next');
        var postTotal = postCards.length;
        var postCurrent = 0;
        var postTimer = null;

        function measurePostDeckHeight() {
            postCards.forEach(function (c) {
                c.style.position = 'relative';
                c.style.visibility = 'hidden';
                c.style.transform = 'none';
                c.style.opacity = '0';
                c.style.zIndex = '1';
            });
            var maxH = 0;
            postCards.forEach(function (c) {
                if (c.scrollHeight > maxH) maxH = c.scrollHeight;
            });
            postDeck.style.height = maxH + 'px';
            postCards.forEach(function (c) {
                c.style.position = '';
                c.style.visibility = '';
                c.style.transform = '';
                c.style.opacity = '';
                c.style.zIndex = '';
            });
        }
        measurePostDeckHeight();

        function updatePostTestimonials() {
            postCards.forEach(function (card, i) {
                var d = i - postCurrent;
                var p = 'hidden';
                if (d === 0) p = 'front';
                else if (d === 1) p = 'next-1';
                else if (d === 2) p = 'next-2';
                else if (d === -1) p = 'prev-1';
                else if (d === -2) p = 'prev-2';
                card.setAttribute('data-pos', p);
            });
            if (postDotsContainer) {
                postDotsContainer.querySelectorAll('.testimonials-dot').forEach(function (d, i) {
                    d.classList.toggle('is-active', i === postCurrent);
                });
            }
            if (postPrevBtn) postPrevBtn.disabled = postCurrent <= 0;
            if (postNextBtn) postNextBtn.disabled = postCurrent >= postTotal - 1;
        }

        function goToPostTestimonial(i) {
            postCurrent = (i + postTotal) % postTotal;
            updatePostTestimonials();
        }

        function schedulePostTestimonials() {
            clearTimeout(postTimer);
            postTimer = setTimeout(function tick() {
                postCurrent = (postCurrent + 1) % postTotal;
                updatePostTestimonials();
                postTimer = setTimeout(tick, 8000);
            }, 8000);
        }

        function buildPostDots() {
            if (!postDotsContainer) return;
            postDotsContainer.innerHTML = '';
            for (var i = 0; i < postTotal; i++) {
                var dot = document.createElement('button');
                dot.type = 'button';
                dot.className = 'testimonials-dot';
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-label', 'رفتن به نظر ' + (i + 1) + ' از ' + postTotal);
                dot.addEventListener('click', (function (idx) {
                    return function () { goToPostTestimonial(idx); schedulePostTestimonials(); };
                })(i));
                postDotsContainer.appendChild(dot);
            }
        }

        if (postPrevBtn) postPrevBtn.addEventListener('click', function () { goToPostTestimonial(postCurrent - 1); schedulePostTestimonials(); });
        if (postNextBtn) postNextBtn.addEventListener('click', function () { goToPostTestimonial(postCurrent + 1); schedulePostTestimonials(); });

        postDeck.addEventListener('mouseenter', function () { clearTimeout(postTimer); });
        postDeck.addEventListener('mouseleave', schedulePostTestimonials);

        var postTx = 0;
        postDeck.addEventListener('touchstart', function (e) { postTx = e.touches[0].clientX; clearTimeout(postTimer); }, { passive: true });
        postDeck.addEventListener('touchend', function (e) {
            var dx = e.changedTouches[0].clientX - postTx;
            if (dx < -50) goToPostTestimonial(postCurrent + 1);
            else if (dx > 50) goToPostTestimonial(postCurrent - 1);
            schedulePostTestimonials();
        }, { passive: true });

        buildPostDots();
        updatePostTestimonials();
        schedulePostTestimonials();
    }

});
