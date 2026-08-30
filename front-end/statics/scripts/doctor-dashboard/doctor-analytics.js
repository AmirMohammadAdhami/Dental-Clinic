/**
 * Dentura — Doctor Panel: Analytics (داشبورد و آمار)
 * شمارنده KPI، نمودار دوناتی تفکیک درمان‌ها و نمودار خطی روند مراجعات (SVG خالص)
 */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function faNum(n) {
    return toPersianNum(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '،'));
  }

  function faPercent(n) { return toPersianNum(n) + '٪'; }

  // ================= KPI COUNTERS =================
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target)) return;
      if (REDUCED) { el.textContent = faNum(target); return; }
      var start = null;
      var DURATION = 1400;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / DURATION, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = faNum(target * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // مقاله‌های منتشرشده از استور
  var db = DocDB.load();
  var published = db.articles.filter(function (a) { return a.status === 'published'; }).length;
  var pubEl = document.getElementById('kpiArticlesValue');
  if (pubEl) pubEl.setAttribute('data-count', published);

  animateCounters();

  // ================= DONUT CHART (تفکیک درمان‌ها) =================
  var DONUT_DATA = [
    { label: 'کامپوزیت زیبایی', value: 45, color: '#0F766E' },
    { label: 'ایمپلنت', value: 30, color: '#D4AF37' },
    { label: 'عصب‌کشی', value: 25, color: '#94A3B8' }
  ];

  var donut = document.getElementById('donutChart');
  if (donut) {
    var NS = 'http://www.w3.org/2000/svg';
    var R = 84;
    var C = 2 * Math.PI * R;
    var total = DONUT_DATA.reduce(function (s, d) { return s + d.value; }, 0);

    function el(tag, attrs) {
      var node = document.createElementNS(NS, tag);
      for (var k in attrs) node.setAttribute(k, attrs[k]);
      return node;
    }

    // بک‌گراند حلقه
    donut.appendChild(el('circle', { cx: 110, cy: 110, r: R, stroke: 'rgba(15,118,110,0.08)', 'stroke-width': 22 }));

    var offset = 0;
    DONUT_DATA.forEach(function (d, i) {
      var frac = d.value / total;
      var len = frac * C;
      var seg = el('circle', {
        cx: 110, cy: 110, r: R,
        stroke: d.color,
        'stroke-width': 22,
        'stroke-linecap': 'butt',
        class: 'doc-donut-seg',
        transform: 'rotate(-90 110 110)',
        'stroke-dasharray': '0 ' + C,
        'stroke-dashoffset': -offset
      });
      donut.appendChild(seg);
      var finalLen = len;
      setTimeout(function () {
        seg.setAttribute('stroke-dasharray', (finalLen - 2.5) + ' ' + C);
      }, REDUCED ? 0 : 250 + i * 220);
      offset += len;
    });

    // متن مرکزی
    var t1 = el('text', { x: 110, y: 106, 'text-anchor': 'middle', class: 'doc-donut-center-num' });
    t1.textContent = faNum(2480);
    var t2 = el('text', { x: 110, y: 128, 'text-anchor': 'middle', class: 'doc-donut-center-label' });
    t2.textContent = 'کل مراجعات امسال';
    donut.appendChild(t1);
    donut.appendChild(t2);

    // لیجند
    var legend = document.getElementById('donutLegend');
    if (legend) {
      DONUT_DATA.forEach(function (d) {
        var item = document.createElement('div');
        item.className = 'doc-legend-item';
        item.innerHTML = '<span class="doc-legend-swatch" style="background:' + d.color + '"></span>' +
          '<span>' + d.label + '</span>' +
          '<span class="doc-legend-val">' + faPercent(d.value) + '</span>';
        legend.appendChild(item);
      });
      var note = document.createElement('p');
      note.className = 'doc-card-sub';
      note.style.marginTop = '4px';
      note.textContent = 'سایر خدمات: ' + faPercent(100 - DONUT_DATA.reduce(function (s, d) { return s + d.value; }, 0)) + ' از مراجعات';
      legend.appendChild(note);
    }
  }

  // ================= LINE CHART (روند مراجعات ماهانه) =================
  var MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  var MONTHS_SHORT = ['فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر', 'مهر', 'آبا', 'آذر', 'دی', 'بهم', 'اسف'];
  var VISITS = [120, 150, 135, 180, 210, 190, 240, 225, 260, 310, 290, 335];

  var line = document.getElementById('lineChart');
  if (line) {
    var W = 640, H = 280;
    var PAD = { top: 34, right: 18, bottom: 40, left: 40 };
    var innerW = W - PAD.left - PAD.right;
    var innerH = H - PAD.top - PAD.bottom;
    var maxV = 350;

    function el2(tag, attrs, txt) {
      var node = document.createElementNS(NS2, tag);
      for (var k in attrs) node.setAttribute(k, attrs[k]);
      if (txt !== undefined) node.textContent = txt;
      return node;
    }
    var NS2 = 'http://www.w3.org/2000/svg';

    function x(i) { return PAD.left + (i / (VISITS.length - 1)) * innerW; }
    function y(v) { return PAD.top + innerH - (v / maxV) * innerH; }

    // خطوط راهنما + برچسب محور عمودی
    [0, 87.5, 175, 262.5, 350].forEach(function (v) {
      line.appendChild(el2('line', {
        x1: PAD.left, x2: W - PAD.right, y1: y(v), y2: y(v),
        class: 'doc-grid-line'
      }));
      line.appendChild(el2('text', {
        x: PAD.left - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'doc-axis-text'
      }, toPersianNum(v)));
    });

    // مسیر ناحیه (fill) و خط
    var pts = VISITS.map(function (v, i) { return x(i) + ',' + y(v); }).join(' ');
    var areaD = 'M' + x(0) + ',' + (PAD.top + innerH) + ' L' + pts.split(' ').join(' L') + ' L' + x(VISITS.length - 1) + ',' + (PAD.top + innerH) + ' Z';
    var defs = el2('defs', {});
    var grad = el2('linearGradient', { id: 'lineGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(el2('stop', { offset: '0%', 'stop-color': 'rgba(15,118,110,0.28)' }));
    grad.appendChild(el2('stop', { offset: '100%', 'stop-color': 'rgba(15,118,110,0)' }));
    defs.appendChild(grad);
    line.appendChild(defs);
    line.appendChild(el2('path', { d: areaD, fill: 'url(#lineGrad)' }));

    var path = el2('polyline', { points: pts, class: 'doc-line-path' });
    line.appendChild(path);

    // انیمیشن رسم خط
    if (!REDUCED) {
      var totalLen = path.getTotalLength ? path.getTotalLength() : 0;
      if (totalLen > 0) {
        path.style.strokeDasharray = totalLen;
        path.style.strokeDashoffset = totalLen;
        path.getBoundingClientRect();
        path.style.transition = 'stroke-dashoffset 1.6s var(--ease-smooth)';
        path.style.strokeDashoffset = '0';
      }
    }

    // نقاط + برچسب مقدار + محور ماه‌ها
    VISITS.forEach(function (v, i) {
      var dot = el2('circle', { cx: x(i), cy: y(v), r: 4.5, class: 'doc-dot' });
      dot.appendChild(el2('title', {}, MONTHS[i] + ': ' + toPersianNum(v) + ' مراجعه'));
      line.appendChild(dot);
      if (i === VISITS.length - 1 || i === 0 || v >= 300) {
        line.appendChild(el2('text', {
          x: x(i), y: y(v) - 12, 'text-anchor': 'middle', class: 'doc-value-text'
        }, toPersianNum(v)));
      }
      line.appendChild(el2('text', {
        x: x(i), y: H - 14, 'text-anchor': 'middle', class: 'doc-axis-text'
      }, MONTHS_SHORT[i]));
    });
  }

  // ================= TODAY'S APPOINTMENTS =================
  var TODAY_DATE = '۱۴۰۴/۰۶/۰۹'; // تاریخ امروز نمونه
  var todayGrid = document.getElementById('todayGrid');
  var todayCountEl = document.getElementById('todayCount');

  if (todayGrid) {
    var allAppts = db.appointments || [];
    var todayAppts = allAppts.filter(function (a) { return a.date === TODAY_DATE; });

    var STATUS_MAP = {
      completed: { label: 'انجام‌شده', cls: 'doc-appt-status--completed' },
      cancelled: { label: 'لغوشده', cls: 'doc-appt-status--cancelled' },
      upcoming:  { label: 'پیش‌رو', cls: 'doc-appt-status--upcoming' },
      pending:   { label: 'معلق', cls: 'doc-appt-status--pending' }
    };

    if (todayCountEl) {
      todayCountEl.textContent = todayAppts.length > 0
        ? toPersianNum(todayAppts.length) + ' نوبت برای امروز ثبت شده است'
        : 'امروز نوبتی ثبت نشده است.';
    }

    if (todayAppts.length === 0) {
      todayGrid.innerHTML = '<div class="doc-empty" style="grid-column:1/-1">امروز نوبتی ثبت نشده است.</div>';
    } else {
      var html = '';
      todayAppts.forEach(function (appt) {
        var st = STATUS_MAP[appt.status] || STATUS_MAP.pending;
        html +=
          '<div class="doc-today-card">' +
            '<div class="doc-today-head">' +
              '<span class="doc-today-patient">' + appt.patient + '</span>' +
              '<span class="doc-appt-status ' + st.cls + '"><span class="doc-appt-status-dot"></span>' + st.label + '</span>' +
            '</div>' +
            '<div class="doc-today-info">' +
              '<span>🦷 ' + appt.treatment + '</span>' +
              '<span class="doc-today-time">🕐 ساعت ' + appt.time + '</span>' +
            '</div>' +
            '<a href="appointments.html" class="doc-btn doc-btn--ghost doc-btn--sm" style="margin-top:4px">👁️ مشاهده اطلاعات</a>' +
          '</div>';
      });
      todayGrid.innerHTML = html;
    }
  }
})();
