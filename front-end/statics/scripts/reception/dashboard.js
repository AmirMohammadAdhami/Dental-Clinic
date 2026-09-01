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
  function updateKPI() {
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
  }

  updateKPI();

  // ================= WAITING QUEUE =================
  var queue = []; // { id, aptId, patient, doctor, service, time, status: 'waiting'|'called' }

  window.addToQueue = function (id) {
    var a = apt.find(function (x) { return x.id === id; });
    if (!a || a.status === 'arrived' || a.status === 'completed' || a.status === 'cancelled') return;
    // Check if already in queue
    if (queue.some(function (q) { return q.aptId === id; })) return;
    queue.push({
      id: Date.now(),
      aptId: id,
      patient: a.patient,
      doctor: a.doctor,
      service: a.service,
      time: a.time,
      status: 'waiting'
    });
    a.status = 'arrived';
    renderQueue();
    renderTable();
    updateKPI();
  };

  window.callPatient = function (qid) {
    var item = queue.find(function (q) { return q.id === qid; });
    if (!item) return;
    item.status = 'called';
    renderQueue();
    // Update table badge
    var btn = document.querySelector('.rc-btn--arrive[data-apt="' + item.aptId + '"]');
    if (btn) {
      btn.className = 'rc-btn--arrive rc-btn--called';
      btn.innerHTML = '📢 صدا زده شد';
    }
  };

  window.removeFromQueue = function (qid) {
    queue = queue.filter(function (q) { return q.id !== qid; });
    renderQueue();
  };

  function renderQueue() {
    var grid = document.getElementById('queueGrid');
    var empty = document.getElementById('queueEmpty');
    var countEl = document.getElementById('queueCount');
    if (!grid) return;

    if (queue.length === 0) {
      grid.innerHTML = '';
      empty.classList.add('is-visible');
      countEl.textContent = 'هنوز بیماری در صف نیست';
      return;
    }

    empty.classList.remove('is-visible');
    countEl.textContent = queue.length + ' بیمار در انتظار';

    // Group by doctor
    var groups = {};
    queue.forEach(function (q) {
      if (!groups[q.doctor]) groups[q.doctor] = [];
      groups[q.doctor].push(q);
    });

    var html = '';
    Object.keys(groups).forEach(function (doc, gi) {
      var patients = groups[doc];
      html += '<div class="rc-queue-doctor" style="animation-delay:' + (gi * 0.08) + 's">';
      html += '<div class="rc-queue-doctor-head">';
      html += '<div class="rc-queue-doctor-dot"></div>';
      html += '<div class="rc-queue-doctor-name">' + doc + '</div>';
      html += '<div class="rc-queue-doctor-count">' + patients.length + '</div>';
      html += '</div>';
      html += '<div class="rc-queue-patients">';
      patients.forEach(function (p, i) {
        var isNext = i === 0 && p.status === 'waiting';
        var cls = 'rc-queue-card' + (isNext ? ' is-next' : '');
        html += '<div class="' + cls + '" style="animation-delay:' + (i * 0.06) + 's">';
        html += '<div class="rc-queue-num">' + (i + 1) + '</div>';
        html += '<div class="rc-queue-info">';
        html += '<div class="rc-queue-name">' + p.patient + '</div>';
        html += '<div class="rc-queue-service">' + p.service + ' — ' + p.time + '</div>';
        html += '</div>';
        if (p.status === 'waiting') {
          html += '<button class="rc-queue-call-btn" onclick="callPatient(' + p.id + ')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>صدا زدن</button>';
        } else {
          html += '<button class="rc-queue-call-btn rc-btn--called" disabled><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>صدا زده شد</button>';
        }
        html += '</div>';
      });
      html += '</div></div>';
    });

    grid.innerHTML = html;
  }

  // --- TABLE ---
  function renderTable() {
    var tbody = document.getElementById('todayBody');
    tbody.innerHTML = apt.map(function (a) {
      var priceFormatted = a.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      var canArrive = (a.status === 'pending' || a.status === 'confirmed');
      var isQueued = queue.some(function (q) { return q.aptId === a.id; });
      var queuedItem = queue.find(function (q) { return q.aptId === a.id; });

      var actionHtml = '';
      if (canArrive && !isQueued) {
        actionHtml = '<button class="rc-btn--arrive" data-apt="' + a.id + '" onclick="addToQueue(' + a.id + ')"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>حاضر شد</button>';
      } else if (isQueued && queuedItem && queuedItem.status === 'waiting') {
        actionHtml = '<span class="rc-queue-badge rc-queue-badge--waiting">🔔 در صف</span>';
      } else if (isQueued && queuedItem && queuedItem.status === 'called') {
        actionHtml = '<span class="rc-queue-badge rc-queue-badge--called">📢 صدا زده شد</span>';
      } else {
        actionHtml = '<button class="rc-btn rc-btn--ghost rc-btn--sm" onclick="showAptDetail(' + a.id + ')">مشاهده</button>';
      }

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
        '<td>' + actionHtml + '</td>' +
      '</tr>';
    }).join('');
  }

  renderTable();

  // Status change
  tbody.addEventListener('change', function (e) {
    if (e.target.classList.contains('rc-st-select')) {
      var id = parseInt(e.target.dataset.id);
      var aptItem = apt.find(function (a) { return a.id === id; });
      if (aptItem) aptItem.status = e.target.value;
      renderTable();
      updateKPI();
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

  // ================= WIDGETS =================

  /* ── Activity Feed ── */
  var activityLog = ReceptionData.activityLog || [];
  var actList = document.getElementById('activityList');
  var actCount = document.getElementById('activityCount');
  if (actList) {
    actCount.textContent = activityLog.length;
    actList.innerHTML = activityLog.map(function (item, i) {
      return '<li class="rc-activity-item" style="animation-delay:' + (i * 0.06) + 's">' +
        '<div class="rc-activity-icon rc-activity-icon--' + item.color + '">' + item.icon + '</div>' +
        '<div class="rc-activity-text">' + item.text + '</div>' +
        '<div class="rc-activity-time">' + item.time + '</div>' +
      '</li>';
    }).join('');
  }

  /* ── Upcoming Appointments ── */
  var upcoming = ReceptionData.upcomingAppointments || [];
  var upList = document.getElementById('upcomingList');
  var upCount = document.getElementById('upcomingCount');
  if (upList) {
    upCount.textContent = upcoming.length;
    upList.innerHTML = upcoming.map(function (item, i) {
      return '<li class="rc-upcoming-item" style="animation-delay:' + (i * 0.06) + 's">' +
        '<div class="rc-upcoming-time">' + item.time + '</div>' +
        '<div class="rc-upcoming-info">' +
          '<div class="rc-upcoming-patient">' + item.patient + '</div>' +
          '<div class="rc-upcoming-detail">' + item.doctor + '</div>' +
        '</div>' +
        '<div class="rc-upcoming-service">' + item.service + '</div>' +
      '</li>';
    }).join('');
  }

  /* ── Doctor Availability + Waiting ── */
  var docStatus = ReceptionData.doctorAvailability || [];
  var docList = document.getElementById('doctorStatusList');
  var waitEl = document.getElementById('waitingCounter');
  if (docList) {
    var statusLabels = { busy: 'در حال ویزیت', present: 'حاضرر', absent: 'غایب' };
    docList.innerHTML = docStatus.map(function (ds, i) {
      var doc = ReceptionData.doctors.find(function (d) { return d.id === ds.doctorId; });
      var name = doc ? doc.name : 'نامشخص';
      return '<li class="rc-doctor-status-item" style="animation-delay:' + (i * 0.06) + 's">' +
        '<div class="rc-doctor-status-dot rc-doctor-status-dot--' + ds.status + '"></div>' +
        '<div class="rc-doctor-status-name">' + name + '</div>' +
        '<div class="rc-doctor-status-label rc-doctor-status-label--' + ds.status + '">' + statusLabels[ds.status] + '</div>' +
      '</li>';
    }).join('');
  }
  if (waitEl) {
    var wc = ReceptionData.waitingCount || 0;
    waitEl.innerHTML = '<div class="rc-waiting-label">🟢 بیمار در انتظار</div><div class="rc-waiting-num">' + wc + ' نفر</div>';
  }

})();
