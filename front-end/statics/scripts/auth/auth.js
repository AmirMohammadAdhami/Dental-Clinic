/**
 * Dentura — Auth Page Interactions
 * Multi-step flow, OTP, timer, national code validation
 */

document.addEventListener('DOMContentLoaded', function () {
  var authCard = document.getElementById('authCard');
  if (!authCard) return;

  var slides = document.querySelectorAll('.auth-slide');
  var dots = document.querySelectorAll('.auth-dot');
  var progressFill = document.getElementById('authProgressFill');
  var currentStep = 1;
  var userPhone = '';

  // --- Phone Formatting ---
  var phoneInput = document.getElementById('authPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      // Convert Farsi digits to English
      phoneInput.value = phoneInput.value.replace(/[۰-۹]/g, function (d) {
        return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
      }).replace(/[^0-9]/g, '').slice(0, 10);
    });
    setTimeout(function () { phoneInput.focus(); }, 200);
  }

  // --- Step Navigation ---
  function goToStep(step) {
    var oldSlide = document.querySelector('.auth-slide.is-active');
    var newSlide = document.querySelector('.auth-slide[data-step="' + step + '"]');
    if (!oldSlide || !newSlide || oldSlide === newSlide) return;

    oldSlide.classList.remove('is-active');
    oldSlide.classList.add('is-exiting');
    setTimeout(function () {
      oldSlide.classList.remove('is-exiting');
      newSlide.classList.add('is-active');
    }, 300);

    // Update dots
    dots.forEach(function (d, i) {
      d.classList.remove('is-active', 'is-done');
      if (i + 1 < step) d.classList.add('is-done');
      if (i + 1 === step) d.classList.add('is-active');
    });

    // Update progress bar
    if (progressFill) progressFill.style.width = (step / 3 * 100) + '%';
    currentStep = step;

    // Focus first input on new step
    setTimeout(function () {
      if (step === 1 && phoneInput) phoneInput.focus();
      if (step === 2) {
        var firstBox = document.querySelector('.auth-otp-input');
        if (firstBox) firstBox.focus();
      }
      if (step === 3) {
        var fn = document.getElementById('authFirstName');
        if (fn) fn.focus();
        triggerStagger();
      }
    }, 400);
  }

  // --- Step 1: Phone Submit ---
  var step1Form = document.getElementById('authStep1');
  var step1Btn = document.getElementById('authStep1Btn');
  if (step1Form) {
    step1Form.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = phoneInput ? phoneInput.value : '';
      if (val.length < 10) return;
      userPhone = val;
      // Format for display
      var masked = val.slice(0, 4) + '***' + val.slice(-3);
      var otpPhone = document.getElementById('authOtpPhone');
      if (otpPhone) otpPhone.textContent = masked;
      showLoading(step1Btn, function () { goToStep(2); });
    });
  }

  // --- Step 2: OTP ---
  var otpBoxes = document.querySelectorAll('.auth-otp-input');
  var step2Form = document.getElementById('authStep2');
  var step2Btn = document.getElementById('authStep2Btn');
  var backBtn = document.getElementById('authBackToStep1');
  var timerCircle = document.getElementById('authTimerCircle');
  var timerText = document.getElementById('authTimerText');
  var resendBtn = document.getElementById('authResendBtn');
  var timerSeconds = 119;
  var timerInterval = null;
  var CIRCUMFERENCE = 2 * Math.PI * 16;

  if (backBtn) backBtn.addEventListener('click', function (e) { e.preventDefault(); goToStep(1); });

  // Farsi to English helper
  function toEnDigits(str) {
    return str.replace(/[۰-۹]/g, function (d) {
      return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    });
  }

  // OTP Auto-advance
  otpBoxes.forEach(function (box, i) {
    box.addEventListener('input', function () {
      box.value = toEnDigits(box.value).replace(/[^0-9]/g, '').slice(-1);
      if (box.value) {
        box.classList.add('filled');
        if (i < otpBoxes.length - 1) {
          otpBoxes[i + 1].focus();
        } else {
          // Last box filled — auto submit
          setTimeout(function () {
            var code = '';
            otpBoxes.forEach(function (b) { code += b.value; });
            if (code.length === otpBoxes.length) {
              showLoading(step2Btn, function () { goToStep(3); });
            }
          }, 200);
        }
      } else {
        box.classList.remove('filled');
      }
    });
    box.addEventListener('keyup', function (e) {
      if (e.key === 'Backspace' && !box.value && i > 0) {
        otpBoxes[i - 1].value = '';
        otpBoxes[i - 1].classList.remove('filled');
        otpBoxes[i - 1].focus();
      }
    });
    box.addEventListener('focus', function () { box.select(); });
    box.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
      for (var j = 0; j < Math.min(text.length, otpBoxes.length); j++) {
        otpBoxes[j].value = text[j];
        otpBoxes[j].classList.add('filled');
      }
      var last = Math.min(text.length, otpBoxes.length) - 1;
      if (last >= 0) otpBoxes[last].focus();
    });
  });

  // Timer
  function startTimer() {
    timerSeconds = 119;
    resendBtn.disabled = true;
    resendBtn.style.display = 'none';
    if (timerCircle) timerCircle.style.strokeDashoffset = '0';
    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      timerSeconds--;
      var m = Math.floor(timerSeconds / 60);
      var s = timerSeconds % 60;
      if (timerText) timerText.textContent = toFa(m) + ':' + (s < 10 ? '۰' : '') + toFa(s);
      if (timerCircle) {
        var pct = timerSeconds / 119;
        timerCircle.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - pct));
      }
      if (timerSeconds <= 0) {
        clearInterval(timerInterval);
        resendBtn.disabled = false;
        resendBtn.style.display = '';
        if (timerText) timerText.textContent = '';
        if (timerCircle) timerCircle.style.strokeDashoffset = String(CIRCUMFERENCE);
      }
    }, 1000);
  }

  function toFa(n) {
    var fa = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(n).split('').map(function (d) { return fa[parseInt(d)] || d; }).join('');
  }

  if (resendBtn) resendBtn.addEventListener('click', startTimer);
  startTimer();

  // OTP Submit
  if (step2Form) {
    step2Form.addEventListener('submit', function (e) {
      e.preventDefault();
      var code = '';
      otpBoxes.forEach(function (b) { code += b.value; });
      if (code.length < otpBoxes.length) return;
      // Simulate: always go to step 3
      showLoading(step2Btn, function () { goToStep(3); });
    });
  }

  // --- Step 3: Profile ---
  var step3Form = document.getElementById('authStep3');
  var natInput = document.getElementById('authNationalCode');
  var natTick = document.getElementById('authNatTick');

  function triggerStagger() {
    document.querySelectorAll('.auth-slide[data-step="3"] .auth-stagger-item').forEach(function (el) {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    });
  }

  // National code validation
  if (natInput) {
    natInput.addEventListener('input', function () {
      natInput.value = toEnDigits(natInput.value).replace(/[^0-9]/g, '').slice(0, 10);
      if (natInput.value.length === 10 && validateNationalCode(natInput.value)) {
        natInput.classList.add('is-valid');
        if (natTick) natTick.style.display = '';
      } else {
        natInput.classList.remove('is-valid');
        if (natTick) natTick.style.display = 'none';
      }
    });
  }

  function validateNationalCode(code) {
    if (!/^\d{10}$/.test(code)) return false;
    var check = parseInt(code[9]);
    var sum = 0;
    for (var i = 0; i < 9; i++) sum += parseInt(code[i]) * (10 - i);
    var rem = sum % 11;
    return (rem < 2 && check === rem) || (rem >= 2 && check === 11 - rem);
  }

  // Profile Submit -> Success
  if (step3Form) {
    step3Form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fn = document.getElementById('authFirstName');
      var ln = document.getElementById('authLastName');
      var nc = document.getElementById('authNationalCode');
      if (!fn || !fn.value || !ln || !ln.value) return;
      if (!nc || nc.value.length !== 10 || !validateNationalCode(nc.value)) return;
      var btn = step3Form.querySelector('.auth-submit');
      showLoading(btn, function () {
        // Hide slides, show success
        var slidesWrap = document.getElementById('authSlides');
        var progress = document.querySelector('.auth-progress');
        var success = document.getElementById('authSuccess');
        if (slidesWrap) slidesWrap.style.display = 'none';
        if (progress) progress.style.display = 'none';
        if (success) success.style.display = '';
        // Redirect after delay
        setTimeout(function () { window.location.href = 'index.html'; }, 2000);
      });
    });
  }

  // --- Button Loading Helper ---
  function showLoading(btn, callback) {
    if (!btn) { callback(); return; }
    btn.classList.add('is-loading');
    setTimeout(function () {
      btn.classList.remove('is-loading');
      callback();
    }, 800);
  }
});
