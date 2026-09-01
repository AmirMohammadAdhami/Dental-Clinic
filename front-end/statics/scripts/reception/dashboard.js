/**
 * Dentora — پنل پذیرش: صفحه داشبورد
 */
(function () {
  'use strict';

  var apt = ReceptionData.todayAppointments;
  var statuses = { confirmed: 'تایید شده', pending: 'در انتظار', arrived: 'پذیرش شده', completed: 'انجام شده', cancelled: 'لغو شده' };
  var selectedPatient = null;

  // ================= JALALI DATE PICKER =================
  var jalaliMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  var persianNums = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  function toFa(n) { return String(n).split('').map(function(c){return persianNums[c]||c;}).join(''); }

  function populateJalali(prefix) {
    var dayEl = document.getElementById(prefix + 'Day');
    var monthEl = document.getElementById(prefix + 'Month');
    var yearEl = document.getElementById(prefix + 'Year');
    if (!dayEl || !monthEl || !yearEl) return;
    for (var d = 1; d <= 31; d++) {
      var o = document.createElement('option');
      o.value = d; o.textContent = toFa(d);
      dayEl.appendChild(o);
    }
    jalaliMonths.forEach(function (m, i) {
      var o = document.createElement('option');
      o.value = i + 1; o.textContent = m;
      monthEl.appendChild(o);
    });
    for (var y = 1400; y <= 1410; y++) {
      var o = document.createElement('option');
      o.value = y; o.textContent = toFa(y);
      yearEl.appendChild(o);
    }
    monthEl.value = '6';
    yearEl.value = '1405';
  }
  populateJalali('apt');

  // ================= POPULATE MODAL DROPDOWNS =================
  var aptDoctor = document.getElementById('aptDoctor');
  var aptService = document.getElementById('aptService');
  if (aptDoctor) {
    ReceptionData.doctors.forEach(function (d) {
      var opt = document.createElement('option');
      opt.value = d.id; opt.textContent = d.name;
      aptDoctor.appendChild(opt);
    });
  }
  if (aptService) {
    ReceptionData.services.forEach(function (s) {
      var opt = document.createElement('option');
      opt.value = s.id; opt.textContent = s.name;
      aptService.appendChild(opt);
    });
    aptService.addEventListener('change', function () {
      var svc = ReceptionData.services.find(function (s) { return s.id == aptService.value; });
      if (svc) document.getElementById('aptAmount').value = svc.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    });
  }

  // ================= PHONE SEARCH =================
  var phoneInput = document.getElementById('aptPhone');
  var phoneResults = document.getElementById('phoneResults');
  var chipContainer = document.getElementById('selectedPatientChip');
  var searchTimer = null;

  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      var q = phoneInput.value.trim().replace(/\D/g, '');
      if (q.length < 3) { hidePhoneResults(); return; }
      searchTimer = setTimeout(function () { searchPatients(q); }, 200);
    });
    phoneInput.addEventListener('focus', function () {
      var q = phoneInput.value.trim().replace(/\D/g, '');
      if (q.length >= 3) searchPatients(q);
    });
    document.addEventListener('click', function (e) {
      if (document.getElementById('phoneWrap') && !document.getElementById('phoneWrap').contains(e.target)) hidePhoneResults();
    });
  }

  function searchPatients(q) {
    var patients = ReceptionData.patients || [];
    var matches = patients.filter(function (p) { return p.phone.replace(/\D/g, '').indexOf(q) !== -1; });
    if (matches.length === 0) {
      phoneResults.innerHTML = '<div class="rc-phone-notfound"><div class="rc-phone-notfound-text">بیماری با شماره «' + phoneInput.value + '» یافت نشد</div><button class="rc-phone-notfound-btn" onclick="openNewPatientFromApt()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>ثبت بیمار جدید</button></div>';
    } else {
      phoneResults.innerHTML = matches.map(function (p) {
        var initials = p.firstName.charAt(0) + p.lastName.charAt(0);
        return '<div class="rc-phone-item" onclick="selectPatient(' + p.id + ')"><div class="rc-phone-item-avatar">' + initials + '</div><div><div class="rc-phone-item-name">' + p.firstName + ' ' + p.lastName + '</div><div class="rc-phone-item-phone">' + p.phone + '</div></div></div>';
      }).join('');
    }
    phoneResults.classList.add('is-open');
  }

  function hidePhoneResults() { if (phoneResults) phoneResults.classList.remove('is-open'); }

  window.selectPatient = function (id) {
    selectedPatient = ReceptionData.patients.find(function (p) { return p.id === id; });
    if (!selectedPatient) return;
    hidePhoneResults();
    phoneInput.value = selectedPatient.phone;
    var initials = selectedPatient.firstName.charAt(0) + selectedPatient.lastName.charAt(0);
    chipContainer.innerHTML = '<div class="rc-selected-patient"><div class="rc-selected-patient-avatar">' + initials + '</div><div class="rc-selected-patient-info"><div class="rc-selected-patient-name">' + selectedPatient.firstName + ' ' + selectedPatient.lastName + '</div><div class="rc-selected-patient-phone">کد ملی: ' + selectedPatient.nationalId + ' | ' + selectedPatient.phone + '</div></div><button class="rc-selected-patient-remove" onclick="removePatient()" title="حذف انتخاب">✕</button></div>';
    phoneInput.style.display = 'none';
    document.querySelector('#phoneWrap .rc-field label').style.display = 'none';
  };

  window.removePatient = function () {
    selectedPatient = null;
    chipContainer.innerHTML = '';
    phoneInput.value = '';
    phoneInput.style.display = '';
    document.querySelector('#phoneWrap .rc-field label').style.display = '';
  };

  window.openNewPatientFromApt = function () {
    hidePhoneResults();
    document.getElementById('npPhone').value = phoneInput.value;
    document.getElementById('newPatientOverlay').classList.add('is-open');
  };

  window.confirmNewPatient = function () {
    var fn = document.getElementById('npFirstName').value.trim();
    var ln = document.getElementById('npLastName').value.trim();
    var nid = document.getElementById('npNationalId').value.trim();
    var ph = document.getElementById('npPhone').value.trim();
    if (!fn || !ln || !nid || !ph) { alert('لطفاً تمام فیلدها را پر کنید'); return; }
    var newP = { id: Date.now(), firstName: fn, lastName: ln, phone: ph, nationalId: nid, appointments: 0, emergencyPhone: '', medicalHistory: [], address: '' };
    ReceptionData.patients.push(newP);
    document.getElementById('newPatientOverlay').classList.remove('is-open');
    selectPatient(newP.id);
    document.getElementById('npFirstName').value = '';
    document.getElementById('npLastName').value = '';
    document.getElementById('npNationalId').value = '';
    document.getElementById('npPhone').value = '';
  };

  window.closeAptModal = function () {
    document.getElementById('createAptOverlay').classList.remove('is-open');
    removePatient();
  };

  window.saveAppointment = function () {
    if (!selectedPatient) { alert('لطفاً ابتدا بیمار را انتخاب کنید'); return; }
    alert('نوبت با موفقیت ثبت شد!\n\nبیمار: ' + selectedPatient.firstName + ' ' + selectedPatient.lastName);
    closeAptModal();
  };

  // --- KPI ---
  var total = apt.length;
  var completed = apt.filter(function (a) { return a.status === 'completed'; }).length;
  var pending = apt.filter(function (a) { return a.status === 'pending' || a.status === 'confirmed'; }).length;
  var cancelled = apt.filter(function (a) { return a.status === 'cancelled'; }).length;

  document.getElementById('kpiGrid').innerHTML =
    '<article class="rc-kpi"><div class="rc-kpi-icon rc-kpi-icon--blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><div><div class="rc-kpi-value">' + total + '</div><div class="rc-kpi-label">نوبت‌های امروز</div></div></article>' +
    '<article class="rc-kpi"><div class="rc-kpi-icon rc-kpi-icon--green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div><div><div class="rc-kpi-value">' + completed + '</div><div class="rc-kpi-label">انجام شده</div></div></article>' +
    '<article class="rc-kpi"><div class="rc-kpi-icon rc-kpi-icon--orange"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div><div class="rc-kpi-value">' + pending + '</div><div class="rc-kpi-label">در انتظار پذیرش</div></div></article>' +
    '<article class="rc-kpi"><div class="rc-kpi-icon rc-kpi-icon--red"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div><div><div class="rc-kpi-value">' + cancelled + '</div><div class="rc-kpi-label">لغو شده</div></div></article>';

  document.getElementById('todayCount').textContent = total + ' نوبت برای امروز ثبت شده است';

  // --- TABLE ---
  var tbody = document.getElementById('todayBody');
  tbody.innerHTML = apt.map(function (a) {
    var priceFormatted = a.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '<tr data-id="' + a.id + '">' +
      '<td><strong>#' + a.id + '</strong></td>' +
      '<td>' + (a.date || 'امروز') + '</td>' +
      '<td>' + a.time + '</td>' +
      '<td>' + a.patient + '</td>' +
      '<td>' + a.doctor + '</td>' +
      '<td>' + a.service + '</td>' +
      '<td>' + priceFormatted + ' تومان</td>' +
      '<td><select class="rc-st-select" data-id="' + a.id + '">' +
        Object.keys(statuses).map(function (k) {
          return '<option value="' + k + '"' + (k === a.status ? ' selected' : '') + '>' + statuses[k] + '</option>';
        }).join('') +
      '</select></td>' +
      '<td><button class="rc-btn rc-btn--ghost rc-btn--sm" onclick="showAptDetail(' + a.id + ')">مشاهده</button></td>' +
    '</tr>';
  }).join('');

  // Status change
  tbody.addEventListener('change', function (e) {
    if (e.target.classList.contains('rc-st-select')) {
      var id = parseInt(e.target.dataset.id);
      var aptItem = apt.find(function (a) { return a.id === id; });
      if (aptItem) aptItem.status = e.target.value;
    }
  });

  // --- APPOINTMENT DETAIL ---
  window.showAptDetail = function (id) {
    var a = apt.find(function (x) { return x.id === id; });
    if (!a) return;
    var priceFormatted = a.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var problems = a.problems.length ? a.problems.join('، ') : 'ندارد';
    document.getElementById('aptDetailBody').innerHTML =
      '<div class="rc-receipt" id="receiptContent">' +
      '<h2>🦷 دنتورا — رسید پذیرش</h2>' +
      '<p class="rc-receipt-sub">تاریخ: امروز — ساعت: ' + a.time + '</p>' +
      '<table>' +
      '<tr><td>کد نوبت</td><td>#' + a.id + '</td></tr>' +
      '<tr><td>نام بیمار</td><td>' + a.patient + '</td></tr>' +
      '<tr><td>پزشک معالج</td><td>' + a.doctor + '</td></tr>' +
      '<tr><td>نوع خدمت</td><td>' + a.service + '</td></tr>' +
      '<tr><td>ساعت</td><td>' + a.time + '</td></tr>' +
      '<tr><td>مشکلات پزشکی</td><td>' + problems + '</td></tr>' +
      '<tr><td>وضعیت</td><td>' + statuses[a.status] + '</td></tr>' +
      '</table>' +
      '<div class="rc-receipt-total">مبلغ قابل پرداخت: ' + priceFormatted + ' تومان</div>' +
      '<div class="rc-receipt-footer">دنتورا — کلینیک تخصصی دندانپزشکی | www.dentura.ir</div>' +
      '</div>' +
      '<div style="margin-top:16px;display:flex;gap:8px">' +
      '<button class="rc-btn rc-btn--primary" onclick="window.print()">🖨️ چاپ رسید</button>' +
      '<button class="rc-btn rc-btn--ghost" onclick="document.getElementById(\'aptDetailOverlay\').classList.remove(\'is-open\')">بستن</button>' +
      '</div>';
    document.getElementById('aptDetailOverlay').classList.add('is-open');
  };

})();
