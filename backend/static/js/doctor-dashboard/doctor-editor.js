/**
 * Dentura — Doctor Panel: Article Editor (نگارش و ویرایش مقاله)
 * عنوان، دسته‌بندی، Rich Text Editor و ذخیره پیش‌نویس/انتشار — all via API
 */
(function () {
  'use strict';

  var titleEl = document.getElementById('artTitle');
  var catEl = document.getElementById('artCategory');
  var abstractEl = document.getElementById('artAbstract');
  var editor = document.getElementById('editorArea');
  var wordEl = document.getElementById('wordCount');
  var charEl = document.getElementById('charCount');
  var btnDraft = document.getElementById('btnDraft');
  var btnPublish = document.getElementById('btnPublish');

  var currentId = window.DOCTOR_ARTICLE_ID || null;

  // ── Load existing article if editing ──
  if (currentId) {
    apiFetch('GET', '/doctor-dashboard/articles/' + currentId + '/').then(function (data) {
      if (titleEl) titleEl.value = data.title || '';
      if (abstractEl) abstractEl.value = data.abstract || '';
      if (editor) editor.innerHTML = data.content || '';
      if (data.slug) document.title = 'ویرایش مقاله — دنتورا';
      updateCounts();
    }).catch(function () {
      docToast('خطا در بارگذاری مقاله', 'error');
    });
  }

  // ── WYSIWYG Toolbar ──
  if (editor) {
    try { document.execCommand('styleWithCSS', false, false); } catch (e) { /* noop */ }
    editor.focus();

    document.querySelectorAll('#editorToolbar .doc-tool').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var cmd = btn.getAttribute('data-cmd');
        var val = btn.getAttribute('data-val') || null;
        editor.focus();
        if (cmd === 'createLink') {
          var url = window.prompt('آدرس لینک را وارد کنید (مثلاً https://...):', 'https://');
          if (url) document.execCommand('createLink', false, url);
        } else if (cmd === 'insertImage') {
          var fileInput = document.getElementById('inlineImageInput');
          if (fileInput) fileInput.click();
        } else {
          document.execCommand(cmd, false, val);
        }
        updateCounts();
      });
    });

    var inlineImg = document.getElementById('inlineImageInput');
    if (inlineImg) {
      inlineImg.addEventListener('change', function () {
        var file = this.files && this.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          editor.focus();
          document.execCommand('insertImage', false, reader.result);
          updateCounts();
        };
        reader.readAsDataURL(file);
        this.value = '';
      });
    }

    editor.addEventListener('input', updateCounts);
    editor.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
      }
    });
  }

  function updateCounts() {
    if (!editor) return;
    var text = (editor.innerText || '').replace(/\s+/g, ' ').trim();
    var words = text ? text.split(' ').length : 0;
    if (wordEl) wordEl.textContent = toPersianNum(words) + ' کلمه';
    if (charEl) charEl.textContent = toPersianNum(text.length) + ' کاراکتر';
  }
  updateCounts();

  // ── Save Article ──
  function saveArticle(publish) {
    var title = titleEl ? titleEl.value.trim() : '';
    if (!title) {
      docToast('عنوان مقاله را وارد کنید', 'error');
      if (titleEl) titleEl.focus();
      return;
    }

    var payload = {
      title: title,
      category: catEl ? catEl.value : null,
      abstract: abstractEl ? abstractEl.value.trim() : '',
      content: editor ? editor.innerHTML : '',
      is_published: !!publish,
    };

    var method = currentId ? 'PATCH' : 'POST';
    var url = currentId ? '/doctor-dashboard/articles/' + currentId + '/' : '/doctor-dashboard/articles/';

    apiFetch(method, url, payload).then(function (data) {
      if (!currentId && data && data.id) currentId = data.id;
      docToast(publish ? 'مقاله با موفقیت منتشر شد ✅' : 'پیش‌نویس ذخیره شد ✅');
      setTimeout(function () {
        window.location.href = '/doctor-dashboard/articles/';
      }, 1100);
    }).catch(function (err) {
      var msg = 'خطا در ذخیره مقاله';
      if (err && err.data) {
        var d = err.data;
        msg = d.title ? 'عنوان: ' + d.title[0] :
              d.detail ? d.detail : msg;
      }
      docToast(msg, 'error');
    });
  }

  if (btnDraft) btnDraft.addEventListener('click', function () { saveArticle(false); });
  if (btnPublish) btnPublish.addEventListener('click', function () { saveArticle(true); });
})();
