/**
 * OTP Standalone Flow (otp.html)
 * OTP boxes, circular timer, resend, phone display
 */

setTimeout(function () {
  var otpForm = document.getElementById('otpForm');
  if (!otpForm) return;
  var boxes = document.querySelectorAll('.auth-otp-input');
  if (!boxes.length) return;

  var timerEl = document.getElementById('otpTimerText');
  var timerCircle = document.getElementById('otpTimerCircle');
  var resendBtn = document.getElementById('otpResendBtn');
  var phoneEl = document.getElementById('otpPhone');
  var submitBtn = document.getElementById('otpSubmitBtn');
  var successEl = document.getElementById('otpSuccess');

  var seconds = 119;
  var timerInterval = null;
  var CIRCUMFERENCE = 2 * Math.PI * 16; // r=16

  // Display phone from sessionStorage
  try {
    var storedPhone = sessionStorage.getItem('authPhone');
    if (storedPhone && phoneEl) {
      var masked = storedPhone.slice(0, 4) + '***' + storedPhone.slice(-3);
      phoneEl.textContent = masked;
    }
  } catch (e) {}

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
      setTimeout(function () { otpForm.dispatchEvent(new Event('submit')); }, 200);
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
    seconds = 119;
    resendBtn.disabled = true;
    resendBtn.style.display = 'none';
    if (timerCircle) timerCircle.style.strokeDashoffset = '0';
    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      seconds--;
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      if (timerEl) timerEl.textContent = (m < 10 ? '۰' : '') + toFa(m) + ':' + (s < 10 ? '۰' : '') + toFa(s);
      if (timerCircle) {
        var pct = seconds / 119;
        timerCircle.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct));
      }
      if (seconds <= 0) {
        clearInterval(timerInterval);
        resendBtn.disabled = false;
        resendBtn.style.display = '';
        if (timerEl) timerEl.textContent = '';
        if (timerCircle) timerCircle.style.strokeDashoffset = String(CIRCUMFERENCE);
      }
    }, 1000);
  }

  if (resendBtn) resendBtn.addEventListener('click', function () {
    startTimer();
  });

  startTimer();

  // Form submit
  otpForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = '';
    boxes.forEach(function (b) { code += b.value; });
    if (code.length < boxes.length) return;

    // Show loading
    if (submitBtn) {
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;
    }

    setTimeout(function () {
      if (submitBtn) {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
      }
      // Hide form, show success
      otpForm.style.display = 'none';
      if (successEl) successEl.style.display = '';

      // Redirect to next URL from data attribute or default
      setTimeout(function () {
        var nextUrl = otpForm.getAttribute('data-next-url') || 'login-info.html';
        window.location.href = nextUrl;
      }, 1500);
    }, 800);
  });
}, 200);
