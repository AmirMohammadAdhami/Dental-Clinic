/**
 * Dentura — Team Page Interactions
 * Filter pills, search, custom dropdown — powered by API
 */

document.addEventListener('DOMContentLoaded', function () {
  var teamGrid = document.getElementById('teamGrid');
  if (!teamGrid) return;

  var pills = Array.from(document.querySelectorAll('.team-filter-pill'));
  var filtersContainer = document.getElementById('teamFilters');
  var searchInput = document.getElementById('teamSearchInput');
  var noResults = document.getElementById('teamNoResults');

  /* Custom Dropdown */
  var dropdown = document.getElementById('teamServiceDropdown');
  var dropdownTrigger = document.getElementById('teamDropdownTrigger');
  var dropdownMenu = document.getElementById('teamDropdownMenu');
  var dropdownValue = dropdownTrigger ? dropdownTrigger.querySelector('.team-dropdown-value') : null;

  var doctors = [];
  var services = [];
  var selectedService = '';
  var activeFilter = 'all';

  /* ─── Helper: normalize DRF pagination ─── */
  function toArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
  }

  /* ─── Helper: convert to Persian digits ─── */
  function toPersianNum(num) {
    var persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/\d/g, function (d) { return persianDigits[d]; });
  }

  /* ─── Helper: format working_days to string ─── */
  function formatDays(days) {
    if (!days) return '';
    // اگه آریه بود (آرایه انگلیسی روزها)
    if (Array.isArray(days)) {
      var dayMap = {
        'Saturday': 'شنبه', 'Sunday': 'یکشنبه', 'Monday': 'دوشنبه',
        'Tuesday': 'سه‌شنبه', 'Wednesday': 'چهارشنبه', 'Thursday': 'پنجشنبه', 'Friday': 'جمعه'
      };
      var mapped = days.map(function (d) { return dayMap[d] || d; });
      return 'حضور: ' + mapped.join('، ');
    }
    // اگه رشته بود مستقیم برگردون
    return 'حضور: ' + days;
  }

  /* ─── Helper: star SVG ─── */
  var starSvg = '<svg class="team-card-star" width="14" height="14" viewBox="0 0 20 20" fill="#f59e0b"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';

  /* ═══════════════════════════════════════════
     Fetch services and populate filters + dropdown
     ═══════════════════════════════════════════ */
  async function fetchAndRenderServices() {
    try {
      var res = await fetch('/api/services/');
      if (!res.ok) throw new Error('Services API not OK');
      services = toArray(await res.json());

      // Populate filter pills
      if (filtersContainer) {
        services.forEach(function (svc) {
          var pill = document.createElement('button');
          pill.className = 'team-filter-pill';
          pill.setAttribute('data-filter', svc.name);
          pill.setAttribute('role', 'tab');
          pill.setAttribute('aria-selected', 'false');
          pill.textContent = svc.name;
          filtersContainer.appendChild(pill);
        });

        // Re-bind pill click events (including the "همه" pill)
        pills = Array.from(filtersContainer.querySelectorAll('.team-filter-pill'));
        pills.forEach(function (pill) {
          pill.addEventListener('click', function () {
            pills.forEach(function (p) { p.classList.remove('is-active'); p.setAttribute('aria-selected', 'false'); });
            pill.classList.add('is-active');
            pill.setAttribute('aria-selected', 'true');
            activeFilter = pill.getAttribute('data-filter');
            applyFilters();
          });
        });
      }

      // Populate dropdown menu
      if (dropdownMenu) {
        services.forEach(function (svc) {
          var li = document.createElement('li');
          li.className = 'team-dropdown-item';
          li.setAttribute('data-value', svc.name);
          li.setAttribute('role', 'option');
          li.textContent = svc.name;
          dropdownMenu.appendChild(li);
        });

        // Re-bind dropdown item click events
        var dropdownItems = Array.from(dropdownMenu.querySelectorAll('.team-dropdown-item'));
        dropdownItems.forEach(function (item) {
          item.addEventListener('click', function () {
            dropdownItems.forEach(function (i) { i.classList.remove('is-selected'); });
            item.classList.add('is-selected');
            selectedService = item.getAttribute('data-value');
            if (dropdownValue) dropdownValue.textContent = item.textContent;
            dropdown.classList.remove('is-open');
            dropdownTrigger.setAttribute('aria-expanded', 'false');
            applyFilters();
          });
        });
      }
    } catch (err) {
      console.error('خطا در دریافت لیست خدمات:', err);
    }
  }

  /* ═══════════════════════════════════════════
     Fetch doctors and render cards
     ═══════════════════════════════════════════ */
  async function fetchAndRenderDoctors() {
    if (!teamGrid) return;

    try {
      var res = await fetch('/api/doctors/');
      if (!res.ok) throw new Error('Doctors API not OK');
      var raw = await res.json();
      doctors = toArray(raw);

      teamGrid.innerHTML = '';

      doctors.forEach(function (doc) {
        var photoUrl = (doc.doctor_photos && doc.doctor_photos.profile_photo) || '/static/images/doctors/default.jpg';

        // --- Rating ---
        // --- Rating & Experience in one line ---
        var rating = parseFloat(doc.rating) || 0;
        var ratingText = '';
        if (rating > 0) {
          var roundedRating = Math.round(rating * 10) / 10;
          ratingText = starSvg + ' ' + toPersianNum(roundedRating) + ' از ۵';
        } else {
          ratingText = '<span class="team-card-rating--none">بدون امتیاز!</span>';
        }
        var statsHtml = '<div class="team-card-stats">' +
          '<span class="team-card-stat team-card-rating">' + ratingText + '</span>' +
          '<span class="team-card-stat">' + starSvg + ' ' + toPersianNum(doc.years_of_experience || 0) + ' سال تجربه</span>' +
        '</div>';

        // --- Services capsules ---
        var servicesHtml = '';
        if (doc.services_offered && doc.services_offered.length > 0) {
          servicesHtml = '<div class="team-card-services">';
          doc.services_offered.forEach(function (svc) {
            servicesHtml += '<span class="team-card-service-pill">' + svc.name + '</span>';
          });
          servicesHtml += '</div>';
        }

        // --- Working days ---
        var daysHtml = doc.working_days && doc.working_days.length > 0
          ? '<p class="team-card-days">' + formatDays(doc.working_days) + '</p>'
          : '';

        // --- data-services for filtering ---
        var serviceNames = (doc.services_offered || []).map(function (s) { return s.name; });

        var card = document.createElement('div');
        card.className = 'team-doctor-card';
        card.setAttribute('data-services', JSON.stringify(serviceNames));

        card.innerHTML =
          '<a href="/doctors/' + doc.slug + '/" class="team-card-link" aria-label="مشاهده پروفایل دکتر ' + doc.full_name + '">' +
            '<div class="team-card-img-wrap">' +
              '<img src="' + photoUrl + '" alt="دکتر ' + doc.full_name + '" class="team-card-img" loading="lazy">' +
            '</div>' +
            '<div class="team-card-body">' +
              '<div class="team-card-header">' +
                '<h3 class="team-card-name">دکتر ' + doc.full_name + '</h3>' +
                '<p class="team-card-specialty">' + (doc.speciality || '') + '</p>' +
              '</div>' +
              servicesHtml +
              statsHtml +
              daysHtml +
            '</div>' +
            '<div class="team-card-actions">' +
              '<span class="btn btn-primary btn-sm team-card-btn">مشاهده پروفایل و رزرو نوبت</span>' +
            '</div>' +
          '</a>';

        teamGrid.appendChild(card);
      });

      // Re-collect cards after rendering
      cards = Array.from(teamGrid.querySelectorAll('.team-doctor-card'));

    } catch (err) {
      console.error('خطا در دریافت لیست پزشکان:', err);
    }
  }

  /* ═══════════════════════════════════════════
     Filter logic
     ═══════════════════════════════════════════ */
  var cards = [];

  function applyFilters() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var visible = 0;

    cards.forEach(function (card, idx) {
      var cardServices = [];
      try { cardServices = JSON.parse(card.getAttribute('data-services') || '[]'); } catch (e) {}

      var name = (card.querySelector('.team-card-name') || {}).textContent || '';
      var specialty = (card.querySelector('.team-card-specialty') || {}).textContent || '';
      var text = (name + ' ' + specialty + ' ' + cardServices.join(' ')).toLowerCase();

      // Filter by pill (service name)
      var matchFilter = activeFilter === 'all' || cardServices.indexOf(activeFilter) !== -1;
      // Filter by dropdown (service name)
      var matchService = !selectedService || cardServices.indexOf(selectedService) !== -1;
      // Search by name/specialty
      var matchSearch = !query || text.indexOf(query) !== -1;

      var show = matchFilter && matchService && matchSearch;

      if (show) {
        card.classList.remove('team-card-hidden');
        card.style.position = '';
        card.style.visibility = '';
        card.classList.remove('team-card-visible');
        void card.offsetWidth;
        card.classList.add('team-card-visible');
        card.style.animationDelay = (visible * 0.06) + 's';
        visible++;
      } else {
        card.classList.remove('team-card-visible');
        card.classList.add('team-card-hidden');
      }
    });

    if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
  }

  /* ═══════════════════════════════════════════
     Search input
     ═══════════════════════════════════════════ */
  if (searchInput) searchInput.addEventListener('input', applyFilters);

  /* ═══════════════════════════════════════════
     Custom Dropdown
     ═══════════════════════════════════════════ */
  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('is-open');
      dropdownTrigger.setAttribute('aria-expanded', isOpen);
    });

    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('is-open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    dropdownMenu.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  /* ═══════════════════════════════════════════
     Init: fetch data then apply filters
     ═══════════════════════════════════════════ */
  (async function init() {
    await Promise.all([fetchAndRenderServices(), fetchAndRenderDoctors()]);
    applyFilters();
  })();
});
