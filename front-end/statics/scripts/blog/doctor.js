/**
 * Dentura — Doctor Profile Page Interactions
 * Persian calendar, booking, time slots, BA filter, star rating, review form
 */

document.addEventListener('DOMContentLoaded', function () {
  /* --- Persian Calendar --- */
  var calDays = document.getElementById('docCalDays');
  var calMonth = document.getElementById('docCalMonth');
  var calPrev = document.getElementById('docCalPrev');
  var calNext = document.getElementById('docCalNext');
  if (calDays && calMonth) {
    var jalaliMonths = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    var today = new Date();
    var jY = today.getFullYear() - 621 + (today.getMonth() < 2 ? 0 : 1);
    var jM = ((today.getMonth() + 9) % 12);
    var calYear = jY, calMonthIdx = jM;

    function renderCalendar() {
      calMonth.textContent = jalaliMonths[calMonthIdx] + ' ' + calYear;
      var daysInMonth = 31;
      if (calMonthIdx >= 6 && calMonthIdx < 11) daysInMonth = 30;
      if (calMonthIdx === 11) daysInMonth = 29;
      var startDay = (calMonthIdx < 6 ? calMonthIdx + 1 : calMonthIdx - 5);
      var offset = (startDay + 1) % 7;
      var html = '';
      for (var i = 0; i < offset; i++) html += '<button class="doc-cal-day is-empty" disabled></button>';
      for (var d = 1; d <= daysInMonth; d++) {
        var isToday = (d === today.getDate() && calMonthIdx === jM && calYear === jY);
        var isPast = (calYear < jY || (calYear === jY && calMonthIdx < jM) || (calYear === jY && calMonthIdx === jM && d < today.getDate()));
        var cls = 'doc-cal-day';
        if (isToday) cls += ' is-today';
        if (isPast) cls += ' is-disabled';
        html += '<button class="' + cls + '"' + (isPast ? ' disabled' : '') + '>' + d + '</button>';
      }
      calDays.innerHTML = html;
      calDays.querySelectorAll('.doc-cal-day:not(.is-disabled):not(.is-empty)').forEach(function (btn) {
        btn.addEventListener('click', function () {
          calDays.querySelectorAll('.doc-cal-day').forEach(function (b) { b.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
        });
      });
    }
    if (calPrev) calPrev.addEventListener('click', function () { calMonthIdx = (calMonthIdx + 11) % 12; if (calMonthIdx === 11) calYear--; renderCalendar(); });
    if (calNext) calNext.addEventListener('click', function () { calMonthIdx = (calMonthIdx + 1) % 12; if (calMonthIdx === 0) calYear++; renderCalendar(); });
    renderCalendar();
  }

  /* --- Booking Type Toggle --- */
  var bookingBtns = document.querySelectorAll('.doc-booking-type-btn');
  bookingBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      bookingBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
    });
  });

  /* --- Time Slots --- */
  var slotBtns = document.querySelectorAll('.doc-slot-btn:not(.is-disabled)');
  slotBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      slotBtns.forEach(function (b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');
    });
  });

  /* --- BA Gallery Filter --- */
  var baPills = document.querySelectorAll('.doc-ba-pill');
  var baCards = document.querySelectorAll('.doc-ba-card');
  baPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      baPills.forEach(function (p) { p.classList.remove('is-active'); });
      pill.classList.add('is-active');
      var f = pill.getAttribute('data-filter');
      baCards.forEach(function (card) {
        if (f === 'all' || card.getAttribute('data-type') === f) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  /* --- Star Rating --- */
  var starBtns = document.querySelectorAll('.doc-star-btn');
  var selectedStars = 0;
  starBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedStars = parseInt(btn.getAttribute('data-star'));
      starBtns.forEach(function (b) {
        var s = parseInt(b.getAttribute('data-star'));
        b.textContent = s <= selectedStars ? '★' : '☆';
        b.classList.toggle('is-active', s <= selectedStars);
      });
    });
  });

  /* --- Review Form --- */
  var reviewForm = document.getElementById('docReviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', function (e) {
      e.preventDefault();
      alert('نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده خواهد شد.');
      reviewForm.reset();
      selectedStars = 0;
      starBtns.forEach(function (b) { b.textContent = '☆'; b.classList.remove('is-active'); });
    });
  }
});

// ================= AUTH PAGE — Premium Flow =================
