document.addEventListener('DOMContentLoaded', function () {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ─── Helper: normalize DRF pagination ─── */
  function toArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  /* ═══════════════════════════════════════════
     FAQ Section
     ═══════════════════════════════════════════ */
  async function fetchAndRenderFAQ() {
    var faqList = document.getElementById('faqList');
    if (!faqList) return;

    try {
      var res = await fetch('/api/faqs/');
      if (!res.ok) throw new Error('FAQ API not OK');
      var faqs = toArray(await res.json());

      faqList.innerHTML = '';

      faqs.forEach(function (faq) {
        var treatmentsHtml = '';
        if (faq.categories && faq.categories.length > 0) {
          var links = faq.categories.map(function (cat) {
            return '<a href="/blog/all-articles/?cat=' + encodeURIComponent(cat.name) + '" class="faq-treatment-link">' + cat.name + '</a>';
          }).join('');
          treatmentsHtml =
            '<p class="faq-treatments-label">درمان‌های پیشنهادی:</p>' +
            '<div class="faq-treatments">' + links + '</div>';
        }

        var item = document.createElement('div');
        item.className = 'faq-item';
        item.innerHTML =
          '<button class="faq-question" aria-expanded="false">' +
            '<span>' + faq.question + '</span>' +
            '<span class="faq-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg></span>' +
          '</button>' +
          '<div class="faq-answer">' +
            '<div class="faq-answer-inner">' +
              '<p class="faq-desc">' + faq.answer_text + '</p>' +
              treatmentsHtml +
            '</div>' +
          '</div>';

        faqList.appendChild(item);
      });

      // Bind accordion events after rendering
      bindFAQAccordion();

    } catch (err) {
      console.error('خطا در دریافت سوالات متداول:', err);
    }
  }

  function bindFAQAccordion() {
    var faqBtns = document.querySelectorAll('.faq-question');
    faqBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var isOpen = item.classList.contains('is-open');
        // Close all
        document.querySelectorAll('.faq-item').forEach(function (fi) {
          fi.classList.remove('is-open');
          fi.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        });
        // Toggle current
        if (!isOpen) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ═══════════════════════════════════════════
     Treatments Section
     ═══════════════════════════════════════════ */
  async function fetchAndRenderTreatments() {
    var grid = document.getElementById('treatmentsGrid');
    if (!grid) return;

    try {
      var res = await fetch('/api/services/');
      if (!res.ok) throw new Error('Services API not OK');
      var services = toArray(await res.json());

      grid.innerHTML = '';

      services.forEach(function (svc) {
        var iconUrl = svc.icon || '/static/images/blog-icons/default.jpg';
        var card = document.createElement('a');
        card.href = '/blog/all-articles/?cat=' + encodeURIComponent(svc.name);
        card.className = 'treatment-card';
        card.innerHTML =
          '<div class="treatment-icon"><img src="' + iconUrl + '" alt="' + svc.name + '"></div>' +
          '<span class="treatment-name">' + svc.name + '</span>';

        grid.appendChild(card);
      });

    } catch (err) {
      console.error('خطا در دریافت لیست درمان‌ها:', err);
    }
  }

  /* ═══════════════════════════════════════════
     Init
     ═══════════════════════════════════════════ */
  fetchAndRenderFAQ();
  fetchAndRenderTreatments();
});
