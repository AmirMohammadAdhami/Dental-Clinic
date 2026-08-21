document.addEventListener('DOMContentLoaded', function () {

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

});
