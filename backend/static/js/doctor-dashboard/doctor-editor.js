/**
 * Dentura — Doctor Panel: Article Editor (نگارش و ویرایش مقاله)
 * عنوان، دسته‌بندی، Block Editor و ذخیره پیش‌نویس/انتشار — all via API
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

  var currentId = window.DOCTOR_ARTICLE_ID || null;

  // ── Load existing article if editing ──
  if (currentId) {
    apiFetch('GET', '/doctor-dashboard/articles/' + currentId + '/').then(function (data) {
      if (titleEl) titleEl.value = data.title || '';
      if (abstractEl) abstractEl.value = data.abstract || '';
      if (data.category) {
        // Select the matching category option
        var opts = catEl ? catEl.options : [];
        for (var i = 0; i < opts.length; i++) {
          if (String(opts[i].value) === String(data.category)) {
            catEl.selectedIndex = i;
            break;
          }
        }
      }
      // Load content_blocks into the textarea, then trigger block editor re-render
      if (blocksSource && data.content_blocks) {
        blocksSource.value = JSON.stringify(data.content_blocks, null, 2);
        // Re-init block editor with new data
        var wrapper = blocksSource.closest('.block-editor-wrapper');
        if (wrapper) {
          // Dispatch a custom event so the block editor can re-render
          wrapper.dispatchEvent(new CustomEvent('blocks:reload'));
        }
      }
      if (data.slug) document.title = 'ویرایش مقاله — دنتورا';
      updateCounts();
    }).catch(function () {
      docToast('خطا در بارگذاری مقاله', 'error');
    });
  }

  // ── Update block / word / character counts ──
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

  // Listen for changes on the blocks textarea (debounced)
  var countTimer = null;
  if (blocksSource) {
    blocksSource.addEventListener('input', function () {
      clearTimeout(countTimer);
      countTimer = setTimeout(updateCounts, 400);
    });
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

    // Parse content_blocks from textarea
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
      content_blocks: contentBlocks,
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
