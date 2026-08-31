/**
 * Dentura — Doctor Panel: Appointments (نوبت‌ها)
 * لیست نوبت‌ها + فیلتر وضعیت + مشاهده جزئیات + نسخه — all via API
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
  var allAppointments = [];

  var STATUS_MAP = {
    DONE: { label: 'انجام‌شده', cls: 'doc-appt-status--completed' },
    CANCELLED: { label: 'لغوشده', cls: 'doc-appt-status--cancelled' },
    RESERVED: { label: 'پیش‌رو', cls: 'doc-appt-status--upcoming' },
    PENDING: { label: 'معلق', cls: 'doc-appt-status--pending' }
  };

  var STATUS_ORDER = { RESERVED: 0, PENDING: 1, DONE: 2, CANCELLED: 3 };

  var MEDICAL_ICONS = {
    'دیابت نوع ۱': '💉', 'دیابت نوع ۲': '💉', 'فشار خون بالا': '❤️‍🩹',
    'بارداری': '🤰', 'آلرژی به پنی‌سیلین': '⚠️', 'آسم': '🫁'
  };

  function formatDate(isoStr) {
    var d = new Date(isoStr);
    return toPersianNum(d.getFullYear()) + '/' + toPersianNum(String(d.getMonth() + 1).padStart(2, '0')) + '/' + toPersianNum(String(d.getDate()).padStart(2, '0'));
  }

  function formatTime(isoStr) {
    var d = new Date(isoStr);
    return toPersianNum(d.getHours().toString().padStart(2, '0')) + ':' + toPersianNum(d.getMinutes().toString().padStart(2, '0'));
  }

  function getInitials(name) {
    var parts = name.split(' ');
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  }

  function renderList() {
    var filtered = currentFilter === 'all' ? allAppointments : allAppointments.filter(function (a) { return a.status === currentFilter.toUpperCase(); });
    filtered.sort(function (a, b) { return (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0); });

    if (countEl) {
      countEl.textContent = toPersianNum(filtered.length) + ' نوبت ثبت شده است';
    }

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="doc-empty">هیچ نوبتی با این فیلتر یافت نشد.</div>';
      return;
    }

    var html = '';
    filtered.forEach(function (a) {
      var st = STATUS_MAP[a.status] || STATUS_MAP.PENDING;
      var initials = getInitials(a.patient_name);
      html +=
        '<div class="doc-appt-row" data-id="' + a.id + '">' +
          '<div class="doc-appt-top">' +
            '<div class="doc-appt-patient">' +
              '<div class="doc-appt-patient-avatar">' + initials + '</div>' +
              '<span>' + a.patient_name + '</span>' +
            '</div>' +
            '<div class="doc-appt-status ' + st.cls + '">' +
              '<span class="doc-appt-status-dot"></span>' + st.label +
            '</div>' +
          '</div>' +
          '<div class="doc-appt-info">' +
            '<span>🦷 ' + a.service_name + '</span>' +
            '<span>📅 ' + formatDate(a.appointment_date) + ' — ساعت ' + formatTime(a.appointment_date) + '</span>' +
          '</div>' +
          '<button type="button" class="doc-btn doc-btn--ghost doc-btn--sm doc-appt-detail-btn" data-id="' + a.id + '">👁️ مشاهده اطلاعات</button>' +
        '</div>';
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.doc-appt-detail-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openModal(parseInt(btn.getAttribute('data-id'), 10));
      });
    });
  }

  // ── Filter ──
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      currentFilter = btn.getAttribute('data-filter');
      renderList();
    });
  });

  // ── Modal ──
  var currentApptId = null;

  function openModal(id) {
    var appt = allAppointments.find(function (a) { return a.id === id; });
    if (!appt) return;
    currentApptId = id;

    var st = STATUS_MAP[appt.status] || STATUS_MAP.PENDING;
    modalPatientName.textContent = '📋 نوبت — ' + appt.patient_name;

    modalDetailGrid.innerHTML =
      '<div class="doc-appt-detail-item"><span class="doc-appt-detail-label">نام بیمار</span><span class="doc-appt-detail-value">' + appt.patient_name + '</span></div>' +
      '<div class="doc-appt-detail-item"><span class="doc-appt-detail-label">نوع درمان</span><span class="doc-appt-detail-value">' + appt.service_name + '</span></div>' +
      '<div class="doc-appt-detail-item"><span class="doc-appt-detail-label">تاریخ</span><span class="doc-appt-detail-value">' + formatDate(appt.appointment_date) + '</span></div>' +
      '<div class="doc-appt-detail-item"><span class="doc-appt-detail-label">ساعت</span><span class="doc-appt-detail-value">' + formatTime(appt.appointment_date) + '</span></div>' +
      '<div class="doc-appt-detail-item"><span class="doc-appt-detail-label">کد رهگیری</span><span class="doc-appt-detail-value">' + (appt.tracking_code || '—') + '</span></div>' +
      '<div class="doc-appt-detail-item"><span class="doc-appt-detail-label">وضعیت</span><span class="doc-appt-detail-value"><span class="doc-appt-status ' + st.cls + '"><span class="doc-appt-status-dot"></span>' + st.label + '</span></span></div>';

    // Medical records
    var records = appt.medical_records || [];
    if (records.length === 0) {
      modalMedicalTags.innerHTML = '<span class="doc-medical-empty">سابقه پزشکی خاصی ثبت نشده است.</span>';
    } else {
      modalMedicalTags.innerHTML = records.map(function (r) {
        var icon = MEDICAL_ICONS[r.description] || '🏥';
        return '<span class="doc-medical-tag"><span class="doc-medical-tag-icon">' + icon + '</span>' + r.description + '</span>';
      }).join('');
    }

    modalPrescription.value = appt.prescription_text || '';
    modalEl.classList.add('is-open');
  }

  function closeModal() {
    modalEl.classList.remove('is-open');
    currentApptId = null;
  }

  if (modalClose) modalClose.addEventListener('click', closeModal);
  modalEl.addEventListener('click', function (e) { if (e.target === modalEl) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalEl.classList.contains('is-open')) closeModal();
  });

  // ── Save Prescription ──
  if (modalSaveRx) {
    modalSaveRx.addEventListener('click', function () {
      if (currentApptId === null) return;
      var text = modalPrescription.value.trim();
      apiFetch('PATCH', '/doctor-dashboard/appointments/' + currentApptId + '/prescription/', {
        prescription_text: text
      }).then(function () {
        var appt = allAppointments.find(function (a) { return a.id === currentApptId; });
        if (appt) appt.prescription_text = text;
        docToast('نسخه با موفقیت ذخیره شد.');
      }).catch(function () {
        docToast('خطا در ذخیره نسخه', 'error');
      });
    });
  }

  // ── Load Data ──
  apiFetch('GET', '/doctor-dashboard/appointments/').then(function (data) {
    allAppointments = data || [];
    renderList();
  }).catch(function () {
    listEl.innerHTML = '<div class="doc-empty">خطا در بارگذاری نوبت‌ها</div>';
  });
})();
