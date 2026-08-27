/**
 * admin-block-editor.js
 *
 * Powers the visual block editor for Article.content_blocks in Django admin.
 * Each `.block-editor-wrapper` on the page is self-contained.
 *
 * The textarea (.block-editor-source) holds the JSON value.
 * The script tag (.block-editor-schema) holds the block-type schema.
 */

(function () {
    'use strict';

    /* ── helpers ──────────────────────────────────────────────────── */
    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    /* ── build one block card ─────────────────────────────────────── */
    function renderBlock(block, index, schema) {
        const type = block.type;
        const meta = schema[type];
        if (!meta) return '';

        const data = block.data || {};

        let fieldsHtml = '';
        for (const f of meta.fields) {
            const val = data[f.name] != null ? data[f.name] : (f.default || '');
            fieldsHtml += renderField(f, val, index);
        }

        return `
        <div class="be-block" data-index="${index}" data-type="${type}" draggable="true">
            <div class="be-block-header">
                <span class="be-block-grip" title="برای جابجایی بکشید">⠿</span>
                <span class="be-block-type-badge">${meta.icon} ${meta.label}</span>
                <span class="be-block-index">#${index + 1}</span>
                <div class="be-block-actions">
                    <button type="button" class="be-btn be-btn-up" title="انتقال به بالا">▲</button>
                    <button type="button" class="be-btn be-btn-down" title="انتقال به پایین">▼</button>
                    <button type="button" class="be-btn be-btn-duplicate" title="تکثیر بلاک">⧉</button>
                    <button type="button" class="be-btn be-btn-delete" title="حذف بلاک">✕</button>
                </div>
            </div>
            <div class="be-block-body">
                ${fieldsHtml}
            </div>
        </div>`;
    }

    function renderField(field, value, blockIndex) {
        const fname = `block_field_${blockIndex}_${field.name}`;
        const label = `<label class="be-label" for="${fname}">${esc(field.label)}</label>`;

        if (field.type === 'textarea') {
            return `<div class="be-field">
                ${label}
                <textarea class="be-input be-textarea" id="${fname}" data-field="${field.name}">${esc(String(value))}</textarea>
            </div>`;
        }

        if (field.type === 'text') {
            return `<div class="be-field">
                ${label}
                <input type="text" class="be-input" id="${fname}" data-field="${field.name}" value="${esc(String(value))}">
            </div>`;
        }

        if (field.type === 'select') {
            const options = (field.options || [])
                .map(o => `<option value="${o.value}" ${String(value) === String(o.value) ? 'selected' : ''}>${esc(o.label)}</option>`)
                .join('');
            return `<div class="be-field">
                ${label}
                <select class="be-input be-select" id="${fname}" data-field="${field.name}">${options}</select>
            </div>`;
        }

        if (field.type === 'list_text') {
            const arr = Array.isArray(value) ? value : [];
            return `<div class="be-field">
                ${label}
                <textarea class="be-input be-textarea be-list-text" id="${fname}" data-field="${field.name}" rows="4" placeholder="هر سطر یک آیتم">${arr.map(esc).join('\n')}</textarea>
            </div>`;
        }

        if (field.type === 'table_rows') {
            const rows = Array.isArray(value) ? value : [];
            const text = rows.map(r => (Array.isArray(r) ? r.join(' | ') : String(r))).join('\n');
            return `<div class="be-field">
                ${label}
                <textarea class="be-input be-textarea be-table-rows" id="${fname}" data-field="${field.name}" rows="6" placeholder="هر سطر یک ردیف — ستون‌ها با | جدا شوند">${esc(text)}</textarea>
            </div>`;
        }

        if (field.type === 'gallery_items') {
            const items = Array.isArray(value) ? value : [];
            const text = items.map(it => `${it.src || ''} | ${it.alt || ''} | ${it.type || 'image'}`).join('\n');
            return `<div class="be-field">
                ${label}
                <textarea class="be-input be-textarea be-gallery-items" id="${fname}" data-field="${field.name}" rows="5" placeholder="هر سطر: آدرس | متن جایگزین | نوع (image/video)">${esc(text)}</textarea>
            </div>`;
        }

        return `<div class="be-field">${label}<input type="text" class="be-input" id="${fname}" data-field="${field.name}" value="${esc(String(value))}"></div>`;
    }

    /* ── extract data from a single block card ────────────────────── */
    function extractBlock(blockEl, schema) {
        const type = blockEl.dataset.type;
        const meta = schema[type];
        const data = {};

        blockEl.querySelectorAll('[data-field]').forEach(input => {
            const fname = input.dataset.field;
            const fieldDef = meta.fields.find(f => f.name === fname);
            if (!fieldDef) return;

            if (fieldDef.type === 'list_text') {
                data[fname] = input.value.split('\n').map(s => s.trim()).filter(Boolean);
            } else if (fieldDef.type === 'table_rows') {
                data[fname] = input.value
                    .split('\n')
                    .map(s => s.trim())
                    .filter(Boolean)
                    .map(line => line.split('|').map(c => c.trim()));
            } else if (fieldDef.type === 'gallery_items') {
                data[fname] = input.value
                    .split('\n')
                    .map(s => s.trim())
                    .filter(Boolean)
                    .map(line => {
                        const parts = line.split('|').map(c => c.trim());
                        return { src: parts[0] || '', alt: parts[1] || '', type: parts[2] || 'image' };
                    });
            } else {
                data[fname] = input.value;
            }
        });

        return { type, data };
    }

    /* ── main controller ──────────────────────────────────────────── */
    function initWrapper(wrapper) {
        console.log('[BlockEditor] initWrapper called');
        const textarea = wrapper.querySelector('.block-editor-source');
        const container = wrapper.querySelector('.block-editor-blocks');

        if (!textarea || !container) {
            console.warn('[BlockEditor] textarea or container not found!', textarea, container);
            return;
        }

        let schema = {};
        try {
            schema = JSON.parse(wrapper.dataset.schema || '{}');
        } catch (e) {
            console.error('BlockEditor: failed to parse schema', e);
            return;
        }

        let blocks = [];
        try {
            blocks = JSON.parse(textarea.value || '[]');
            if (!Array.isArray(blocks)) blocks = [];
        } catch (_) {
            blocks = [];
        }

        /* sync blocks → textarea → DOM re-render */
        function syncToTextarea() {
            textarea.value = JSON.stringify(blocks, null, 2);
        }

        function readFromDOM() {
            blocks = [];
            container.querySelectorAll('.be-block').forEach(el => {
                blocks.push(extractBlock(el, schema));
            });
            syncToTextarea();
        }

        function renderAll() {
            syncToTextarea();
            container.innerHTML = blocks.map((b, i) => renderBlock(b, i, schema)).join('');
            attachBlockEvents();
        }

        function addBlock(type) {
            const meta = schema[type];
            const data = {};
            meta.fields.forEach(f => {
                if (f.default != null) data[f.name] = f.default;
                else if (f.type === 'list_text' || f.type === 'table_rows' || f.type === 'gallery_items') data[f.name] = [];
                else if (f.type === 'select') data[f.name] = (f.options && f.options[0]) ? f.options[0].value : '';
                else data[f.name] = '';
            });
            blocks.push({ type, data });
            syncToTextarea();
            renderAll();
            const last = container.querySelector('.be-block:last-child');
            if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function attachBlockEvents() {
            // delete
            container.querySelectorAll('.be-btn-delete').forEach(btn => {
                btn.onclick = function () {
                    const block = this.closest('.be-block');
                    const idx = parseInt(block.dataset.index, 10);
                    if (confirm('آیا از حذف این بلاک مطمئنید؟')) {
                        blocks.splice(idx, 1);
                        syncToTextarea();
                        renderAll();
                    }
                };
            });
            // move up
            container.querySelectorAll('.be-btn-up').forEach(btn => {
                btn.onclick = function () {
                    const block = this.closest('.be-block');
                    const idx = parseInt(block.dataset.index, 10);
                    if (idx > 0) {
                        [blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]];
                        syncToTextarea();
                        renderAll();
                    }
                };
            });
            // move down
            container.querySelectorAll('.be-btn-down').forEach(btn => {
                btn.onclick = function () {
                    const block = this.closest('.be-block');
                    const idx = parseInt(block.dataset.index, 10);
                    if (idx < blocks.length - 1) {
                        [blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]];
                        syncToTextarea();
                        renderAll();
                    }
                };
            });
            // duplicate
            container.querySelectorAll('.be-btn-duplicate').forEach(btn => {
                btn.onclick = function () {
                    const block = this.closest('.be-block');
                    const idx = parseInt(block.dataset.index, 10);
                    const clone = JSON.parse(JSON.stringify(blocks[idx]));
                    blocks.splice(idx + 1, 0, clone);
                    syncToTextarea();
                    renderAll();
                };
            });

            // live sync on any input change (debounced)
            let syncTimer = null;
            container.querySelectorAll('input[data-field], textarea[data-field], select[data-field]').forEach(el => {
                el.addEventListener('input', function () {
                    clearTimeout(syncTimer);
                    syncTimer = setTimeout(readFromDOM, 300);
                });
                el.addEventListener('change', function () {
                    clearTimeout(syncTimer);
                    readFromDOM();
                });
            });

            // drag & drop reordering
            let draggedEl = null;
            container.querySelectorAll('.be-block').forEach(el => {
                el.addEventListener('dragstart', (e) => {
                    draggedEl = el;
                    el.classList.add('be-dragging');
                    e.dataTransfer.effectAllowed = 'move';
                });
                el.addEventListener('dragend', () => {
                    el.classList.remove('be-dragging');
                    draggedEl = null;
                    container.querySelectorAll('.be-block').forEach(b => b.classList.remove('be-drag-over'));
                });
                el.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    el.classList.add('be-drag-over');
                });
                el.addEventListener('dragleave', () => {
                    el.classList.remove('be-drag-over');
                });
                el.addEventListener('drop', (e) => {
                    e.preventDefault();
                    el.classList.remove('be-drag-over');
                    if (!draggedEl || draggedEl === el) return;
                    const fromIdx = parseInt(draggedEl.dataset.index, 10);
                    const toIdx = parseInt(el.dataset.index, 10);
                    const [moved] = blocks.splice(fromIdx, 1);
                    blocks.splice(toIdx, 0, moved);
                    syncToTextarea();
                    renderAll();
                });
            });
        }

        // add-block buttons
        wrapper.querySelectorAll('.block-editor-add-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                console.log('[BlockEditor] clicked:', this.dataset.blockType);
                addBlock(this.dataset.blockType);
            });
        });

        // initial render
        renderAll();
    }

    /* ── boot ─────────────────────────────────────────────────────── */
    function boot() {
        var wrappers = document.querySelectorAll('.block-editor-wrapper');
        console.log('[BlockEditor] boot() called — found', wrappers.length, 'wrapper(s)');
        wrappers.forEach(initWrapper);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
        setTimeout(boot, 500);
    }
})();
