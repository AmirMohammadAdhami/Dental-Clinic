/**
 * Dentura — Login Step (Phone Input)
 * Client-side validation + loading state, then natural form submit to Django
 */
(function () {
  var loginForm = document.getElementById('loginForm');
  if (!loginForm) return;

  var phoneInput = document.getElementById('loginPhone');
  var submitBtn = document.getElementById('loginSubmitBtn');

  // Farsi to English helper
  function toEnDigits(str) {
    return str.replace(/[۰-۹]/g, function (d) {
      return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    });
  }

  // Phone formatting — Farsi digits to English, numbers only, max 10
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      phoneInput.value = toEnDigits(phoneInput.value).replace(/[^0-9]/g, '').slice(0, 11);
    });
    setTimeout(function () { phoneInput.focus(); }, 200);
  }

  // Form submit — validate, show loading, then submit to server
  loginForm.addEventListener('submit', function (e) {
    var val = phoneInput ? phoneInput.value : '';
    if (val.length < 11) {
      e.preventDefault();
      if (phoneInput) phoneInput.focus();
      return;
    }

    // Show loading spinner (form will submit naturally)
    if (submitBtn) {
      submitBtn.classList.add('is-loading');
      submitBtn.disabled = true;
    }
  });
})();
