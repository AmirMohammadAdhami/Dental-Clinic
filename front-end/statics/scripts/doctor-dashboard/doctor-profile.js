/**
 * Dentura — Doctor Panel: Profile (ویرایش پروفایل پزشکی)
 * ۴ تب: اطلاعات پایه / خدمات و ویدیو / مدارک / برنامه کاری
 */
(function () {
  'use strict';

  var db = DocDB.load();
  var profile = db.profile;

  // ================= TABS =================
  var tabs = document.querySelectorAll('#profileTabs .doc-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('is-active'); });
      tab.classList.add('is-active');
      var name = tab.getAttribute('data-tab');
      document.querySelectorAll('.doc-tabpanel').forEach(function (p) {
        p.classList.toggle('is-active', p.getAttribute('data-panel') === name);
      });
    });
  });

  function readFile(input, cb) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { cb(reader.result); };
    reader.readAsDataURL(file);
  }

  function setVal(id, v) {
    var el = document.getElementById(id);
    if (el) el.value = v;
  }

  // ================= TAB 1: BASIC =================
  var avatarPreview = document.getElementById('avatarPreview');
  var avatarInput = document.getElementById('avatarInput');
  if (avatarPreview) avatarPreview.src = profile.avatar;
  if (avatarInput) {
    avatarInput.addEventListener('change', function () {
      readFile(this, function (dataUrl) {
        if (avatarPreview) avatarPreview.src = dataUrl;
        profile._avatarData = dataUrl;
      });
    });
  }
  setVal('pfFirstName', profile.firstName);
  setVal('pfLastName', profile.lastName);
  setVal('pfCouncil', profile.councilNo);
  setVal('pfExperience', profile.experience);
  setVal('pfUniversity', profile.university);
  setVal('pfDegree', profile.degree);
  setVal('pfBio', profile.bio);

  // ================= TAB 2: SERVICES + VIDEO =================
  var SERVICES = ['ایمپلنت', 'کامپوزیت زیبایی', 'لمینت', 'ارتودنسی', 'عصب‌کشی', 'ترمیم و پرکردن', 'بلیچینگ', 'درمان لثه', 'دندانپزشکی کودکان', 'جراحی فک و صورت'];
  var chipsWrap = document.getElementById('serviceChips');
  if (chipsWrap) {
    SERVICES.forEach(function (s) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'doc-chip' + (profile.services.indexOf(s) !== -1 ? ' is-active' : '');
      chip.textContent = s;
      chip.addEventListener('click', function () { chip.classList.toggle('is-active'); });
      chipsWrap.appendChild(chip);
    });
  }

  var videoUrl = document.getElementById('videoUrl');
  var videoPreview = document.getElementById('videoPreview');
  var videoCoverInput = document.getElementById('videoCoverInput');

  function embedUrl(url) {
    if (!url) return '';
    var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1];
    var ap = url.match(/aparat\.com\/v\/([\w]+)/);
    if (ap) return 'https://www.aparat.com/video/video/embed/videohash/' + ap[1] + '/vt/frame';
    return '';
  }

  function showVideo() {
    var src = embedUrl(videoUrl ? videoUrl.value.trim() : '');
    if (!videoPreview) return;
    if (src) {
      videoPreview.innerHTML = '<iframe src="' + src + '" allowfullscreen loading="lazy" title="ویدیوی معرفی"></iframe>';
      videoPreview.classList.add('is-visible');
    } else {
      videoPreview.classList.remove('is-visible');
      videoPreview.innerHTML = '';
    }
  }

  if (videoUrl) {
    setVal('videoUrl', profile.videoUrl || '');
    showVideo();
    videoUrl.addEventListener('change', showVideo);
  }

  var videoFileInput = document.getElementById('videoFileInput');
  if (videoFileInput) {
    videoFileInput.addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var label = document.getElementById('videoFileLabel');
      if (label) label.textContent = f.name;
      if (videoPreview) {
        videoPreview.innerHTML = '';
        var v = document.createElement('video');
        v.controls = true;
        v.src = URL.createObjectURL(f);
        videoPreview.appendChild(v);
        videoPreview.classList.add('is-visible');
      }
    });
  }

  if (videoCoverInput) {
    videoCoverInput.addEventListener('change', function () {
      var f = this.files && this.files[0];
      if (!f) return;
      var label = document.getElementById('videoCoverLabel');
      if (label) label.textContent = f.name;
    });
  }

  // ================= TAB 3: CERTIFICATES =================
  var certsList = document.getElementById('certsList');

  function addCertRow(cert) {
    var row = document.createElement('div');
    row.className = 'doc-cert-row';
    row.innerHTML =
      '  <div class="doc-field"><label class="doc-label">عنوان گواهینامه</label><input type="text" class="doc-input cert-title" placeholder="مثلاً: دوره ایمپلنت پیشرفته"></div>' +
      '  <div class="doc-field"><label class="doc-label">موسسه / دانشگاه</label><input type="text" class="doc-input cert-org" placeholder="کجا اخذ شده؟"></div>' +
      '  <div class="doc-field"><label class="doc-label">تاریخ اخذ</label><input type="text" class="doc-input cert-date" placeholder="۱۴۰۱"></div>' +
      '  <div class="doc-field"><label class="doc-label">تصویر مدرک</label>' +
      '    <label class="doc-file"><input type="file" accept="image/*" class="cert-img"><span class="doc-file-title cert-img-label">انتخاب تصویر</span></label>' +
      '    <img class="doc-cert-thumb" alt="پیش‌نمایش مدرک"></div>' +
      '  <button type="button" class="doc-iconbtn doc-iconbtn--danger cert-remove" title="حذف مدرک" aria-label="حذف مدرک">' +
      '    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
      '  </button>';

    row.querySelector('.cert-title').value = cert.title || '';
    row.querySelector('.cert-org').value = cert.org || '';
    row.querySelector('.cert-date').value = cert.date || '';

    var imgInput = row.querySelector('.cert-img');
    var thumb = row.querySelector('.doc-cert-thumb');
    var imgLabel = row.querySelector('.cert-img-label');
    if (cert.img) { thumb.src = cert.img; thumb.classList.add('is-visible'); if (imgLabel) imgLabel.textContent = 'تغییر تصویر'; }
    imgInput.addEventListener('change', function () {
      readFile(this, function (dataUrl) {
        thumb.src = dataUrl;
        thumb.classList.add('is-visible');
        if (imgLabel) imgLabel.textContent = 'تغییر تصویر';
      });
    });

    row.querySelector('.cert-remove').addEventListener('click', function () {
      row.remove();
      docToast('مدرک حذف شد');
    });

    certsList.appendChild(row);
  }

  if (certsList) {
    profile.certificates.forEach(function (c) { addCertRow(c); });
    var addBtn = document.getElementById('addCert');
    if (addBtn) addBtn.addEventListener('click', function () {
      addCertRow({});
      docToast('مدرک جدید اضافه شد — اطلاعات را تکمیل کنید');
    });
  }

  // ================= SAVE ALL =================
  var form = document.getElementById('profileForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var g = function (id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
      };

      profile.firstName = g('pfFirstName');
      profile.lastName = g('pfLastName');
      profile.councilNo = g('pfCouncil');
      profile.experience = parseInt(g('pfExperience'), 10) || 0;
      profile.university = g('pfUniversity');
      profile.degree = g('pfDegree');
      profile.bio = g('pfBio');
      if (profile._avatarData) { profile.avatar = profile._avatarData; delete profile._avatarData; }

      var services = [];
      document.querySelectorAll('#serviceChips .doc-chip.is-active').forEach(function (c) {
        services.push(c.textContent);
      });
      profile.services = services;
      profile.videoUrl = g('videoUrl');

      profile.certificates = [];
      document.querySelectorAll('#certsList .doc-cert-row').forEach(function (row) {
        var title = row.querySelector('.cert-title').value.trim();
        var thumb = row.querySelector('.doc-cert-thumb');
        if (!title) return;
        profile.certificates.push({
          title: title,
          org: row.querySelector('.cert-org').value.trim(),
          date: row.querySelector('.cert-date').value.trim(),
          img: thumb.classList.contains('is-visible') ? thumb.src : ''
        });
      });

      db.profile = profile;
      DocDB.save(db);
      docToast('پروفایل پزشکی با موفقیت ذخیره شد ✅');
    });
  }
})();
