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

_PERSIAN_DIGITS = str.maketrans('0123456789', '۰۱۲۳۴۵۶۷۸۹')
_JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
                  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']


@register.inclusion_tag('blog/blocks/content_blocks.html', takes_context=True)
def render_content_blocks(context, blocks):
    """
    Render a list of content block dicts as styled HTML.

    Each block must have:
        type  – one of heading, paragraph, tip, warning, info, list,
                quote, table, image, gallery
        data  – dict of fields for that type

    Heading blocks get a sequential ``heading_index`` (counting only
    headings) so the TOC links (``#section-N``) stay consistent with the
    rendered heading ids.
    """
    result = []
    heading_index = 0
    for block in blocks or []:
        block = dict(block)
        if block.get('type') == 'heading':
            heading_index += 1
            block['heading_index'] = heading_index
        result.append(block)
    return {
        'blocks': result,
    }


@register.filter
def get_block_field(block, field_name):
    """Retrieve a field from a block's data dict."""
    return block.get('data', {}).get(field_name, '')


@register.simple_tag
def get_first_image(article):
    """Return the URL of the article's first IMAGE media item (same fallback
    logic the old JS getFirstImage() used), or '' when none exists."""
    try:
        for f in article.media.all():
            if f.media_type == 'IMAGE' and f.file:
                return f.file.url
    except Exception:
        pass
    return ''


@register.filter
def to_persian_num(value):
    """Convert western digits in a value to Persian digits."""
    return str(value if value is not None else '').translate(_PERSIAN_DIGITS)


def _to_jalali(dt):
    import math
    gy, gm, gd = dt.year, dt.month, dt.day
    g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
    gy2 = gy + 1 if gm > 2 else gy
    days = (355666 + (365 * gy) + math.floor((gy2 + 3) / 4)
            - math.floor((gy2 + 99) / 100) + math.floor((gy2 + 399) / 400)
            + gd + g_d_m[gm - 1])
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
    return jy, jm, jd


@register.filter
def to_jalali(dt):
    """Convert a datetime to a Persian Jalali date string like '۲۸ مرداد ۱۴۰۵'."""
    if not dt:
        return ''
    jy, jm, jd = _to_jalali(dt)
    return (f"{str(jd).translate(_PERSIAN_DIGITS)} "
            f"{_JALALI_MONTHS[jm - 1]} {str(jy).translate(_PERSIAN_DIGITS)}")


@register.filter
def to_jalali_year(dt):
    """Convert a datetime/date to a Persian Jalali year like '۱۴۰۳'."""
    if not dt:
        return ''
    jy, _, _ = _to_jalali(dt)
    return str(jy).translate(_PERSIAN_DIGITS)


@register.filter
def to_relative_time(dt):
    """Relative Persian time — mirrors post.js toRelativeTime()."""
    if not dt:
        return ''
    from django.utils import timezone
    diff = (timezone.now() - dt).total_seconds()
    if diff < 60:
        return 'لحظاتی پیش'
    if diff < 3600:
        return f"{int(diff // 60)}".translate(_PERSIAN_DIGITS) + ' دقیقه پیش'
    if diff < 86400:
        return f"{int(diff // 3600)}".translate(_PERSIAN_DIGITS) + ' ساعت پیش'
    if diff < 2592000:
        return f"{int(diff // 86400)}".translate(_PERSIAN_DIGITS) + ' روز پیش'
    if diff < 31536000:
        return f"{int(diff // 2592000)}".translate(_PERSIAN_DIGITS) + ' ماه پیش'
    return f"{int(diff // 31536000)}".translate(_PERSIAN_DIGITS) + ' سال پیش'
