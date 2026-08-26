// Before/After page functionality
// Images are in HTML, JS only handles filtering and slider

document.addEventListener('DOMContentLoaded', function() {
    // Scroll restoration
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // Filter functionality
    var filterBtns = document.querySelectorAll('.ba-filter-btn');
    var cardItems = document.querySelectorAll('.ba-card-item');

    filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Update active state
            filterBtns.forEach(function(b) {
                b.classList.remove('is-active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('is-active');
            btn.setAttribute('aria-selected', 'true');

            var filter = btn.dataset.filter;

            // Filter cards
            cardItems.forEach(function(card) {
                if (filter === 'all' || card.dataset.treatment === filter) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Tag click functionality
    document.addEventListener('click', function(e) {
        var tag = e.target.closest('[data-filter-link]');
        if (!tag) return;
        var target = tag.getAttribute('data-filter-link');
        var btn = document.querySelector('.ba-filter-btn[data-filter="' + target + '"]');
        if (btn) btn.click();
    });

    // Pagination functionality
    var pageBtns = document.querySelectorAll('.ba-page-num');
    pageBtns.forEach(function(b) {
        b.addEventListener('click', function() {
            pageBtns.forEach(function(x) { x.classList.remove('is-active'); });
            b.classList.add('is-active');
        });
    });

    // Before/After slider functionality
    var baContainers = document.querySelectorAll('.ba-container');
    baContainers.forEach(function(container) {
        var slider = container.querySelector('.ba-slider');
        var handle = container.querySelector('.ba-handle');
        var beforeImg = container.querySelector('.ba-before');

        if (!slider || !handle || !beforeImg) return;

        var isDragging = false;

        function updateSlider(x) {
            var rect = container.getBoundingClientRect();
            var pos = (x - rect.left) / rect.width;
            pos = Math.max(0, Math.min(1, pos));

            slider.style.left = (pos * 100) + '%';
            beforeImg.style.clipPath = 'inset(0 ' + ((1 - pos) * 100) + '% 0 0)';
            container.setAttribute('aria-valuenow', Math.round(pos * 100));
        }

        container.addEventListener('mousedown', function(e) {
            isDragging = true;
            updateSlider(e.clientX);
        });

        document.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            e.preventDefault();
            updateSlider(e.clientX);
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
        });

        // Touch support
        container.addEventListener('touchstart', function(e) {
            isDragging = true;
            updateSlider(e.touches[0].clientX);
        });

        container.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            e.preventDefault();
            updateSlider(e.touches[0].clientX);
        });

        container.addEventListener('touchend', function() {
            isDragging = false;
        });

        // Keyboard support
        container.addEventListener('keydown', function(e) {
            var currentVal = parseInt(container.getAttribute('aria-valuenow')) || 50;
            var step = 5;

            if (e.key === 'ArrowLeft') {
                currentVal = Math.min(100, currentVal + step);
            } else if (e.key === 'ArrowRight') {
                currentVal = Math.max(0, currentVal - step);
            } else {
                return;
            }

            e.preventDefault();
            slider.style.left = currentVal + '%';
            beforeImg.style.clipPath = 'inset(0 ' + (100 - currentVal) + '% 0 0)';
            container.setAttribute('aria-valuenow', currentVal);
        });
    });
});
