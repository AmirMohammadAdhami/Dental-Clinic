/**
 * Dentura — Team Page Interactions
 * Filter pills, search, custom dropdown
 */

document.addEventListener('DOMContentLoaded', function () {
  var teamGrid = document.getElementById('teamGrid');
  if (!teamGrid) return;

  var cards = Array.from(teamGrid.querySelectorAll('.team-doctor-card'));
  var pills = Array.from(document.querySelectorAll('.team-filter-pill'));
  var searchInput = document.getElementById('teamSearchInput');
  var noResults = document.getElementById('teamNoResults');

  /* Custom Dropdown */
  var dropdown = document.getElementById('teamServiceDropdown');
  var dropdownTrigger = document.getElementById('teamDropdownTrigger');
  var dropdownMenu = document.getElementById('teamDropdownMenu');
  var dropdownValue = dropdownTrigger ? dropdownTrigger.querySelector('.team-dropdown-value') : null;
  var dropdownItems = dropdownMenu ? Array.from(dropdownMenu.querySelectorAll('.team-dropdown-item')) : [];
  var selectedService = '';
  var activeFilter = 'all';

  function applyFilters() {
    var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    var visible = 0;

    cards.forEach(function (card, idx) {
      var specialty = card.getAttribute('data-specialty') || '';
      var name = (card.querySelector('.team-card-name') || {}).textContent || '';
      var cardSpecialty = (card.querySelector('.team-card-specialty') || {}).textContent || '';
      var text = (name + ' ' + cardSpecialty).toLowerCase();

      var matchFilter = activeFilter === 'all' || specialty === activeFilter;
      var matchSearch = !query || text.indexOf(query) !== -1;
      var matchService = !selectedService || specialty === selectedService;

      var show = matchFilter && matchSearch && matchService;

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

  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      pills.forEach(function (p) { p.classList.remove('is-active'); p.setAttribute('aria-selected', 'false'); });
      pill.classList.add('is-active');
      pill.setAttribute('aria-selected', 'true');
      activeFilter = pill.getAttribute('data-filter');
      applyFilters();
    });
  });

  if (searchInput) searchInput.addEventListener('input', applyFilters);

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('is-open');
      dropdownTrigger.setAttribute('aria-expanded', isOpen);
    });

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

    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('is-open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    dropdownMenu.addEventListener('click', function (e) { e.stopPropagation(); });
  }
});
