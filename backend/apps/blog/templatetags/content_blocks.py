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


@register.filter
def to_jalali(dt):
    """Convert a datetime to a Persian Jalali date string like '۲۸ مرداد ۱۴۰۵'."""
    if not dt:
        return ''
    import math
    gy = dt.year
    gm = dt.month
    gd = dt.day
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = 355666 + (365 * gy) + math.floor((gy2 + 3) / 4) - math.floor((gy2 + 99) / 100) + math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1]
    jy = -1595 + 33 * math.floor(days / 12053)
    days %= 12053
    jy += 4 * math.floor(days / 1461)
    days %= 1461
    if days > 365:
        jy += math.floor((days - 1) / 365)
        days = (days - 1) % 365
    if days < 186:
        jm = 1 + math.floor(days / 31)
        jd = 1 + (days % 31)
    else:
        jm = 7 + math.floor((days - 186) / 30)
        jd = 1 + ((days - 186) % 30)
    persian_digits = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')
    jalali_months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                     'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
    return f"{str(jd).translate(persian_digits)} {jalali_months[jm - 1]} {str(jy).translate(persian_digits)}"
