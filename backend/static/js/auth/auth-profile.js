/**
 * Profile Form (login-info.html)
 * National code validation, stagger animation, success state
 */

(function () {
  var profileForm = document.getElementById('profileForm');
  if (!profileForm) return;

  var nationalInput = document.getElementById('profileNationalCode');
  var natTick = document.getElementById('profileNatTick');
  var successEl = document.getElementById('profileSuccess');

  // Farsi to English helper
  function toEnDigits(str) {
    return str.replace(/[۰-۹]/g, function (d) {
      return String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
    });
  }

  // Validate Iranian national code (10-digit with check digit)
  function validateNationalCode(code) {
    if (!/^\d{10}$/.test(code)) return false;
    var check = parseInt(code[9]);
    var sum = 0;
    for (var i = 0; i < 9; i++) sum += parseInt(code[i]) * (10 - i);
    var rem = sum % 11;
    return (rem < 2 && check === rem) || (rem >= 2 && check === 11 - rem);
  }

  // National code input formatting
  if (nationalInput) {
    nationalInput.addEventListener('input', function () {
      nationalInput.value = toEnDigits(nationalInput.value).replace(/[^0-9]/g, '').slice(0, 10);
      if (nationalInput.value.length === 10 && validateNationalCode(nationalInput.value)) {
        nationalInput.classList.add('is-valid');
        if (natTick) natTick.style.display = '';
      } else {
        nationalInput.classList.remove('is-valid');
        if (natTick) natTick.style.display = 'none';
      }
    });
  }

  // Trigger stagger animation on page load
  function triggerStagger() {
    document.querySelectorAll('.auth-stagger-item').forEach(function (el) {
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    });
  }
  triggerStagger();

  // Form submit
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstName = document.getElementById('profileFirstName');
    var lastName = document.getElementById('profileLastName');

    if (!firstName || !firstName.value.trim()) { firstName && firstName.focus(); return; }
    if (!lastName || !lastName.value.trim()) { lastName && lastName.focus(); return; }
    if (!nationalInput || nationalInput.value.length !== 10 || !validateNationalCode(nationalInput.value)) {
      if (nationalInput) { nationalInput.style.borderColor = '#ef4444'; nationalInput.focus(); }
      return;
    }

    // Show loading
    var btn = profileForm.querySelector('.auth-submit');
    if (btn) {
      btn.classList.add('is-loading');
      btn.disabled = true;
    }

    setTimeout(function () {
      if (btn) {
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }
      // Hide form, show success
      profileForm.style.display = 'none';
      if (successEl) successEl.style.display = '';

      // Redirect after delay
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 2000);
    }, 800);
  });
})();
