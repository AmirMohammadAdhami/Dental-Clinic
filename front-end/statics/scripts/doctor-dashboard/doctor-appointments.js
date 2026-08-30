/**
 * Dentura — Doctor Panel: Appointments (نوبت‌ها)
 * لیست نوبت‌ها + فیلتر وضعیت + مشاهده جزئیات + نسخه
 */
(function () {
  'use strict';

  var listEl = document.getElementById('appointmentsList');
  var countEl = document.getElementById('appointmentsCount');
  var modalEl = document.getElementById('appointmentModal');
  var modalClose = document.getElementById('modalClose');
  var modalPatientName = document.getElementById('modalPatientName');
  var modalDetailGrid = document.getElementById('modalDetailGrid');
  var modalMedicalTags = document.getElementById('modalMedicalTags');
  var modalPrescription = document.getElementById('modalPrescription');
  var modalSaveRx = document.getElementById('modalSaveRx');
  var filterBtns = document.querySelectorAll('#appointmentFilters .doc-pill');

  if (!listEl) return;

  var currentFilter = 'all';
  var currentApptId = null;

  var STATUS_MAP = {
    completed: { label: 'انجام‌شده', cls: 'doc-appt-status--completed' },
    cancelled: { label: 'لغوشده', cls: 'doc-appt-status--cancelled' },
    upcoming:  { label: 'پیش‌رو', cls: 'doc-appt-status--upcoming' },
    pending:   { label: 'معلق', cls: 'doc-appt-status--pending' }
  };

  var MEDICAL_ICONS = {
    'دیابت نوع ۱': '💉',
    'دیابت نوع ۲': '💉',
    'فشار خون بالا': '❤️‍🩹',
    'بارداری': '🤰',
    'آلرژی به پنی‌سیلین': '⚠️',
    'آسم': '🫁'
  };

  function getInitials(name) {
    var parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  }

  function renderList() {
    var db = DocDB.load();
    var appts = db.appointments || [];

    var filtered = currentFilter === 'all' ? appts : appts.filter(function (a) { return a.status === currentFilter; });

    // مرتب‌سازی: ابتدا پیش‌رو، سپس معلق، سپس انجام‌شده، سپس لغو‌شده
    var statusOrder = { upcoming: 0, pending: 1, completed: 2, cancelled: 3 };
    filtered.sort(function (a, b) { return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0); });

    if (countEl) {
      countEl.textContent = toPersianNum(filtered.length) + ' نوبت ثبت شده است';
    }

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="doc-empty">هیچ نوبتی با این فیلتر یافت نشد.</div>';
      return;
    }

    var html = '';
    filtered.forEach(function (appt) {
      var st = STATUS_MAP[appt.status] || STATUS_MAP.pending;
      var initials = getInitials(appt.patient);
      html +=
        '<div class="doc-appt-row" data-id="' + appt.id + '">' +
          '<div class="doc-appt-top">' +
            '<div class="doc-appt-patient">' +
              '<div class="doc-appt-patient-avatar">' + initials + '</div>' +
              '<span>' + appt.patient + '</span>' +
            '</div>' +
            '<div class="doc-appt-status ' + st.cls + '">' +
              '<span class="doc-appt-status-dot"></span>' +
              st.label +
            '</div>' +
          '</div>' +
          '<div class="doc-appt-info">' +
            '<span>🦷 ' + appt.treatment + '</span>' +
            '<span>📅 ' + appt.date + ' — ساعت ' + appt.time + '</span>' +
          '</div>' +
          '<button type="button" class="doc-btn doc-btn--ghost doc-btn--sm doc-appt-detail-btn" data-id="' + appt.id + '">👁️ مشاهده اطلاعات</button>' +
        '</div>';
    });

    listEl.innerHTML = html;

    // رویداد دکمه مشاهده اطلاعات
    listEl.querySelectorAll('.doc-appt-detail-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(parseInt(btn.getAttribute('data-id'), 10));
      });
    });
  }

  // فیلتر
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      currentFilter = btn.getAttribute('data-filter');
      renderList();
    });
  });

  // مودال
  function openModal(id) {
    var db = DocDB.load();
    var appt = (db.appointments || []).find(function (a) { return a.id === id; });
    if (!appt) return;

    currentApptId = id;

    var st = STATUS_MAP[appt.status] || STATUS_MAP.pending;

    modalPatientName.textContent = '📋 نوبت — ' + appt.patient;

    modalDetailGrid.innerHTML =
      '<div class="doc-appt-detail-item">' +
        '<span class="doc-appt-detail-label">نام بیمار</span>' +
        '<span class="doc-appt-detail-value">' + appt.patient + '</span>' +
      '</div>' +
      '<div class="doc-appt-detail-item">' +
        '<span class="doc-appt-detail-label">نوع درمان</span>' +
        '<span class="doc-appt-detail-value">' + appt.treatment + '</span>' +
      '</div>' +
      '<div class="doc-appt-detail-item">' +
        '<span class="doc-appt-detail-label">تاریخ</span>' +
        '<span class="doc-appt-detail-value">' + appt.date + '</span>' +
      '</div>' +
      '<div class="doc-appt-detail-item">' +
        '<span class="doc-appt-detail-label">ساعت</span>' +
        '<span class="doc-appt-detail-value">' + appt.time + '</span>' +
      '</div>' +
      '<div class="doc-appt-detail-item">' +
        '<span class="doc-appt-detail-label">وضعیت</span>' +
        '<span class="doc-appt-detail-value"><span class="doc-appt-status ' + st.cls + '"><span class="doc-appt-status-dot"></span>' + st.label + '</span></span>' +
      '</div>';

    // پرونده پزشکی
    var records = appt.records || [];
    if (records.length === 0) {
      modalMedicalTags.innerHTML = '<span class="doc-medical-empty">سابقه پزشکی خاصی ثبت نشده است.</span>';
    } else {
      var tagsHtml = '';
      records.forEach(function (r) {
        var icon = MEDICAL_ICONS[r] || '🏥';
        tagsHtml += '<span class="doc-medical-tag"><span class="doc-medical-tag-icon">' + icon + '</span>' + r + '</span>';
      });
      modalMedicalTags.innerHTML = tagsHtml;
    }

    // نسخه
    modalPrescription.value = appt.prescription || '';

    modalEl.classList.add('is-open');
  }

  function closeModal() {
    modalEl.classList.remove('is-open');
    currentApptId = null;
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);

  modalEl.addEventListener('click', function (e) {
    if (e.target === modalEl) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalEl.classList.contains('is-open')) closeModal();
  });

  // ذخیره نسخه
  if (modalSaveRx) {
    modalSaveRx.addEventListener('click', function () {
      if (currentApptId === null) return;
      var db = DocDB.load();
      var appt = (db.appointments || []).find(function (a) { return a.id === currentApptId; });
      if (!appt) return;
      appt.prescription = modalPrescription.value;
      DocDB.save(db);
      docToast('نسخه با موفقیت ذخیره شد.');
    });
  }

  // رندر اولیه
  renderList();
})();
