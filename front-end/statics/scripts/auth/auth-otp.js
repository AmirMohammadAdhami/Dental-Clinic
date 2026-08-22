/**
 * OTP Standalone Flow (login.html)
 * Extracted from script.js (lines 1034-1137)
 */

// --- OTP: Boxes, Timer, Resend ---
setTimeout(function () {
  var otpForm = document.getElementById('authOtpForm');
  if (!otpForm) return;
  var boxes = document.querySelectorAll('.auth-otp-input');
  if (!boxes.length) return;
  var timerEl = document.getElementById('authTimerCount');
  var resendBtn = document.getElementById('authResendBtn');
  var seconds = 119;
  var timerInterval = null;

  function moveToNext(idx) {
    if (idx < boxes.length - 1) {
      setTimeout(function () { boxes[idx + 1].focus(); }, 10);
    }
  }
  function moveToPrev(idx) {
    if (idx > 0) {
      setTimeout(function () { boxes[idx - 1].focus(); }, 10);
    }
  }
  function updateFilled(box) {
    if (box.value) box.classList.add('filled');
    else box.classList.remove('filled');
  }

  for (var i = 0; i < boxes.length; i++) {
    (function (idx) {
      var box = boxes[idx];

      box.addEventListener('input', function () {
        box.value = box.value.replace(/[^0-9]/g, '').slice(-1);
        updateFilled(box);
        if (box.value) moveToNext(idx);
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

  // Timer
  function startTimer() {
    seconds = 119;
    resendBtn.disabled = true;
    timerEl.parentElement.style.display = '';
    resendBtn.style.display = 'none';
    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      seconds--;
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      timerEl.textContent = (m < 10 ? '۰' : '') + toFa(m) + ':' + (s < 10 ? '۰' : '') + toFa(s);
      if (seconds <= 0) {
        clearInterval(timerInterval);
        timerEl.parentElement.style.display = 'none';
        resendBtn.style.display = '';
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  function toFa(n) {
    var fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(n).split('').map(function (d) { return fa[parseInt(d)] || d; }).join('');
  }

  if (resendBtn) resendBtn.addEventListener('click', function () {
    startTimer();
  });

  startTimer();

  otpForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = '';
    boxes.forEach(function (b) { code += b.value; });
    if (code.length === boxes.length) {
      window.location.href = 'login-info.html';
    }
  });
}, 200);
