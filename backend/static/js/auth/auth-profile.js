/**
 * Profile Form (login-info.html)
 * Extracted from script.js (lines 1139-1159)
 */

// --- Profile: National Code Validation ---
(function () {
  var profileForm = document.getElementById('authProfileForm');
  if (!profileForm) return;
  var nationalInput = document.getElementById('authNationalCode');
  if (nationalInput) {
    nationalInput.addEventListener('input', function () {
      nationalInput.value = nationalInput.value.replace(/[^0-9]/g, '');
    });
  }
  profileForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (nationalInput && nationalInput.value.length !== 10) {
      nationalInput.style.borderColor = '#ef4444';
      nationalInput.focus();
      return;
    }
    alert('اطلاعات شما با موفقیت ثبت شد!');
    window.location.href = 'index.html';
  });
})();
