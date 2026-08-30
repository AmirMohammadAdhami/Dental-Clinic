/**
 * Dentura — Doctor Panel: Shared Layout + Local Data Store
 * سایدبار موبایل، لینک فعال، مودال خروج، توست و دیتابیس محلی (localStorage)
 */
(function () {
  'use strict';

  // ================= LOCAL DATA STORE =================
  var STORE_KEY = 'dentura-doctor-db-v2';

  function seedDb() {
    return {
      articles: [
        { id: 1, title: 'همه چیز درباره ایمپلنت دندان در ۵ دقیقه', category: 'ایمپلنت', status: 'published', cover: '../../assets/hero/dentist-work.jpg', date: '۱۴۰۴/۰۵/۱۲', views: 1240, content: '<h2>ایمپلنت چیست؟</h2><p>ایمپلنت دندان امروزه رایج‌ترین و بادوام‌ترین راه جایگزینی دندان از دست رفته است. در این مقاله مراحل کاشت ایمپلنت را مرحله به مرحله بررسی می‌کنیم.</p><h2>مراحل انجام</h2><ul><li>معاینه و تصویربرداری سه‌بعدی</li><li>کاشت فیکسچر در استخوان فک</li><li>گذراندن دوره جوش خوردن (osseointegration)</li><li>نصب اباتمنت و روکش نهایی</li></ul><p>مراقبت صحیح بعد از جراحی، عمر ایمپلنت را تا بیش از ۲۵ سال افزایش می‌دهد.</p>' },
        { id: 2, title: 'کامپوزیت یا لمینت؟ راهنمای انتخاب درست', category: 'زیبایی', status: 'published', cover: '../../assets/hero/smile-detail.jpg', date: '۱۴۰۴/۰۴/۲۸', views: 2310, content: '<p>انتخاب بین کامپوزیت و لمینت به شرایط دهان و دندان، بودجه و انتظار شما از نتیجه بستگی دارد. در این مقاله تفاوت‌های اصلی را بررسی می‌کنیم.</p>' },
        { id: 3, title: '۷ نکته طلایی برای مراقبت از بریس‌ها', category: 'ارتودنسی', status: 'draft', cover: '../../assets/hero/happy-patient.jpg', date: '۱۴۰۴/۰۵/۰۲', views: 0, content: '<p>مراقبت از بریس‌های ارتودنسی ساده‌تر از آن است که فکر می‌کنید؛ کافی است این نکات را رعایت کنید.</p>' },
        { id: 4, title: 'درمان ریشه (عصب‌کشی)؛ ترسِ بجا یا ضرورت؟', category: 'عصب‌کشی', status: 'needs-edit', cover: '../../assets/hero/patient-woman.jpg', date: '۱۴۰۴/۰۳/۱۹', views: 860, content: '<p>عصب‌کشی یکی از درمان‌هایی است که شاید بیش از حد لازم از آن ترسیده شود. در این مطلب واقعیت‌ها را می‌گوییم.</p>' }
      ],
      comments: [
        { id: 1, name: 'سارا محمدی', article: 'کامپوزیت یا لمینت؟ راهنمای انتخاب درست', text: 'دکتر من بین این دو مرددم؛ برای دندان‌های جلویی کدام دوام بیشتری دارد؟', date: '۱۴۰۴/۰۵/۲۰', status: 'pending', reply: null },
        { id: 2, name: 'علی رضایی', article: 'همه چیز درباره ایمپلنت دندان در ۵ دقیقه', text: 'آیا ایمپلنت برای سن بالای ۶۰ سال هم مناسب است؟', date: '۱۴۰۴/۰۵/۱۸', status: 'answered', reply: 'بله، به شرطی که تراکم استخوان فک کافی باشد. با بررسی CBCT تصمیم‌گیری می‌کنیم.' },
        { id: 3, name: 'مریم احمدی', article: 'همه چیز درباره ایمپلنت دندان در ۵ دقیقه', text: 'هزینه ایمپلنت تقریباً چقدر است و چند جلسه زمان می‌برد؟', date: '۱۴۰۴/۰۵/۱۵', status: 'pending', reply: null },
        { id: 4, name: 'حسین کریمی', article: '۷ نکته طلایی برای مراقبت از بریس‌ها', text: 'مقاله خیلی خوبی بود؛ فقط درباره مسواک مخصوص بریس هم توضیح می‌دهید؟', date: '۱۴۰۴/۰۵/۱۰', status: 'pending', reply: null }
      ],
      reviews: [
        { id: 1, name: 'نگار حسینی', date: '۱۴۰۴/۰۵/۲۲', treatment: 'کامپوزیت زیبایی', stars: 5, text: 'برخورد دکتر صادقی عالی بود و نتیجه کامپوزیت دقیقاً همان چیزی شد که انتظار داشتم. ممنونم.' },
        { id: 2, name: 'امیر توکلی', date: '۱۴۰۴/۰۵/۱۸', treatment: 'ایمپلنت', stars: 5, text: 'در طول جراحی ایمپلنت هیچ دردی حس نکردم و توضیحات قبل از عمل خیلی کامل بود.' },
        { id: 3, name: 'زهرا موسوی', date: '۱۴۰۴/۰۵/۰۹', treatment: 'عصب‌کشی', stars: 4, text: 'درمان خوب پیش رفت ولی کمی منتظر نوبتم نگه داشتند؛ در کل راضی بودم.' },
        { id: 4, name: 'محمد قاسمی', date: '۱۴۰۴/۰۴/۳۰', treatment: 'بلیچینگ', stars: 5, text: 'کلینیک تمیز و مدرن است و پرسنل مؤدب بودند. نتیجه بلیچینگ فوق‌العاده بود.' },
        { id: 5, name: 'الهام نوری', date: '۱۴۰۴/۰۴/۲۱', treatment: 'ارتودنسی', stars: 4, text: 'برنامه درمانی منظم و شفاف ارائه شد. فقط جلسات آخر کمی جابجا شد.' }
      ],
      appointments: [
        { id: 1,  patient: 'سارا محمدی',  treatment: 'کامپوزیت زیبایی', date: '۱۴۰۴/۰۶/۰۹', time: '۰۹:۰۰', status: 'completed', records: ['دیابت نوع ۲', 'فشار خون بالا'], prescription: 'متفورمین ۵۰۰mg — روزی ۲ بار\nانالاپریل ۱۰mg — روزی ۱ بار صبح' },
        { id: 2,  patient: 'علی رضایی',  treatment: 'ایمپلنت',        date: '۱۴۰۴/۰۶/۰۹', time: '۱۰:۳۰', status: 'completed', records: ['آلرژی به پنی‌سیلین'], prescription: 'سفکسیم ۴۰۰mg — روزی ۱ بار به مدت ۷ روز\nایبوپروفن ۴۰۰mg — هر ۸ ساعت در صورت درد' },
        { id: 3,  patient: 'مریم احمدی',  treatment: 'عصب‌کشی',        date: '۱۴۰۴/۰۶/۰۹', time: '۱۲:۰۰', status: 'upcoming',   records: ['بارداری'], prescription: '' },
        { id: 4,  patient: 'حسین کریمی',  treatment: 'بلیچینگ',        date: '۱۴۰۴/۰۶/۰۹', time: '۱۴:۰۰', status: 'upcoming',   records: [], prescription: '' },
        { id: 5,  patient: 'نگار حسینی',  treatment: 'ارتودنسی',       date: '۱۴۰۴/۰۶/۰۹', time: '۱۵:۳۰', status: 'pending',    records: ['آسم'], prescription: '' },
        { id: 6,  patient: 'امیر توکلی',  treatment: 'ایمپلنت',        date: '۱۴۰۴/۰۶/۱۰', time: '۰۹:۳۰', status: 'upcoming',   records: ['دیابت نوع ۱'], prescription: '' },
        { id: 7,  patient: 'زهرا موسوی',  treatment: 'کامپوزیت زیبایی', date: '۱۴۰۴/۰۶/۱۰', time: '۱۱:۰۰', status: 'upcoming',   records: [], prescription: '' },
        { id: 8,  patient: 'محمد قاسمی',  treatment: 'عصب‌کشی',        date: '۱۴۰۴/۰۶/۱۰', time: '۱۳:۳۰', status: 'pending',    records: ['فشار خون بالا'], prescription: '' },
        { id: 9,  patient: 'الهام نوری',  treatment: 'بلیچینگ',        date: '۱۴۰۴/۰۶/۱۱', time: '۱۰:۰۰', status: 'upcoming',   records: [], prescription: '' },
        { id: 10, patient: 'رضا عباسی',  treatment: 'ایمپلنت',        date: '۱۴۰۴/۰۶/۱۱', time: '۱۲:۰۰', status: 'pending',    records: ['دیابت نوع ۲', 'آسم'], prescription: '' },
        { id: 11, patient: 'لیلا نصرتی',  treatment: 'کامپوزیت زیبایی', date: '۱۴۰۴/۰۶/۰۸', time: '۰۹:۰۰', status: 'completed', records: [], prescription: 'ژل فلوراید — روزی ۲ بار مسواک' },
        { id: 12, patient: 'امیر حسینی',  treatment: 'عصب‌کشی',        date: '۱۴۰۴/۰۶/۰۸', time: '۱۱:۳۰', status: 'completed', records: ['فشار خون بالا', 'دیابت نوع ۲'], prescription: 'آموکسی‌سیلین ۵۰۰mg — روزی ۳ بار\nایبوپروفن ۴۰۰mg — هر ۸ ساعت\nمتفورمین ۵۰۰mg — ادامه داروهای قبلی' },
        { id: 13, patient: 'سمیرا رستمی', treatment: 'ارتودنسی',       date: '۱۴۰۴/۰۶/۰۸', time: '۱۵:۰۰', status: 'cancelled', records: ['بارداری'], prescription: '' },
        { id: 14, patient: 'بابک صابری',  treatment: 'ایمپلنت',        date: '۱۴۰۴/۰۶/۰۷', time: '۱۰:۰۰', status: 'completed', records: [], prescription: '' },
        { id: 15, patient: 'مهدیه خسروی', treatment: 'بلیچینگ',        date: '۱۴۰۴/۰۶/۰۷', time: '۱۴:۰۰', status: 'cancelled', records: ['آلرژی به پنی‌سیلین'], prescription: '' },
        { id: 16, patient: 'فرهاد رنجبر', treatment: 'کامپوزیت زیبایی', date: '۱۴۰۴/۰۶/۰۶', time: '۰۹:۳۰', status: 'completed', records: ['فشار خون بالا'], prescription: '' },
        { id: 17, patient: 'آزاده شریفی', treatment: 'عصب‌کشی',        date: '۱۴۰۴/۰۶/۰۶', time: '۱۱:۰۰', status: 'completed', records: [], prescription: '' },
        { id: 18, patient: 'کامران بیگی', treatment: 'ایمپلنت',        date: '۱۴۰۴/۰۶/۱۲', time: '۰۹:۰۰', status: 'upcoming',   records: ['دیابت نوع ۱', 'آسم'], prescription: '' },
        { id: 19, patient: 'نهال یزدانی', treatment: 'ارتودنسی',       date: '۱۴۰۴/۰۶/۱۲', time: '۱۱:۳۰', status: 'upcoming',   records: [], prescription: '' },
        { id: 20, patient: 'پوریا کاظمی', treatment: 'بلیچینگ',        date: '۱۴۰۴/۰۶/۱۲', time: '۱۳:۰۰', status: 'pending',    records: ['فشار خون بالا', 'دیابت نوع ۲'], prescription: '' }
      ],
      profile: {
        firstName: 'آرمان',
        lastName: 'صادقی',
        councilNo: '۷۲۳۴۵',
        experience: 14,
        university: 'دانشگاه علوم پزشکی تهران',
        degree: 'متخصص ترمیمی و زیبایی — بورد تخصصی',
        bio: 'به کلینیک دنتورا خوش آمدید. من با بیش از یک دهه تجربه در زمینه دندانپزشکی ترمیمی و زیبایی، باور دارم که لبخند هر بیمار یک اثر هنری منحصربه‌فرد است؛ ترکیبی از علم، دقت و هنر. فلسفه کاری من درمان کم‌تهاجمی با جدیدترین متدهای روز دنیاست.',
        avatar: '../../assets/doctors/doctor-1.jpg',
        services: ['ایمپلنت', 'کامپوزیت زیبایی', 'عصب‌کشی', 'بلیچینگ'],
        videoUrl: '',
        videoCover: '',
        certificates: [
          { title: 'دوره پیشرفته ایمپلنت‌های دیجیتال', org: 'دانشگاه وین — انجمن ایمپلنت اروپا', date: '۱۳۹۹', img: '' },
          { title: 'گواهینامه کامپوزیت و لمینت سرامیکی', org: 'آکادمی دندانپزشکی زیبایی تهران', date: '۱۴۰۰', img: '' }
        ]
      }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    var db = seedDb();
    save(db);
    return db;
  }

  function save(db) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch (e) { /* ignore */ }
  }

  window.DocDB = { load: load, save: save, seed: seedDb };

  // ================= TOAST =================
  var toastEl = null;
  var toastTimer = null;

  window.docToast = function (msg, type) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'doc-toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.className = 'doc-toast is-visible' + (type === 'error' ? ' doc-toast--error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 3400);
  };

  // ================= GENERIC CONFIRM / INFO MODAL =================
  window.docConfirm = function (title, text, okLabel, okClass, onOk) {
    var modal = document.createElement('div');
    modal.className = 'doc-modal';
    modal.innerHTML =
      '<div class="doc-modal-panel" role="dialog" aria-modal="true">' +
      '  <h2 class="doc-modal-title"></h2>' +
      '  <p class="doc-modal-text"></p>' +
      '  <div class="doc-modal-actions">' +
      '    <button type="button" class="doc-btn ' + okClass + '"></button>' +
      '    <button type="button" class="doc-btn doc-btn--ghost" data-close>انصراف</button>' +
      '  </div>' +
      '</div>';
    modal.querySelector('.doc-modal-title').textContent = title;
    modal.querySelector('.doc-modal-text').textContent = text;
    var okBtn = modal.querySelector('.doc-btn:not(.doc-btn--ghost)');
    okBtn.textContent = okLabel || 'تأیید';

    function close() {
      modal.classList.remove('is-open');
      setTimeout(function () { modal.remove(); }, 300);
    }

    okBtn.addEventListener('click', function () { close(); if (onOk) onOk(); });
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.hasAttribute('data-close')) close();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });

    document.body.appendChild(modal);
    requestAnimationFrame(function () { modal.classList.add('is-open'); });
    return modal;
  };

  // ================= SIDEBAR (MOBILE DRAWER) =================
  var sidebar = document.getElementById('docSidebar');
  var overlay = document.getElementById('docOverlay');
  var burger = document.getElementById('docHamburger');

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('is-open');
    overlay.classList.remove('is-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (sidebar && overlay && burger) {
    burger.addEventListener('click', function () {
      var open = sidebar.classList.toggle('is-open');
      overlay.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    overlay.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSidebar();
    });
    sidebar.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeSidebar);
    });
  }

  // ================= PENDING COMMENTS BADGE =================
  var badge = document.getElementById('docPendingBadge');
  if (badge) {
    var pending = DocDB.load().comments.filter(function (c) { return c.status === 'pending'; }).length;
    badge.textContent = toPersianNum(pending);
    badge.style.display = pending > 0 ? '' : 'none';
  }

  // ================= LOGOUT CONFIRM =================
  var logoutLink = document.getElementById('docLogout');
  if (logoutLink) {
    logoutLink.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      docConfirm('خروج از حساب کاربری', 'آیا مطمئن هستید که می‌خواهید از پنل پزشک خارج شوید؟', 'بله، خارج می‌شوم', 'doc-btn--danger', function () {
        window.location.href = logoutLink.getAttribute('data-href') || '../home/index.html';
      });
    });
  }
})();
