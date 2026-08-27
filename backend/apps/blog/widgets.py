"""
Custom Django admin widget for the article content-blocks editor.

Renders a <textarea> (the actual form field) alongside a visual block
editor UI.  JS reads/writes the textarea value so Django's normal form
handling just works.
"""

import json

from django import forms
from django.utils.safestring import mark_safe


# ── Block type definitions ──────────────────────────────────────────
BLOCK_TYPES = {
    'heading': {
        'label': 'عنوان',
        'icon': 'H',
        'fields': [
            {'name': 'text', 'label': 'متن عنوان', 'type': 'text', 'required': True},
            {'name': 'level', 'label': 'سطح', 'type': 'select', 'options': [
                {'value': '2', 'label': 'H2'},
                {'value': '3', 'label': 'H3'},
            ], 'default': '2'},
        ],
    },
    'paragraph': {
        'label': 'پاراگراف',
        'icon': '¶',
        'fields': [
            {'name': 'text', 'label': 'متن', 'type': 'textarea', 'required': True},
        ],
    },
    'tip': {
        'label': 'نکته',
        'icon': '💡',
        'fields': [
            {'name': 'title', 'label': 'عنوان', 'type': 'text', 'default': 'نکته مهم'},
            {'name': 'body', 'label': 'متن', 'type': 'textarea', 'required': True},
        ],
    },
    'warning': {
        'label': 'هشدار',
        'icon': '⚠️',
        'fields': [
            {'name': 'title', 'label': 'عنوان', 'type': 'text', 'default': 'هشدار پزشکی'},
            {'name': 'body', 'label': 'متن', 'type': 'textarea', 'required': True},
        ],
    },
    'info': {
        'label': 'اطلاعات',
        'icon': 'ℹ️',
        'fields': [
            {'name': 'title', 'label': 'عنوان', 'type': 'text', 'default': 'اطلاعات تکمیلی'},
            {'name': 'body', 'label': 'متن', 'type': 'textarea', 'required': True},
        ],
    },
    'list': {
        'label': 'لیست',
        'icon': '☰',
        'fields': [
            {'name': 'style', 'label': 'نوع', 'type': 'select', 'options': [
                {'value': 'bullet', 'label': 'گلوله‌ای'},
                {'value': 'numbered', 'label': 'شماره‌دار'},
            ], 'default': 'bullet'},
            {'name': 'items', 'label': 'آیتم‌ها (هر سطر یک مورد)', 'type': 'list_text', 'required': True},
        ],
    },
    'quote': {
        'label': 'نقل‌قول',
        'icon': '❝',
        'fields': [
            {'name': 'text', 'label': 'متن نقل‌قول', 'type': 'textarea', 'required': True},
            {'name': 'author', 'label': 'نویسنده', 'type': 'text'},
            {'name': 'role', 'label': 'سمت', 'type': 'text'},
        ],
    },
    'table': {
        'label': 'جدول',
        'icon': '▦',
        'fields': [
            {'name': 'caption', 'label': 'عنوان جدول', 'type': 'text'},
            {'name': 'headers', 'label': 'ستون‌ها (هر سطر یک عنوان)', 'type': 'list_text', 'required': True},
            {'name': 'rows', 'label': 'ردیف‌ها (ستون‌ها با | جدا شوند)', 'type': 'table_rows', 'required': True},
        ],
    },
    'image': {
        'label': 'تصویر',
        'icon': '🖼',
        'fields': [
            {'name': 'src', 'label': 'آدرس تصویر', 'type': 'text', 'required': True},
            {'name': 'alt', 'label': 'متن جایگزین', 'type': 'text'},
            {'name': 'caption', 'label': 'زیرنویس', 'type': 'text'},
        ],
    },
    'gallery': {
        'label': 'گالری',
        'icon': '🖼🖼',
        'fields': [
            {'name': 'items', 'label': 'هر سطر: آدرس | متن جایگزین | نوع(image/video)', 'type': 'gallery_items'},
        ],
    },
}


class BlockEditorWidget(forms.Textarea):
    """
    Textarea widget that adds a visual block-editor UI on top.
    The JS and CSS are inlined right here — zero external dependencies.
    """

    def __init__(self, attrs=None):
        default_attrs = {'class': 'block-editor-source', 'rows': 3}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(attrs=default_attrs)

    def render(self, name, value, attrs=None, renderer=None):
        if value is None:
            value = []
        if isinstance(value, (list, dict)):
            value = json.dumps(value, ensure_ascii=False)

        textarea_html = super().render(name, value, attrs, renderer)

        schema_json = json.dumps(BLOCK_TYPES, ensure_ascii=False)
        # Escape for safe embedding inside a data- attribute
        schema_escaped = (
            schema_json
            .replace('&', '&amp;')
            .replace('"', '&quot;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
        )

        buttons = ''
        for btype, info in BLOCK_TYPES.items():
            btn_label = f'{info["icon"]} {info["label"]}'
            buttons += (
                f'<button type="button" class="block-editor-add-btn" '
                f'data-block-type="{btype}" title="{info["label"]}">'
                f'{btn_label}</button>'
            )

        html = (
            '<div class="block-editor-wrapper" '
            f'data-schema="{schema_escaped}">'
            '<div class="block-editor-toolbar">'
            '<span class="block-editor-toolbar-title">📐 افزودن بلاک جدید:</span>'
            f'<div class="block-editor-add-btns">{buttons}</div>'
            '</div>'
            '<div class="block-editor-blocks"></div>'
            '<div class="block-editor-source-wrapper">'
            '<details>'
            '<summary style="cursor:pointer;font-size:12px;color:#6b7280;margin:8px 0 4px;">'
            'نمایش JSON خام</summary>'
            f'{textarea_html}'
            '</details>'
            '</div>'
            '</div>'
        )
        return mark_safe(html)
