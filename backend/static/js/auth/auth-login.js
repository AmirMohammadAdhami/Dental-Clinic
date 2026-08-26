/**
 * Dentura — Login Step (Phone Input)
 * Handles phone number formatting, validation, and submission
 */

setTimeout(function () {
  var loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  var phoneInput = document.getElementById('loginPhone');
  var submitBtn = document.getElementById('loginSubmitBtn');
  var successEl = document.getElementById('loginSuccess');

  // Farsi to English helper
  function toEnDigits(str) {
    return str.replace(/[۰-۹]/g, function (d) {
      return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    });
  }

  // Phone formatting — Farsi digits to English, numbers only, max 10
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      phoneInput.value = toEnDigits(phoneInput.value).replace(/[^0-9]/g, '').slice(0, 10);
    });
    setTimeout(function () { phoneInput.focus(); }, 200);
  }

  // Form submit
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var val = phoneInput ? phoneInput.value : '';
    if (val.length < 10) return;

    // Show loading
    if (submitBtn) {
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;
    }

    // Simulate sending OTP
    setTimeout(function () {
      if (submitBtn) {
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
      }
      // Show success then redirect to OTP page
      var card = loginForm.closest('.auth-card');
      if (card) loginForm.style.display = 'none';
      if (successEl) successEl.style.display = '';

      setTimeout(function () {
        // Store phone for OTP page (optional)
        try { sessionStorage.setItem('authPhone', val); } catch (e) {}
        window.location.href = loginForm.getAttribute('data-next-url') || 'otp.html';
      }, 1500);
    }, 800);
  });
}, 200);
