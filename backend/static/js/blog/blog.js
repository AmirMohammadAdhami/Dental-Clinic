document.addEventListener('DOMContentLoaded', function() {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    // FAQ accordion
    var faqBtns = document.querySelectorAll('.faq-question');
    faqBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var item = btn.closest('.faq-item');
            var isOpen = item.classList.contains('is-open');
            // Close all
            document.querySelectorAll('.faq-item').forEach(function(fi) {
                fi.classList.remove('is-open');
            });
            // Toggle current
            if (!isOpen) {
                item.classList.add('is-open');
            }
        });
    });
});
