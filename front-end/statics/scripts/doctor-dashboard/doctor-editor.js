/**
 * Dentura — Doctor Panel: Article Editor (نگارش و ویرایش مقاله)
 * عنوان، دسته‌بندی، Block Editor، آپلود مدیا و ذخیره پیش‌نویس/انتشار — all via API
 */
(function () {
  'use strict';

  var titleEl = document.getElementById('artTitle');
  var catEl = document.getElementById('artCategory');
  var abstractEl = document.getElementById('artAbstract');
  var blocksSource = document.getElementById('contentBlocksSource');
  var blockCountEl = document.getElementById('blockCount');
  var btnDraft = document.getElementById('btnDraft');
  var btnPublish = document.getElementById('btnPublish');

  // Media elements
  var mediaSection = document.getElementById('mediaSection');
  var imageUploadZone = document.getElementById('imageUploadZone');
  var imageUploadInput = document.getElementById('imageUploadInput');
  var imagePreviewGrid = document.getElementById('imagePreviewGrid');
  var videoUploadZone = document.getElementById('videoUploadZone');
  var videoUploadInput = document.getElementById('videoUploadInput');
  var videoPreviewGrid = document.getElementById('videoPreviewGrid');

  var currentId = window.DOCTOR_ARTICLE_ID || null;

  // ── Utility ──
  function getCookie(name) {
    var value = '; ' + document.cookie;
    var parts = value.split('; ' + name + '=');
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return '';
  }

  // ── Load existing article if editing ──
  if (currentId) {
    apiFetch('GET', '/doctor-dashboard/articles/' + currentId + '/').then(function (data) {
      if (titleEl) titleEl.value = data.title || '';
      if (abstractEl) abstractEl.value = data.abstract || '';
      if (data.category) {
        var opts = catEl ? catEl.options : [];
        for (var i = 0; i < opts.length; i++) {
          if (String(opts[i].value) === String(data.category)) {
            catEl.selectedIndex = i;
            break;
          }
        }
      }
      if (blocksSource && data.content_blocks) {
        blocksSource.value = JSON.stringify(data.content_blocks, null, 2);
        var wrapper = blocksSource.closest('.block-editor-wrapper');
        if (wrapper) {
          wrapper.dispatchEvent(new CustomEvent('blocks:reload'));
        }
      }
      if (data.slug) document.title = 'ویرایش مقاله — دنتورا';
      updateCounts();

      // Show media section and load existing media
      showMediaSection();
      if (data.files && data.files.length) {
        renderExistingMedia(data.files);
      }
    }).catch(function () {
      docToast('خطا در بارگذاری مقاله', 'error');
    });
  } else {
    // New article: show media section after first save
    showMediaSection();
  }

  // ── Update block counts ──
  function updateCounts() {
    var blocks = [];
    try {
      blocks = JSON.parse(blocksSource ? blocksSource.value || '[]' : '[]');
      if (!Array.isArray(blocks)) blocks = [];
    } catch (_) {
      blocks = [];
    }
    if (blockCountEl) {
      blockCountEl.textContent = toPersianNum(blocks.length) + ' بلاک';
    }
  }

  var countTimer = null;
  if (blocksSource) {
    blocksSource.addEventListener('input', function () {
      clearTimeout(countTimer);
      countTimer = setTimeout(updateCounts, 400);
    });
  }
  updateCounts();

  // ── Show Media Section ──
  function showMediaSection() {
    if (mediaSection) mediaSection.style.display = '';
  }

  // ── Render existing media ──
  function renderExistingMedia(files) {
    files.forEach(function (f) {
      if (f.media_type === 'IMAGE' && f.file) {
        addImagePreview(f.file, f.id);
      } else if (f.media_type === 'VIDEO' && (f.file || f.video_url)) {
        addVideoPreview(f.file || f.video_url, f.id);
      }
    });
  }

  // ── Image Upload ──
  if (imageUploadZone) {
    imageUploadZone.addEventListener('click', function (e) {
      if (e.target === imageUploadInput) return;
      imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', function () {
      handleFiles(this.files, 'IMAGE');
      this.value = '';
    });

    // Drag & drop
    imageUploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      this.classList.add('is-dragover');
    });
    imageUploadZone.addEventListener('dragleave', function () {
      this.classList.remove('is-dragover');
    });
    imageUploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      this.classList.remove('is-dragover');
      handleFiles(e.dataTransfer.files, 'IMAGE');
    });
  }

  // ── Video Upload ──
  if (videoUploadZone) {
    videoUploadZone.addEventListener('click', function (e) {
      if (e.target === videoUploadInput) return;
      videoUploadInput.click();
    });

    videoUploadInput.addEventListener('change', function () {
      handleFiles(this.files, 'VIDEO');
      this.value = '';
    });

    videoUploadZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      this.classList.add('is-dragover');
    });
    videoUploadZone.addEventListener('dragleave', function () {
      this.classList.remove('is-dragover');
    });
    videoUploadZone.addEventListener('drop', function (e) {
      e.preventDefault();
      this.classList.remove('is-dragover');
      handleFiles(e.dataTransfer.files, 'VIDEO');
    });
  }

  // ── Handle file selection ──
  function handleFiles(fileList, mediaType) {
    if (!fileList || !fileList.length) return;

    // Ensure article exists first
    ensureArticleSaved().then(function () {
      var files = Array.prototype.slice.call(fileList);
      files.forEach(function (file) {
        uploadFile(file, mediaType);
      });
    });
  }

  // ── Ensure article is saved before uploading media ──
  function ensureArticleSaved() {
    if (currentId) return Promise.resolve();

    // Save as draft first
    var title = titleEl ? titleEl.value.trim() : '';
    if (!title) {
      titleEl.value = 'مقاله بدون عنوان';
      title = 'مقاله بدون عنوان';
    }

    var contentBlocks = [];
    try {
      contentBlocks = JSON.parse(blocksSource ? blocksSource.value || '[]' : '[]');
      if (!Array.isArray(contentBlocks)) contentBlocks = [];
    } catch (_) { contentBlocks = []; }

    var payload = {
      title: title,
      category: catEl ? catEl.value : null,
      abstract: abstractEl ? abstractEl.value.trim() : '',
      content: '',
      content_blocks: contentBlocks,
      is_published: false,
    };

    return apiFetch('POST', '/doctor-dashboard/articles/', payload).then(function (data) {
      if (data && data.id) currentId = data.id;
      docToast('مقاله ذخیره شد — حالا می‌توانید فایل اضافه کنید');
    });
  }

  // ── Upload single file ──
  function uploadFile(file, mediaType) {
    var formData = new FormData();
    formData.append('media_type', mediaType);

    if (mediaType === 'IMAGE') {
      if (!file.type.startsWith('image/')) {
        docToast('فایل انتخابی باید تصویر باشد', 'error');
        return;
      }
      formData.append('file', file);
    } else {
      if (!file.type.startsWith('video/')) {
        docToast('فایل انتخابی باید ویدیو باشد', 'error');
        return;
      }
      formData.append('file', file);
    }

    // Show uploading state
    var previewId = 'uploading-' + Date.now() + Math.random();
    if (mediaType === 'IMAGE') {
      addImagePreview(null, previewId, URL.createObjectURL(file), true);
    } else {
      addVideoPreview(null, previewId, URL.createObjectURL(file), true);
    }

    fetch('/api/doctor-dashboard/articles/' + currentId + '/media/', {
      method: 'POST',
      headers: { 'X-CSRFToken': getCookie('csrftoken') },
      credentials: 'same-origin',
      body: formData,
    })
    .then(function (res) {
      if (!res.ok) return res.json().then(function (d) { throw d; });
      return res.json();
    })
    .then(function (data) {
      // Replace uploading placeholder with real preview
      removePreview(previewId);
      if (mediaType === 'IMAGE') {
        addImagePreview(data.file, data.id);
      } else {
        addVideoPreview(data.file || data.video_url, data.id);
      }
      docToast('فایل با موفقیت آپلود شد');
    })
    .catch(function (err) {
      removePreview(previewId);
      var msg = 'خطا در آپلود فایل';
      if (err && err.detail) msg = err.detail;
      docToast(msg, 'error');
    });
  }

  // ── Image Preview ──
  function addImagePreview(fileUrl, mediaId, tempUrl, isUploading) {
    if (!imagePreviewGrid) return;
    var src = tempUrl || (fileUrl ? fileUrl : '');
    var idx = imagePreviewGrid.children.length;
    var isFirst = idx === 0;
    var div = document.createElement('div');
    div.className = 'media-preview-item' + (isUploading ? ' is-uploading' : '');
    div.setAttribute('data-media-id', mediaId || '');
    div.innerHTML =
      '<img src="' + esc(src) + '" alt="تصویر ' + (idx + 1) + '">' +
      '<div class="media-preview-order">' + toPersianNum(idx + 1) + '</div>' +
      (isFirst ? '<span class="media-cover-badge">封面</span>' : '') +
      (isUploading ? '<div class="media-uploading-overlay"><div class="media-spinner"></div></div>' : '') +
      '<button type="button" class="media-remove-btn" data-media-id="' + (mediaId || '') + '" aria-label="حذف">&times;</button>' +
      '<div class="media-reorder-btns">' +
        '<button type="button" class="media-reorder-up" aria-label="جلو">&#9650;</button>' +
        '<button type="button" class="media-reorder-down" aria-label="عقب">&#9660;</button>' +
      '</div>';
    imagePreviewGrid.appendChild(div);

    // Remove button
    div.querySelector('.media-remove-btn').addEventListener('click', function () {
      var id = this.getAttribute('data-media-id');
      if (id && !isUploading) {
        deleteMedia(id, function () {
          div.remove();
          updateImageLabels();
        });
      } else {
        div.remove();
        updateImageLabels();
      }
    });

    // Reorder buttons
    var upBtn = div.querySelector('.media-reorder-up');
    var downBtn = div.querySelector('.media-reorder-down');
    if (upBtn) upBtn.addEventListener('click', function () {
      var prev = div.previousElementSibling;
      if (prev) {
        imagePreviewGrid.insertBefore(div, prev);
        updateImageLabels();
      }
    });
    if (downBtn) downBtn.addEventListener('click', function () {
      var next = div.nextElementSibling;
      if (next) {
        imagePreviewGrid.insertBefore(next, div);
        updateImageLabels();
      }
    });
  }

  function updateImageLabels() {
    if (!imagePreviewGrid) return;
    var items = imagePreviewGrid.querySelectorAll('.media-preview-item');
    items.forEach(function (item, i) {
      // Update order number
      var orderEl = item.querySelector('.media-preview-order');
      if (orderEl) orderEl.textContent = toPersianNum(i + 1);
      // Update cover badge
      var badge = item.querySelector('.media-cover-badge');
      if (i === 0 && !badge) {
        var span = document.createElement('span');
        span.className = 'media-cover-badge';
        span.textContent = '封面';
        item.appendChild(span);
      } else if (i > 0 && badge) {
        badge.remove();
      }
    });
  }

  // ── Video Preview ──
  function addVideoPreview(fileUrl, mediaId, tempUrl, isUploading) {
    if (!videoPreviewGrid) return;
    var src = tempUrl || (fileUrl ? fileUrl : '');
    var idx = videoPreviewGrid.children.length;
    var div = document.createElement('div');
    div.className = 'media-preview-item media-preview-video' + (isUploading ? ' is-uploading' : '');
    div.setAttribute('data-media-id', mediaId || '');
    div.innerHTML =
      '<video src="' + esc(src) + '" preload="metadata" muted></video>' +
      '<div class="media-preview-order">' + toPersianNum(idx + 1) + '</div>' +
      (isUploading ? '<div class="media-uploading-overlay"><div class="media-spinner"></div></div>' : '') +
      '<button type="button" class="media-remove-btn" data-media-id="' + (mediaId || '') + '" aria-label="حذف">&times;</button>';
    videoPreviewGrid.appendChild(div);

    div.querySelector('.media-remove-btn').addEventListener('click', function () {
      var id = this.getAttribute('data-media-id');
      if (id && !isUploading) {
        deleteMedia(id, function () {
          div.remove();
        });
      } else {
        div.remove();
      }
    });
  }

  // ── Delete Media ──
  function deleteMedia(mediaId, onSuccess) {
    apiFetch('DELETE', '/doctor-dashboard/articles/' + currentId + '/media/' + mediaId + '/').then(function () {
      docToast('فایل حذف شد');
      if (onSuccess) onSuccess();
      updateVideoLabels();
    }).catch(function () {
      docToast('خطا در حذف فایل', 'error');
    });
  }

  function updateVideoLabels() {
    if (!videoPreviewGrid) return;
    var items = videoPreviewGrid.querySelectorAll('.media-preview-item');
    items.forEach(function (item, i) {
      var orderEl = item.querySelector('.media-preview-order');
      if (orderEl) orderEl.textContent = toPersianNum(i + 1);
    });
  }

  // ── Save Article ──
  function saveArticle(publish) {
    var title = titleEl ? titleEl.value.trim() : '';
    if (!title) {
      docToast('عنوان مقاله را وارد کنید', 'error');
      if (titleEl) titleEl.focus();
      return;
    }

    var contentBlocks = [];
    try {
      contentBlocks = JSON.parse(blocksSource ? blocksSource.value || '[]' : '[]');
      if (!Array.isArray(contentBlocks)) contentBlocks = [];
    } catch (_) {
      contentBlocks = [];
    }

    var payload = {
      title: title,
      category: catEl ? catEl.value : null,
      abstract: abstractEl ? abstractEl.value.trim() : '',
      content: '',
      content_blocks: contentBlocks,
      is_published: !!publish,
    };

    var method = currentId ? 'PATCH' : 'POST';
    var url = currentId ? '/doctor-dashboard/articles/' + currentId + '/' : '/doctor-dashboard/articles/';

    apiFetch(method, url, payload).then(function (data) {
      if (!currentId && data && data.id) currentId = data.id;
      docToast(publish ? 'مقاله با موفقیت منتشر شد ✅' : 'پیش‌نویس ذخیره شد ✅');
      setTimeout(function () {
        window.location.href = '/doctors/dashboard/articles/';
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

  // ── Helpers ──
  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function removePreview(id) {
    var el = imagePreviewGrid ? imagePreviewGrid.querySelector('[data-media-id="' + id + '"]') : null;
    if (!el && videoPreviewGrid) el = videoPreviewGrid.querySelector('[data-media-id="' + id + '"]');
    if (el) el.remove();
  }

  if (btnDraft) btnDraft.addEventListener('click', function () { saveArticle(false); });
  if (btnPublish) btnPublish.addEventListener('click', function () { saveArticle(true); });
})();
