"""
Template tags for rendering article content_blocks.

Usage in templates:
    {% load content_blocks %}
    {% render_content_blocks article.content_blocks %}

    # or with a variable:
    {% render_content_blocks blocks %}
"""

from django import template
from django.utils.safestring import mark_safe

register = template.Library()


@register.inclusion_tag('blog/blocks/content_blocks.html', takes_context=True)
def render_content_blocks(context, blocks):
    """
    Render a list of content block dicts as styled HTML.

    Each block must have:
        type  – one of heading, paragraph, tip, warning, info, list,
                quote, table, image, gallery
        data  – dict of fields for that type
    """
    return {
        'blocks': blocks or [],
    }


@register.filter
def get_block_field(block, field_name):
    """Retrieve a field from a block's data dict."""
    return block.get('data', {}).get(field_name, '')
