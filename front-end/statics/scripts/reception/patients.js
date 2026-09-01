/**
 * Dentora — پنل پذیرش: صفحه مدیریت بیماران
 */
(function () {
  'use strict';

  var patients = ReceptionData.patients;
  var statuses = { confirmed: 'تایید شده', pending: 'در انتظار', arrived: 'پذیرش شده', completed: 'انجام شده', cancelled: 'لغو شده' };

  document.getElementById('patientCount').textContent = patients.length + ' بیمار ثبت شده';

  var tbody = document.getElementById('patientBody');
  tbody.innerHTML = patients.map(function (p) {
    return '<tr onclick="openDrawer(' + p.id + ')">' +
      '<td><strong>' + p.firstName + ' ' + p.lastName + '</strong></td>' +
      '<td dir="ltr">' + p.phone + '</td>' +
      '<td>' + p.nationalId + '</td>' +
      '<td>' + p.appointments + ' نوبت</td>' +
      '<td><button class="rc-btn rc-btn--ghost rc-btn--sm" onclick="event.stopPropagation();openDrawer(' + p.id + ')">مشاهده پرونده</button></td>' +
    '</tr>';
  }).join('');

  window.openDrawer = function (id) {
    var p = patients.find(function (x) { return x.id === id; });
    if (!p) return;
    document.getElementById('drawerTitle').textContent = p.firstName + ' ' + p.lastName;

    var html = '';
    html += '<div class="rc-drawer-section"><h4>📋 اطلاعات شخصی</h4><div class="rc-drawer-info">';
    html += '<span>شماره همراه: <strong dir="ltr">' + p.phone + '</strong></span>';
    html += '<span>کد ملی: <strong>' + p.nationalId + '</strong></span>';
    html += '<span>آدرس: <strong>' + p.address + '</strong></span>';
    html += '<span>تماس اضطراری: <strong dir="ltr">' + p.emergencyPhone + '</strong></span>';
    html += '</div></div>';

    if (p.medicalHistory.length) {
      html += '<div class="rc-drawer-section"><h4>🩺 سوابق پزشکی</h4><div class="rc-checks" style="pointer-events:none">';
      p.medicalHistory.forEach(function (m) {
        html += '<label><input type="checkbox" checked disabled> ' + m + '</label>';
      });
      html += '</div></div>';
    }

    html += '<div class="rc-drawer-section"><h4>📅 نوبت‌های قبلی</h4>';
    html += '<div class="rc-table-wrap"><table class="rc-table"><thead><tr><th>تاریخ</th><th>پزشک</th><th>خدمت</th><th>وضعیت</th></tr></thead><tbody>';
    p.appointments.forEach(function (a) {
      html += '<tr><td>' + a.date + '</td><td>' + window.rcDoctorName(a.doctorId) + '</td><td>' + window.rcServiceName(a.serviceId) + '</td><td><span class="rc-st ' + window.rcStatusClass(a.status) + '">' + statuses[a.status] + '</span></td></tr>';
    });
    html += '</tbody></table></div></div>';

    html += '<div style="margin-top:16px;display:flex;gap:8px"><button class="rc-btn rc-btn--primary rc-btn--sm" onclick="alert(\'ویرایش اطلاعات بیمار\')">✏️ ویرایش اطلاعات</button></div>';

    document.getElementById('drawerBody').innerHTML = html;
    document.getElementById('drawerOverlay').classList.add('is-open');
    document.getElementById('patientDrawer').classList.add('is-open');
  };

  window.closeDrawer = function () {
    document.getElementById('drawerOverlay').classList.remove('is-open');
    document.getElementById('patientDrawer').classList.remove('is-open');
  };

})();
