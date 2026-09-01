/**
 * Dentora — پنل پذیرش: داده‌های استاتیک نمونه
 * تمام اطلاعات فرضی است و فقط برای پیش‌نمایش رابط کاربری استفاده می‌شود.
 */
var ReceptionData = (function () {
  'use strict';

  var doctors = [
    { id: 1, name: 'دکتر کاوه آذرخو', licenseNo: '۱۲۳۴۵۶', phone: '۰۲۱-۸۸۷۷۶۶۵۵', avatar: '../../assets/doctors/doctor-1.jpg' },
    { id: 2, name: 'دکتر امیرمحمد فرهمندنیا', licenseNo: '۲۳۴۵۶۷', phone: '۰۲۱-۸۸۷۷۶۶۵۶', avatar: '../../assets/doctors/doctor-2.jpg' },
    { id: 3, name: 'دکتر مهسا امیری‌راد', licenseNo: '۳۴۵۶۷۸', phone: '۰۲۱-۸۸۷۷۶۶۵۷', avatar: '../../assets/doctors/doctor-3.jpg' },
    { id: 4, name: 'دکتر رضا حیدری', licenseNo: '۴۵۶۷۸۹', phone: '۰۲۱-۸۸۷۷۶۶۵۸', avatar: '../../assets/doctors/doctor-4.jpg' },
    { id: 5, name: 'دکتر سارا نوری', licenseNo: '۵۶۷۸۹۰', phone: '۰۲۱-۸۸۷۷۶۶۵۹', avatar: '../../assets/doctors/doctor-5.jpg' }
  ];

  var services = [
    { id: 1, name: 'ایمپلنت دندان', price: 15000000 },
    { id: 2, name: 'کامپوزیت ونیر', price: 8000000 },
    { id: 3, name: 'لمینت سرامیکی', price: 12000000 },
    { id: 4, name: 'عصب‌کشی', price: 3500000 },
    { id: 5, name: 'جرم‌گیری و بلیچینگ', price: 2000000 },
    { id: 6, name: 'پرکردن دندان', price: 1200000 },
    { id: 7, name: 'کشیدن دندان', price: 800000 },
    { id: 8, name: 'چکاپ دوره‌ای', price: 500000 },
    { id: 9, name: 'ارتودنسی', price: 20000000 },
    { id: 10, name: 'درمان لثه', price: 4000000 }
  ];

  var patients = [
    { id: 1, firstName: 'امیرمحمد', lastName: 'کاظمی', phone: '09121234567', nationalId: '0012345678', appointments: 8, emergencyPhone: '09129876543', medicalHistory: ['دیابت نوع ۲'], address: 'تهران، خیابان ولیعصر، پلاک ۱۲' },
    { id: 2, firstName: 'زهرا', lastName: 'رضایی', phone: '09351234567', nationalId: '0023456789', appointments: 5, emergencyPhone: '09359876543', medicalHistory: [], address: 'تهران، خیابان آزادی، پلاک ۴۵' },
    { id: 3, firstName: 'علی', lastName: 'محمدی', phone: '09191234567', nationalId: '0034567890', appointments: 12, emergencyPhone: '09199876543', medicalHistory: ['فشار خون بالا'], address: 'تهران، خیابان انقلاب، پلاک ۷۸' },
    { id: 4, firstName: 'مریم', lastName: 'احمدی', phone: '09121112233', nationalId: '0045678901', appointments: 3, emergencyPhone: '09123334455', medicalHistory: ['آلرژی به پنی‌سیلین'], address: 'تهران، خیابان شریعتی، پلاک ۲۳' },
    { id: 5, firstName: 'حسین', lastName: 'کریمی', phone: '09122223344', nationalId: '0056789012', appointments: 7, emergencyPhone: '09124445566', medicalHistory: [], address: 'تهران، خیابان میرداماد، پلاک ۵۶' },
    { id: 6, firstName: 'نگار', lastName: 'حسینی', phone: '09123334455', nationalId: '0067890123', appointments: 2, emergencyPhone: '09125556677', medicalHistory: ['بارداری'], address: 'تهران، خیابان ولنجک، پلاک ۸۹' },
    { id: 7, firstName: 'امیر', lastName: 'توکلی', phone: '09124445566', nationalId: '0078901234', appointments: 6, emergencyPhone: '09126667788', medicalHistory: ['آسم'], address: 'تهران، خیابان جردن، پلاک ۳۴' },
    { id: 8, firstName: 'زهرا', lastName: 'موسوی', phone: '09125556677', nationalId: '0089012345', appointments: 4, emergencyPhone: '09127778899', medicalHistory: [], address: 'تهران، خیابان پاسداران، پلاک ۶۷' },
    { id: 9, firstName: 'محمد', lastName: 'قاسمی', phone: '09126667788', nationalId: '0090123456', appointments: 9, emergencyPhone: '09128889900', medicalHistory: ['دیابت نوع ۱'], address: 'تهران، خیابان نیاوران، پلاک ۱۲' },
    { id: 10, firstName: 'الهام', lastName: 'نوری', phone: '09127778899', nationalId: '0101234567', appointments: 1, emergencyPhone: '09129990011', medicalHistory: [], address: 'تهران، خیابان فرمانیه، پلاک ۹۰' }
  ];

  var todayAppointments = [
    { id: 101, time: '۰۸:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'امیرمحمد کاظمی', doctor: 'دکتر کاوه آذرخو', service: 'ایمپلنت دندان', amount: 15000000, status: 'arrived', problems: ['درد دندان'] },
    { id: 102, time: '۰۹:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'زهرا رضایی', doctor: 'دکتر امیرمحمد فرهمندنیا', service: 'کامپوزیت ونیر', amount: 8000000, status: 'confirmed', problems: [] },
    { id: 103, time: '۰۹:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'علی محمدی', doctor: 'دکتر مهسا امیری‌راد', service: 'عصب‌کشی', amount: 3500000, status: 'completed', problems: ['پوسیدگی'] },
    { id: 104, time: '۱۰:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'مریم احمدی', doctor: 'دکتر کاوه آذرخو', service: 'لمینت سرامیکی', amount: 12000000, status: 'completed', problems: [] },
    { id: 105, time: '۱۰:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'حسین کریمی', doctor: 'دکتر رضا حیدری', service: 'جراحی فک', amount: 25000000, status: 'confirmed', problems: ['مشکل لثه'] },
    { id: 106, time: '۱۱:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'نگار حسینی', doctor: 'دکتر سارا نوری', service: 'چکاپ دوره‌ای', amount: 500000, status: 'pending', problems: [] },
    { id: 107, time: '۱۱:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'امیر توکلی', doctor: 'دکتر کاوه آذرخو', service: 'ارتودنسی', amount: 20000000, status: 'pending', problems: [] },
    { id: 108, time: '۱۲:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'زهرا موسوی', doctor: 'دکتر امیرمحمد فرهمندنیا', service: 'بلیچینگ', amount: 2000000, status: 'cancelled', problems: [] },
    { id: 109, time: '۱۲:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'محمد قاسمی', doctor: 'دکتر مهسا امیری‌راد', service: 'پرکردن دندان', amount: 1200000, status: 'confirmed', problems: ['پوسیدگی'] },
    { id: 110, time: '۱۳:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'الهام نوری', doctor: 'دکتر رضا حیدری', service: 'کشیدن دندان', amount: 800000, status: 'pending', problems: ['درد دندان'] },
    { id: 111, time: '۱۳:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'امیرمحمد کاظمی', doctor: 'دکتر سارا نوری', service: 'جرم‌گیری', amount: 2000000, status: 'completed', problems: [] },
    { id: 112, time: '۱۴:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'زهرا رضایی', doctor: 'دکتر کاوه آذرخو', service: 'کامپوزیت ونیر', amount: 8000000, status: 'cancelled', problems: [] },
    { id: 113, time: '۱۴:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'علی محمدی', doctor: 'دکتر امیرمحمد فرهمندنیا', service: 'ایمپلنت دندان', amount: 15000000, status: 'confirmed', problems: ['مشکل لثه'] },
    { id: 114, time: '۱۵:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'مریم احمدی', doctor: 'دکتر مهسا امیری‌راد', service: 'درمان لثه', amount: 4000000, status: 'pending', problems: [] },
    { id: 115, time: '۱۵:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'حسین کریمی', doctor: 'دکتر کاوه آذرخو', service: 'لمینت سرامیکی', amount: 12000000, status: 'completed', problems: [] },
    { id: 116, time: '۱۶:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'نگار حسینی', doctor: 'دکتر رضا حیدری', service: 'عصب‌کشی', amount: 3500000, status: 'cancelled', problems: ['درد دندان'] },
    { id: 117, time: '۱۶:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'امیر توکلی', doctor: 'دکتر امیرمحمد فرهمندنیا', service: 'بلیچینگ', amount: 2000000, status: 'completed', problems: [] },
    { id: 118, time: '۱۷:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'زهرا موسوی', doctor: 'دکتر سارا نوری', service: 'پرکردن دندان', amount: 1200000, status: 'confirmed', problems: [] },
    { id: 119, time: '۱۷:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'محمد قاسمی', doctor: 'دکتر کاوه آذرخو', service: 'ایمپلنت دندان', amount: 15000000, status: 'completed', problems: ['پوسیدگی'] },
    { id: 120, time: '۱۸:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'الهام نوری', doctor: 'دکتر مهسا امیری‌راد', service: 'چکاپ دوره‌ای', amount: 500000, status: 'completed', problems: [] },
    { id: 121, time: '۱۸:۳۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'امیرمحمد کاظمی', doctor: 'دکتر رضا حیدری', service: 'کشیدن دندان', amount: 800000, status: 'cancelled', problems: [] },
    { id: 122, time: '۰۹:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'زهرا رضایی', doctor: 'دکتر مهسا امیری‌راد', service: 'عصب‌کشی', amount: 3500000, status: 'arrived', problems: ['پوسیدگی'] },
    { id: 123, time: '۱۰:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'علی محمدی', doctor: 'دکتر کاوه آذرخو', service: 'ایمپلنت دندان', amount: 15000000, status: 'completed', problems: [] },
    { id: 124, time: '۱۱:۰۰', date: '۱۴۰۵/۰۶/۱۰', patient: 'مریم احمدی', doctor: 'دکتر امیرمحمد فرهمندنیا', service: 'کامپوزیت ونیر', amount: 8000000, status: 'completed', problems: ['مشکل لثه'] }
  ];

  var comments = [
    { id: 1, user: 'سارا محمدی', article: 'راهنمای ایمپلنت دندان', text: 'مقاله خیلی مفیدی بود. ممنون از تیم دنتورا.', date: '۱۴۰۵/۰۶/۰۵', status: 'pending' },
    { id: 2, user: 'علی رضایی', article: 'مزایای لمینت سرامیکی', text: 'آیا لمینت برای دندان‌های حساس هم مناسبه؟', date: '۱۴۰۵/۰۶/۰۴', status: 'pending' },
    { id: 3, user: 'مریم احمدی', article: 'عصب‌کشی بدون درد', text: 'واقعاً عصب‌کشی بدون درد ممکنه؟ من خیلی می‌ترسم.', date: '۱۴۰۵/۰۶/۰۳', status: 'approved' },
    { id: 4, user: 'حسین کریمی', article: 'مراقبت بعد از ایمپلنت', text: 'بعد از ایمپلنت چقدر استراحت لازمه؟', date: '۱۴۰۵/۰۶/۰۲', status: 'pending' },
    { id: 5, user: 'نگار حسینی', article: 'بلیچینگ دندان در خانه', text: 'محصولات خانگی بلیچینگ واقعاً جواب میده؟', date: '۱۴۰۵/۰۶/۰۱', status: 'approved' },
    { id: 6, user: 'امیر توکلی', article: 'تفاوت کامپوزیت و لمینت', text: 'مقاله عالی بود، ممنون از توضیحات کامل.', date: '۱۴۰۵/۰۵/۳۰', status: 'approved' },
    { id: 7, user: 'زهرا موسوی', article: 'ارتودنسی بزرگسالان', text: 'آیا در سن ۳۰ سالگی ارتودنسی جواب میده؟', date: '۱۴۰۵/۰۵/۲۹', status: 'pending' },
    { id: 8, user: 'محمد قاسمی', article: 'جرم‌گیری حرفه‌ای', text: 'هر چند وقت یکبار باید جرمگیری کرد؟', date: '۱۴۰۵/۰۵/۲۸', status: 'pending' },
    { id: 9, user: 'الهام نوری', article: 'دندانپزشکی کودکان', text: 'محیط کلینیک واقعاً دوستانه‌ست. ممنونم.', date: '۱۴۰۵/۰۵/۲۷', status: 'approved' },
    { id: 10, user: 'رضا عباسی', article: 'ایمپلنت دیجیتال', text: 'ایمپلنت دیجیتال چه مزیتی نسبت به روش سنتی داره؟', date: '۱۴۰۵/۰۵/۲۶', status: 'pending' }
  ];

  var analyticsData = {
    monthlyTrend: [
      { month: 'فروردین', count: 120 },
      { month: 'اردیبهشت', count: 145 },
      { month: 'خرداد', count: 132 },
      { month: 'تیر', count: 168 },
      { month: 'مرداد', count: 155 },
      { month: 'شهریور', count: 178 }
    ],
    popularServices: [
      { name: 'ایمپلنت', count: 45 },
      { name: 'کامپوزیت', count: 38 },
      { name: 'لمینت', count: 32 },
      { name: 'عصب‌کشی', count: 28 },
      { name: 'بلیچینگ', count: 22 },
      { name: 'جرم‌گیری', count: 18 }
    ],
    doctorDistribution: [
      { name: 'دکتر آذرخو', count: 65 },
      { name: 'دکتر فرهمندنیا', count: 52 },
      { name: 'دکتر امیری‌راد', count: 48 },
      { name: 'دکتر حیدری', count: 35 },
      { name: 'دکتر نوری', count: 42 }
    ],
    totalPatients: 248,
    totalDoctors: 5,
    monthlyAppointments: 178
  };

  return {
    doctors: doctors,
    services: services,
    patients: patients,
    todayAppointments: todayAppointments,
    comments: comments,
    analytics: analyticsData
  };
})();
