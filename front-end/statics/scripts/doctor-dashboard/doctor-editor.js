/**
 * Dentura — Doctor Panel: Article Editor (نگارش و ویرایش مقاله)
 * عنوان، تصویر شاخص، دسته‌بندی، Rich Text Editor و ذخیره پیش‌نویس/انتشار
 */
(function () {
  'use strict';

  var titleEl = document.getElementById('artTitle');
  var catEl = document.getElementById('artCategory');
  var coverInput = document.getElementById('coverInput');
  var coverPreviewWrap = document.getElementById('coverPreviewWrap');
  var coverPreview = document.getElementById('coverPreview');
  var removeCoverBtn = document.getElementById('removeCover');
  var editor = document.getElementById('editorArea');
  var wordEl = document.getElementById('wordCount');
  var charEl = document.getElementById('charCount');
  var btnDraft = document.getElementById('btnDraft');
  var btnPublish = document.getElementById('btnPublish');

  var currentId = null;
  var coverData = '';
  var db = DocDB.load();

  // بارگذاری مقاله موجود (?id=)
  var params = new URLSearchParams(window.location.search);
  if (params.get('id')) {
    currentId = parseInt(params.get('id'), 10);
    var found = db.articles.find(function (a) { return a.id === currentId; });
    if (found) {
      if (titleEl) titleEl.value = found.title;
      if (catEl) catEl.value = found.category || catEl.value;
      if (editor) editor.innerHTML = found.content || '';
      coverData = found.cover || '';
      if (coverData && coverPreview && coverPreviewWrap) {
        coverPreview.src = coverData;
        coverPreviewWrap.hidden = false;
      }
      document.title = 'ویرایش مقاله — دنتورا';
    }
  }

  // ================= COVER IMAGE =================
  function readFile(input, cb) {
    var file = input.files && input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { cb(reader.result); };
    reader.readAsDataURL(file);
  }

  if (coverInput) {
    coverInput.addEventListener('change', function () {
      var name = this.files && this.files[0] ? this.files[0].name : null;
      var label = document.getElementById('coverLabel');
      if (label && name) label.textContent = name;
      readFile(this, function (dataUrl) {
        coverData = dataUrl;
        if (coverPreview && coverPreviewWrap) {
          coverPreview.src = dataUrl;
          coverPreviewWrap.hidden = false;
        }
      });
    });
  }

  if (removeCoverBtn) {
    removeCoverBtn.addEventListener('click', function () {
      coverData = '';
      if (coverPreviewWrap) coverPreviewWrap.hidden = true;
      if (coverInput) coverInput.value = '';
      var label = document.getElementById('coverLabel');
      if (label) label.textContent = 'انتخاب تصویر شاخص';
    });
  }

  // ================= WYSIWYG TOOLBAR =================
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
        readFile(this, function (dataUrl) {
          editor.focus();
          document.execCommand('insertImage', false, dataUrl);
          updateCounts();
        });
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

  // ================= SAVE =================
  function saveArticle(status) {
    var title = titleEl ? titleEl.value.trim() : '';
    if (!title) {
      docToast('عنوان مقاله را وارد کنید', 'error');
      if (titleEl) titleEl.focus();
      return;
    }
    var fresh = DocDB.load();
    var content = editor ? editor.innerHTML : '';
    var today = '۱۴۰۴/۰۵/۲۴';

    if (currentId) {
      var a = fresh.articles.find(function (x) { return x.id === currentId; });
      if (a) {
        a.title = title;
        a.category = catEl ? catEl.value : a.category;
        a.content = content;
        a.status = status;
        if (coverData && coverData.indexOf('data:') !== 0) a.cover = coverData;
        if (coverData.indexOf('data:') === 0) a.cover = coverData;
        if (!coverData) a.cover = '';
        if (status === 'published' && !a.date) a.date = today;
      }
    } else {
      currentId = Date.now();
      fresh.articles.unshift({
        id: currentId,
        title: title,
        category: catEl ? catEl.value : 'بهداشت و پیشگیری',
        status: status,
        cover: coverData || '../../assets/hero/smile-detail.jpg',
        date: today,
        views: 0,
        content: content
      });
    }

    DocDB.save(fresh);
    docToast(status === 'published' ? 'مقاله جهت انتشار ارسال شد ✅' : 'پیش‌نویس ذخیره شد ✅');
    setTimeout(function () {
      window.location.href = 'articles.html';
    }, 1100);
  }

  if (btnDraft) btnDraft.addEventListener('click', function () { saveArticle('draft'); });
  if (btnPublish) btnPublish.addEventListener('click', function () { saveArticle('published'); });
})();
