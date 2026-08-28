var BA_CARDS = [
    {t:"implant",before:"../../assets/before-after/1-before.jpg",after:"../../assets/before-after/1-after.jpg",desc:"جایگزینی دندان از دست رفته با ایمپلنت تیتانیومی و روکش سرامیکی",label:"ایمپلنت"},
    {t:"implant",before:"../../assets/before-after/2-before.jpg",after:"../../assets/before-after/2-after.jpg",desc:"ایمپلنت کامل فک پایین با پروتز ثابت تمام سرامیکی",label:"ایمپلنت"},
    {t:"implant",before:"../../assets/before-after/3-before.jpg",after:"../../assets/before-after/3-after.jpg",desc:"جایگزینی یک دندان از دست رفته بدون تراش دندان‌های مجاور",label:"ایمپلنت"},
    {t:"veneer",before:"../../assets/before-after/4-before.jpg",after:"../../assets/before-after/4-after.jpg",desc:"اصلاح شکل و رنگ دندان‌ها با ونیر سرامیکی نازک و طبیعی",label:"ونیر"},
    {t:"veneer",before:"../../assets/before-after/1-before.jpg",after:"../../assets/before-after/1-after.jpg",desc:"اصلاح ناهمراهی خفیف دندان‌ها بدون ارتودنسی با ونیر",label:"ونیر"},
    {t:"veneer",before:"../../assets/before-after/2-before.jpg",after:"../../assets/before-after/2-after.jpg",desc:"ترمیم لب‌پریدگی و تغییر رنگ دندان‌های جلویی",label:"ونیر"},
    {t:"laminate",before:"../../assets/before-after/3-before.jpg",after:"../../assets/before-after/3-after.jpg",desc:"طراحی لبخند با لمینت سرامیکی ۸ واحد بالا و ۶ واحد پایین",label:"لمینت"},
    {t:"laminate",before:"../../assets/before-after/4-before.jpg",after:"../../assets/before-after/4-after.jpg",desc:"رفع زردی شدید و تغییر فرم دندان‌ها با لمینت پرسلن",label:"لمینت"},
    {t:"laminate",before:"../../assets/before-after/1-before.jpg",after:"../../assets/before-after/1-after.jpg",desc:"ترکیب لمینت و بلیچینگ برای نتیجه طبیعی و درخشان",label:"لمینت"},
    {t:"composite",before:"../../assets/before-after/2-before.jpg",after:"../../assets/before-after/2-after.jpg",desc:"ترمیم سریع و اقتصادی لبخند با کامپوزیت ونیر بدون تراش",label:"کامپوزیت"},
    {t:"composite",before:"../../assets/before-after/3-before.jpg",after:"../../assets/before-after/3-after.jpg",desc:"بازسازی دندان‌های شکسته و لب‌پریده با کامپوزیت همرنگ",label:"کامپوزیت"},
    {t:"composite",before:"../../assets/before-after/4-before.jpg",after:"../../assets/before-after/4-after.jpg",desc:"بستن فاصله بین دندان‌ها (دیاستما) با کامپوزیت بدون ارتودنسی",label:"کامپوزیت"}
];
function renderCards(filter){
    var grid=document.getElementById('baGrid');
    grid.innerHTML='';
    BA_CARDS.forEach(function(c){
        if(filter!=='all'&&c.t!==filter)return;
        var d=document.createElement('div');
        d.className='ba-card-item';
        d.setAttribute('data-treatment',c.t);
        d.innerHTML='<div class="doctor-card" data-ba><div class="doctor-img ba-container" tabindex="0" role="slider"><img class="ba-img ba-after" src="'+c.after+'" alt="نتیجه"><img class="ba-img ba-before" src="'+c.before+'" alt="وضعیت قبل"><div class="ba-slider"><div class="ba-handle"></div></div><span class="ba-label ba-label-before">قبل</span><span class="ba-label ba-label-after">بعد</span></div></div><p class="ba-card-desc">'+c.desc+'</p><span class="ba-card-tag" data-filter-link="'+c.t+'">'+c.label+'</span>';
        grid.appendChild(d);
    });
    if(typeof initBA==='function')initBA();
}
document.addEventListener('DOMContentLoaded',function(){
    window.scrollTo(0, 0);
    renderCards('all');
    var filterBtns=document.querySelectorAll('.ba-filter-btn');
    filterBtns.forEach(function(btn){
        btn.addEventListener('click',function(){
            filterBtns.forEach(function(b){b.classList.remove('is-active');b.setAttribute('aria-selected','false')});
            btn.classList.add('is-active');
            btn.setAttribute('aria-selected','true');
            renderCards(btn.dataset.filter);
        });
    });
    document.addEventListener('click',function(e){
        var tag=e.target.closest('[data-filter-link]');
        if(!tag)return;
        var target=tag.getAttribute('data-filter-link');
        var btn=document.querySelector('.ba-filter-btn[data-filter="'+target+'"]');
        if(btn)btn.click();
    });
    var pageBtns=document.querySelectorAll('.ba-page-num');
    pageBtns.forEach(function(b){
        b.addEventListener('click',function(){
            pageBtns.forEach(function(x){x.classList.remove('is-active')});
            b.classList.add('is-active');
        });
    });
});
