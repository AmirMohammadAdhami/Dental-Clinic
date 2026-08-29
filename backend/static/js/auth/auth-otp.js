/**
 * OTP Verification Flow
 * OTP box interactions, circular timer, phone display, natural form submit
 */
(function () {
  var otpForm = document.getElementById('otpForm');
  if (!otpForm) return;
  var boxes = document.querySelectorAll('.auth-otp-input');
  if (!boxes.length) return;

  var timerEl = document.getElementById('otpTimerText');
  var timerCircle = document.getElementById('otpTimerCircle');
  var submitBtn = document.getElementById('otpSubmitBtn');
  var phoneEl = document.getElementById('otpPhone');

  var seconds = 119;
  var timerInterval = null;
  var CIRCUMFERENCE = 2 * Math.PI * 16; // r=16

  // Display phone number — use template variable from data attribute
  if (phoneEl) {
    var rawPhone = phoneEl.getAttribute('data-raw-phone');
    if (rawPhone && rawPhone.length >= 7) {
      var masked = rawPhone.slice(0, 4) + '***' + rawPhone.slice(-3);
      phoneEl.textContent = masked;
    }
  }

  // Farsi to English helper
  function toEnDigits(str) {
    return str.replace(/[۰-۹]/g, function (d) {
      return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    });
  }

  function toFa(n) {
    var fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(n).split('').map(function (d) { return fa[parseInt(d)] || d; }).join('');
  }

  function moveToNext(idx) {
    if (idx < boxes.length - 1) {
      setTimeout(function () { boxes[idx + 1].focus(); }, 10);
    }
  }

  function autoSubmitIfComplete() {
    var code = '';
    boxes.forEach(function (b) { code += b.value; });
    if (code.length === boxes.length) {
      // Trigger form submit (natural POST to Django)
      otpForm.submit();
    }
  }

  function updateFilled(box) {
    if (box.value) box.classList.add('filled');
    else box.classList.remove('filled');
  }

  // OTP box interactions
  for (var i = 0; i < boxes.length; i++) {
    (function (idx) {
      var box = boxes[idx];

      box.addEventListener('input', function () {
        box.value = toEnDigits(box.value).replace(/[^0-9]/g, '').slice(-1);
        updateFilled(box);
        if (box.value) moveToNext(idx);
        if (idx === boxes.length - 1 && box.value) autoSubmitIfComplete();
      });

      box.addEventListener('keyup', function (e) {
        if (e.key === 'Backspace' && !box.value && idx > 0) {
          boxes[idx - 1].value = '';
          updateFilled(boxes[idx - 1]);
          boxes[idx - 1].focus();
        }
      });

      box.addEventListener('focus', function () {
        box.select();
      });

      box.addEventListener('paste', function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
        for (var j = 0; j < Math.min(text.length, boxes.length); j++) {
          boxes[j].value = text[j];
          updateFilled(boxes[j]);
        }
        var last = Math.min(text.length, boxes.length) - 1;
        if (last >= 0) boxes[last].focus();
      });
    })(i);
  }

  // Focus first box on load
  setTimeout(function () { boxes[0].focus(); }, 100);

  // Circular timer
  function startTimer() {
    seconds = 120;
    clearInterval(timerInterval);
    if (timerCircle) timerCircle.style.strokeDashoffset = '0';
    timerInterval = setInterval(function () {
      seconds--;
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      if (timerEl) timerEl.textContent = (m < 10 ? '۰' : '') + toFa(m) + ':' + (s < 10 ? '۰' : '') + toFa(s);
      if (timerCircle) {
        var pct = seconds / 120;
        timerCircle.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct));
      }
      if (seconds <= 0) {
        clearInterval(timerInterval);
        if (timerEl) timerEl.textContent = '';
        if (timerCircle) timerCircle.style.strokeDashoffset = String(CIRCUMFERENCE);
        // Show resend button
        var resendBtn = document.getElementById('otpResendBtn');
        if (resendBtn) resendBtn.disabled = false;
      }
    }, 1000);
  }

  startTimer();

  // Form submit — validate OTP boxes, show loading, submit naturally
  otpForm.addEventListener('submit', function (e) {
    var code = '';
    boxes.forEach(function (b) { code += b.value; });
    if (code.length < boxes.length) {
      e.preventDefault();
      // Focus first empty box
      for (var i = 0; i < boxes.length; i++) {
        if (!boxes[i].value) { boxes[i].focus(); break; }
      }
      return;
    }

    // Show loading spinner (form will submit naturally)
    if (submitBtn) {
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;
    }
  });
})();
