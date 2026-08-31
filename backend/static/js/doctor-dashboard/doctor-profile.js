/**
 * Dentura — Doctor Panel: Profile (ویرایش پروفایل پزشکی)
 * ۳ تب: اطلاعات پایه / خدمات / مدارک — all via API
 */
(function () {
  'use strict';

  var profileData = null;

  // ================= TABS =================
  var tabs = document.querySelectorAll('#profileTabs .doc-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      var name = tab.getAttribute('data-tab');
      document.querySelectorAll('.doc-tabpanel').forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-panel') === name);
      });
    });
  });

  function setVal(id, v) {
    var el = document.getElementById(id);
    if (el) el.value = v || '';
  }

  // ================= SERVICES CHIPS =================
  var allServices = [];

  function renderServiceChips(selectedIds) {
    var chipsWrap = document.getElementById('serviceChips');
    if (!chipsWrap) return;
    chipsWrap.innerHTML = '';
    apiFetch('GET', '/services/').then(function (services) {
      allServices = services || [];
      allServices.forEach(function (s) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'doc-chip';
        chip.dataset.id = s.id;
        chip.textContent = s.name;
        if (selectedIds && selectedIds.indexOf(s.id) !== -1) {
          chip.classList.add('is-active');
        }
        chip.addEventListener('click', function () { chip.classList.toggle('is-active'); });
        chipsWrap.appendChild(chip);
      });
    }).catch(function () { /* silently fail */ });
  }

  // ================= CERTIFICATES =================
  var certsList = document.getElementById('certsList');

  function addCertRow(cert) {
    var row = document.createElement('div');
    row.className = 'doc-cert-row';
    row.innerHTML =
      '  <div class="doc-field"><label class="doc-label">عنوان گواهینامه</label><input type="text" class="doc-input cert-title" placeholder="مثلاً: دوره ایمپلنت پیشرفته"></div>' +
      '  <div class="doc-field"><label class="doc-label">موسسه / دانشگاه</label><input type="text" class="doc-input cert-org" placeholder="کجا اخذ شده؟"></div>' +
      '  <div class="doc-field"><label class="doc-label">تاریخ اخذ</label><input type="text" class="doc-input cert-date" placeholder="۱۴۰۱"></div>' +
      '  <button type="button" class="doc-iconbtn doc-iconbtn--danger cert-remove" title="حذف مدرک" aria-label="حذف مدرک">' +
      '    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
      '  </button>';

    row.querySelector('.cert-title').value = cert.what || '';
    row.querySelector('.cert-org').value = cert.where || '';
    row.querySelector('.cert-date').value = cert.date || '';

    row.querySelector('.cert-remove').addEventListener('click', function () {
      row.remove();
      docToast('مدرک حذف شد');
    });

    certsList.appendChild(row);
  }

  // ================= LOAD PROFILE =================
  apiFetch('GET', '/doctor-dashboard/profile/').then(function (data) {
    profileData = data;

    setVal('pfFirstName', data.first_name);
    setVal('pfLastName', data.last_name);
    setVal('pfCouncil', data.medical_license_number);
    setVal('pfExperience', data.years_of_experience);
    setVal('pfUniversity', data.university);
    setVal('pfSpeciality', data.speciality);
    setVal('pfBio', data.bio);

    // Service chips
    var selectedServiceIds = (data.services_offered || []).map(function (s) { return s.id; });
    renderServiceChips(selectedServiceIds);

    // Certificates
    if (certsList) {
      (data.certificates || []).forEach(function (c) { addCertRow(c); });
    }
  }).catch(function () {
    docToast('خطا در بارگذاری پروفایل', 'error');
  });

  // ================= ADD CERT =================
  if (certsList) {
    var addBtn = document.getElementById('addCert');
    if (addBtn) addBtn.addEventListener('click', function () {
      addCertRow({});
      docToast('مدرک جدید اضافه شد — اطلاعات را تکمیل کنید');
    });
  }

  // ================= SAVE =================
  var form = document.getElementById('profileForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };

      var selectedServices = [];
      document.querySelectorAll('#serviceChips .doc-chip.is-active').forEach(function (c) {
        selectedServices.push(parseInt(c.dataset.id, 10));
      });

      var payload = {
        first_name: g('pfFirstName'),
        last_name: g('pfLastName'),
        years_of_experience: parseInt(g('pfExperience'), 10) || 0,
        university: g('pfUniversity'),
        speciality: g('pfSpeciality'),
        bio: g('pfBio'),
        services_offered: selectedServices,
      };

      apiFetch('PUT', '/doctor-dashboard/profile/', payload).then(function () {
        docToast('پروفایل پزشکی با موفقیت ذخیره شد ✅');
        // Reload sidebar info
        apiFetch('GET', '/doctor-dashboard/profile/').then(function (data) {
          var sideName = document.getElementById('docSideName');
          var sideRole = document.getElementById('docSideRole');
          if (sideName) sideName.textContent = data.full_name || '—';
          if (sideRole) sideRole.textContent = data.speciality || '—';
        });
      }).catch(function (err) {
        var msg = 'خطا در ذخیره پروفایل';
        if (err && err.data) {
          msg = err.data.detail || msg;
        }
        docToast(msg, 'error');
      });
    });
  }
})();
