/**
 * Dentura — Doctor Panel: Analytics (داشبورد و آمار)
 * شمارنده KPI، نمودار دوناتی تفکیک درمان‌ها و نمودار خطی روند مراجعات (SVG خالص)
 * All data fetched from API.
 */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  function faNum(n) {
    return toPersianNum(String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '،'));
  }

  function faPercent(n) { return toPersianNum(n) + '٪'; }

  function el(tag, attrs, txt) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (txt !== undefined) node.textContent = txt;
    return node;
  }

  // ================= KPI COUNTERS =================
  function animateCounters() {
    document.querySelectorAll('[data-count]').forEach(function (e) {
      var target = parseFloat(e.getAttribute('data-count'));
      if (isNaN(target) || target === 0) { e.textContent = faNum(0); return; }
      if (REDUCED) { e.textContent = faNum(target); return; }
      var start = null;
      var DURATION = 1400;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / DURATION, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        e.textContent = faNum(target * eased);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  // ================= DONUT CHART =================
  function renderDonut(data, totalValue) {
    var donut = document.getElementById('donutChart');
    if (!donut || !data.length) return;

    var R = 84;
    var C = 2 * Math.PI * R;
    var total = data.reduce(function (s, d) { return s + d.count; }, 0) || 1;

    donut.innerHTML = '';
    donut.appendChild(el('circle', { cx: 110, cy: 110, r: R, stroke: 'rgba(15,118,110,0.08)', 'stroke-width': 22 }));

    var COLORS = ['#0F766E', '#D4AF37', '#94A3B8', '#E8793B', '#6366F1', '#EC4899'];
    var offset = 0;

    data.forEach(function (d, i) {
      var frac = d.count / total;
      var len = frac * C;
      var seg = el('circle', {
        cx: 110, cy: 110, r: R,
        stroke: COLORS[i % COLORS.length],
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

    var t1 = el('text', { x: 110, y: 106, 'text-anchor': 'middle', class: 'doc-donut-center-num' });
    t1.textContent = faNum(totalValue);
    var t2 = el('text', { x: 110, y: 128, 'text-anchor': 'middle', class: 'doc-donut-center-label' });
    t2.textContent = 'کل مراجعات امسال';
    donut.appendChild(t1);
    donut.appendChild(t2);

    // Legend
    var legend = document.getElementById('donutLegend');
    if (legend) {
      legend.innerHTML = '';
      data.forEach(function (d, i) {
        var pct = Math.round((d.count / total) * 100);
        var item = document.createElement('div');
        item.className = 'doc-legend-item';
        item.innerHTML = '<span class="doc-legend-swatch" style="background:' + COLORS[i % COLORS.length] + '"></span>' +
          '<span>' + d.service_name + '</span>' +
          '<span class="doc-legend-val">' + faPercent(pct) + '</span>';
        legend.appendChild(item);
      });
    }
  }

  // ================= LINE CHART =================
  function renderLineChart(data) {
    var line = document.getElementById('lineChart');
    if (!line || !data.length) return;

    var W = 640, H = 280;
    var PAD = { top: 34, right: 18, bottom: 40, left: 40 };
    var innerW = W - PAD.left - PAD.right;
    var innerH = H - PAD.top - PAD.bottom;
    var counts = data.map(function (d) { return d.count; });
    var maxV = Math.max.apply(null, counts) * 1.15 || 100;

    line.innerHTML = '';

    function xPos(i) { return PAD.left + (i / (data.length - 1 || 1)) * innerW; }
    function yPos(v) { return PAD.top + innerH - (v / maxV) * innerH; }

    // Grid lines
    var steps = 4;
    for (var s = 0; s <= steps; s++) {
      var v = Math.round((maxV / steps) * s);
      line.appendChild(el('line', { x1: PAD.left, x2: W - PAD.right, y1: yPos(v), y2: yPos(v), class: 'doc-grid-line' }));
      line.appendChild(el('text', { x: PAD.left - 8, y: yPos(v) + 4, 'text-anchor': 'end', class: 'doc-axis-text' }, toPersianNum(v)));
    }

    // Area fill + line
    var pts = data.map(function (d, i) { return xPos(i) + ',' + yPos(d.count); }).join(' ');
    var areaD = 'M' + xPos(0) + ',' + (PAD.top + innerH) + ' L' + pts.split(' ').join(' L') + ' L' + xPos(data.length - 1) + ',' + (PAD.top + innerH) + ' Z';
    var defs = el('defs', {});
    var grad = el('linearGradient', { id: 'lineGrad', x1: 0, y1: 0, x2: 0, y2: 1 });
    grad.appendChild(el('stop', { offset: '0%', 'stop-color': 'rgba(15,118,110,0.28)' }));
    grad.appendChild(el('stop', { offset: '100%', 'stop-color': 'rgba(15,118,110,0)' }));
    defs.appendChild(grad);
    line.appendChild(defs);
    line.appendChild(el('path', { d: areaD, fill: 'url(#lineGrad)' }));
    var polyline = el('polyline', { points: pts, class: 'doc-line-path' });
    line.appendChild(polyline);

    // Animate line
    if (!REDUCED) {
      var totalLen = polyline.getTotalLength ? polyline.getTotalLength() : 0;
      if (totalLen > 0) {
        polyline.style.strokeDasharray = totalLen;
        polyline.style.strokeDashoffset = totalLen;
        polyline.getBoundingClientRect();
        polyline.style.transition = 'stroke-dashoffset 1.6s var(--ease-smooth)';
        polyline.style.strokeDashoffset = '0';
      }
    }

    // Dots + labels
    data.forEach(function (d, i) {
      var dot = el('circle', { cx: xPos(i), cy: yPos(d.count), r: 4.5, class: 'doc-dot' });
      dot.appendChild(el('title', {}, d.month + ': ' + toPersianNum(d.count) + ' مراجعه'));
      line.appendChild(dot);
      line.appendChild(el('text', {
        x: xPos(i), y: H - 14, 'text-anchor': 'middle', class: 'doc-axis-text'
      }, d.month));
      if (d.count > maxV * 0.8 || i === 0 || i === data.length - 1) {
        line.appendChild(el('text', {
          x: xPos(i), y: yPos(d.count) - 12, 'text-anchor': 'middle', class: 'doc-value-text'
        }, toPersianNum(d.count)));
      }
    });
  }

  // ================= TODAY'S APPOINTMENTS =================
  function renderTodayAppts(appts) {
    var todayGrid = document.getElementById('todayGrid');
    var todayCountEl = document.getElementById('todayCount');
    if (!todayGrid) return;

    var STATUS_MAP = {
      DONE: { label: 'انجام‌شده', cls: 'doc-appt-status--completed' },
      CANCELLED: { label: 'لغوشده', cls: 'doc-appt-status--cancelled' },
      RESERVED: { label: 'پیش‌رو', cls: 'doc-appt-status--upcoming' },
      PENDING: { label: 'معلق', cls: 'doc-appt-status--pending' }
    };

    if (todayCountEl) {
      todayCountEl.textContent = appts.length > 0
        ? toPersianNum(appts.length) + ' نوبت برای امروز ثبت شده است'
        : 'امروز نوبتی ثبت نشده است.';
    }

    if (appts.length === 0) {
      todayGrid.innerHTML = '<div class="doc-empty" style="grid-column:1/-1">امروز نوبتی ثبت نشده است.</div>';
      return;
    }

    var html = '';
    appts.forEach(function (a) {
      var st = STATUS_MAP[a.status] || STATUS_MAP.PENDING;
      var dt = new Date(a.appointment_date);
      var time = toPersianNum(dt.getHours().toString().padStart(2, '0')) + ':' + toPersianNum(dt.getMinutes().toString().padStart(2, '0'));
      html +=
        '<div class="doc-today-card">' +
          '<div class="doc-today-head">' +
            '<span class="doc-today-patient">' + a.patient_name + '</span>' +
            '<span class="doc-appt-status ' + st.cls + '"><span class="doc-appt-status-dot"></span>' + st.label + '</span>' +
          '</div>' +
          '<div class="doc-today-info">' +
            '<span>🦷 ' + a.service_name + '</span>' +
            '<span class="doc-today-time">🕐 ساعت ' + time + '</span>' +
          '</div>' +
        '</div>';
    });
    todayGrid.innerHTML = html;
  }

  // ================= LOAD DATA =================
  apiFetch('GET', '/doctor-dashboard/overview/').then(function (data) {
    // KPIs
    var kpiEls = document.querySelectorAll('.doc-kpi-value[data-count]');
    if (kpiEls[0]) kpiEls[0].setAttribute('data-count', data.total_patients);
    if (kpiEls[1]) kpiEls[1].setAttribute('data-count', data.total_appointments_year);

    var ratingEl = document.getElementById('ratingKpi');
    if (ratingEl) ratingEl.innerHTML = toPersianNum(data.average_rating) + ' <small>از ۵ ⭐️</small>';

    if (kpiEls[3]) kpiEls[3].setAttribute('data-count', data.published_articles_count);

    animateCounters();

    // Today's appointments
    renderTodayAppts(data.today_appointments || []);

    // Donut chart
    if (data.treatment_breakdown && data.treatment_breakdown.length) {
      renderDonut(data.treatment_breakdown, data.total_appointments_year);
    }

    // Line chart
    if (data.monthly_visits && data.monthly_visits.length) {
      renderLineChart(data.monthly_visits);
    }
  }).catch(function (err) {
    docToast('خطا در بارگذاری اطلاعات داشبورد', 'error');
  });
})();
