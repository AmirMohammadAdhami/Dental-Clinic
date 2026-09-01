/**
 * Dentora — پنل پذیرش: صفحه آمار مطب
 */
(function () {
  'use strict';

  var data = ReceptionData.analytics;
  var colors = ['#0F766E', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e'];

  // --- KPI ---
  document.getElementById('analyticsKpi').innerHTML =
    '<article class="rc-kpi"><div class="rc-kpi-icon rc-kpi-icon--blue"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div><div><div class="rc-kpi-value">' + data.totalPatients + '</div><div class="rc-kpi-label">کل بیماران ثبت‌شده</div></div></article>' +
    '<article class="rc-kpi"><div class="rc-kpi-icon rc-kpi-icon--green"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div><div class="rc-kpi-value">' + data.totalDoctors + '</div><div class="rc-kpi-label">تعداد پزشکان</div></div></article>' +
    '<article class="rc-kpi"><div class="rc-kpi-icon rc-kpi-icon--orange"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg></div><div><div class="rc-kpi-value">' + data.monthlyAppointments + '</div><div class="rc-kpi-label">مجموع نوبت‌های ماه</div></div></article>' +
    '<article class="rc-kpi"><div class="rc-kpi-icon rc-kpi-icon--red"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></div><div><div class="rc-kpi-value">۶</div><div class="rc-kpi-label">ماه فعال</div></div></article>';

  // --- LINE CHART ---
  var trend = data.monthlyTrend;
  var maxCount = Math.max.apply(null, trend.map(function (t) { return t.count; }));
  var svgW = 500, svgH = 200, padX = 40, padY = 20;
  var chartW = svgW - padX * 2, chartH = svgH - padY * 2;

  var points = trend.map(function (t, i) {
    var x = padX + (i / (trend.length - 1)) * chartW;
    var y = padY + chartH - (t.count / maxCount) * chartH;
    return { x: x, y: y, label: t.month, value: t.count };
  });

  var pathD = points.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x + ',' + p.y; }).join(' ');
  var areaD = pathD + ' L' + points[points.length - 1].x + ',' + (padY + chartH) + ' L' + points[0].x + ',' + (padY + chartH) + ' Z';

  var lineSvg = '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;height:auto">' +
    '<defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0F766E" stop-opacity="0.3"/><stop offset="100%" stop-color="#0F766E" stop-opacity="0.02"/></linearGradient></defs>' +
    '<path d="' + areaD + '" fill="url(#areaGrad)"/>' +
    '<path d="' + pathD + '" fill="none" stroke="#0F766E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    points.map(function (p) {
      return '<circle cx="' + p.x + '" cy="' + p.y + '" r="4" fill="#0F766E"/>' +
        '<text x="' + p.x + '" y="' + (p.y - 10) + '" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-weight="700">' + p.value + '</text>' +
        '<text x="' + p.x + '" y="' + (padY + chartH + 16) + '" text-anchor="middle" fill="var(--text-faint)" font-size="10">' + p.label + '</text>';
    }).join('') +
    '</svg>';
  document.getElementById('lineChartWrap').innerHTML = lineSvg;

  // --- BAR CHART ---
  var services = data.popularServices;
  var maxService = Math.max.apply(null, services.map(function (s) { return s.count; }));
  var barSvgW = 500, barSvgH = 220, barPad = 40;
  var barChartH = barSvgH - barPad * 2;
  var barW = (barSvgW - barPad * 2) / services.length - 8;

  var barSvg = '<svg viewBox="0 0 ' + barSvgW + ' ' + barSvgH + '" style="width:100%;height:auto">' +
    services.map(function (s, i) {
      var x = barPad + i * ((barSvgW - barPad * 2) / services.length) + 4;
      var h = (s.count / maxService) * barChartH;
      var y = barPad + barChartH - h;
      return '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + h + '" rx="4" fill="' + colors[i % colors.length] + '" opacity="0.85"/>' +
        '<text x="' + (x + barW / 2) + '" y="' + (y - 6) + '" text-anchor="middle" fill="var(--text-muted)" font-size="11" font-weight="700">' + s.count + '</text>' +
        '<text x="' + (x + barW / 2) + '" y="' + (barPad + barChartH + 16) + '" text-anchor="middle" fill="var(--text-faint)" font-size="9">' + s.name + '</text>';
    }).join('') +
    '</svg>';
  document.getElementById('barChartWrap').innerHTML = barSvg;

  // --- PIE CHART ---
  var doctors = data.doctorDistribution;
  var totalDoc = doctors.reduce(function (sum, d) { return sum + d.count; }, 0);
  var cx = 100, cy = 100, r = 80;
  var startAngle = -Math.PI / 2;
  var pieSvg = '<svg viewBox="0 0 200 200" style="width:200px;height:200px">';
  var legendHtml = '';

  doctors.forEach(function (d, i) {
    var slice = (d.count / totalDoc) * Math.PI * 2;
    var endAngle = startAngle + slice;
    var x1 = cx + r * Math.cos(startAngle);
    var y1 = cy + r * Math.sin(startAngle);
    var x2 = cx + r * Math.cos(endAngle);
    var y2 = cy + r * Math.sin(endAngle);
    var largeArc = slice > Math.PI ? 1 : 0;

    var path = 'M' + cx + ',' + cy + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + largeArc + ',1 ' + x2 + ',' + y2 + ' Z';
    pieSvg += '<path d="' + path + '" fill="' + colors[i % colors.length] + '" opacity="0.85"><title>' + d.name + ': ' + d.count + ' نوبت</title></path>';
    legendHtml += '<div class="rc-legend-item"><span class="rc-legend-dot" style="background:' + colors[i % colors.length] + '"></span>' + d.name + ' (' + d.count + ')</div>';

    startAngle = endAngle;
  });

  pieSvg += '<circle cx="' + cx + '" cy="' + cy + '" r="40" fill="var(--surface)"/><text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" fill="var(--text)" font-size="14" font-weight="800">' + totalDoc + '</text><text x="' + cx + '" y="' + (cy + 12) + '" text-anchor="middle" fill="var(--text-faint)" font-size="9">نوبت</text></svg>';

  document.getElementById('pieChartWrap').innerHTML = pieSvg;
  document.getElementById('pieLegend').innerHTML = legendHtml;

})();
