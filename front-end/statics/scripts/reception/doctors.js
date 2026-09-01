/**
 * Dentora — پنل پذیرش: صفحه لیست پزشکان (فقط خواندنی)
 */
(function () {
  'use strict';

  var grid = document.getElementById('doctorGrid');
  var doctors = ReceptionData.doctors;

  grid.innerHTML = doctors.map(function (d) {
    return '<div class="rc-doc-card">' +
      '<img class="rc-doc-avatar" src="' + d.avatar + '" alt="' + d.name + '" onerror="this.src=\'../../assets/hero/clinic-detail.jpg\'">' +
      '<div class="rc-doc-name">' + d.name + '</div>' +
      '<div class="rc-doc-meta">شماره نظام: ' + d.licenseNo + '</div>' +
      '<div class="rc-doc-meta" dir="ltr" style="margin-top:4px">تلفن: ' + d.phone + '</div>' +
    '</div>';
  }).join('');

})();
