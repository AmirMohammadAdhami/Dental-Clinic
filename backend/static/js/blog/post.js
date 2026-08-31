/**
 * Dentura — Article Detail Page
 * Fetches article from API, populates page, renders content_blocks.
 * Video player: shows first frame as thumbnail, plays on click.
 */
document.addEventListener('DOMContentLoaded', function () {

    window.scrollTo(0, 0);

    // Apply post-page class to body so its background matches the surface color
    document.body.classList.add('post-page');

    var MEDIA_BASE = window.location.origin;

    // ================= UTILITIES =================
    function toPersianNum(num) {
        var d = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
        return String(num).replace(/\d/g, function (c) { return d[c]; });
    }

    function toJalaliDate(iso) {
        if (!iso) return '';
        var g = new Date(iso);
        var gy = g.getFullYear(), gm = g.getMonth() + 1, gd = g.getDate();
        var gdm = [0,31,59,90,120,151,181,212,243,273,304,334];
        var gy2 = gm > 2 ? gy + 1 : gy;
        var days = 355666 + 365*gy + Math.floor((gy2+3)/4) - Math.floor((gy2+99)/100) + Math.floor((gy2+399)/400) + gd + gdm[gm-1];
        var jy = -1595 + 33*Math.floor(days/12053); days %= 12053;
        jy += 4*Math.floor(days/1461); days %= 1461;
        if (days > 365) { jy += Math.floor((days-1)/365); days = (days-1)%365; }
        var jm, jd;
        if (days < 186) { jm = 1+Math.floor(days/31); jd = 1+days%31; }
        else { jm = 7+Math.floor((days-186)/30); jd = 1+(days-186)%30; }
        var mn = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
        return toPersianNum(jd)+' '+mn[jm-1]+' '+toPersianNum(jy);
    }

    function esc(s) { if (!s) return ''; var d=document.createElement('div'); d.appendChild(document.createTextNode(s)); return d.innerHTML; }
    function murl(p) { if (!p) return ''; return p.indexOf('http')===0 ? p : MEDIA_BASE + p; }

    // ================= SLUG FROM URL =================
    var slug = '';
    var m = window.location.pathname.match(/\/article\/([^/]+)\/?$/);
    if (m) slug = decodeURIComponent(m[1]);

    var loadingEl = document.getElementById('postLoading');
    var errorEl = document.getElementById('postError');
    var mainEl = document.querySelector('main.post-page');

    if (!slug) { loadingEl.style.display='none'; errorEl.style.display='block'; return; }

    // ================= FETCH =================
    fetch('/api/articles/' + encodeURIComponent(slug) + '/')
        .then(function(r) { if (!r.ok) throw 0; return r.json(); })
        .then(function(d) {
            document.title = d.title + ' — دنتورا';
            loadingEl.style.display = 'none';
            mainEl.style.display = '';
            populate(d);
        })
        .catch(function(err) { console.error('Article load error:', err); loadingEl.style.display='none'; errorEl.style.display='block'; });

    // ================= POPULATE =================
    function populate(d) {
        // Breadcrumb & tag
        var bc = document.getElementById('bcCategory');
        var bt = document.getElementById('bcTitle');
        if (bc && d.category_name) bc.textContent = d.category_name;
        if (bt) bt.textContent = d.title;
        var tag = document.getElementById('postTag');
        if (tag && d.category_name) tag.textContent = d.category_name;

        // Title
        var ti = document.getElementById('postTitle');
        if (ti) ti.textContent = d.title;

        // Author meta
        var av = document.getElementById('postMetaAvatar');
        var nm = document.getElementById('postMetaName');
        var sp = document.getElementById('postMetaSpecialty');
        if (av && d.profile_photo) { av.src = murl(d.profile_photo); av.alt = d.full_name||''; av.style.display=''; }
        if (nm) nm.textContent = d.full_name || '';
        if (sp) sp.textContent = d.author_specialty || '';

        // Date
        var de = document.getElementById('postMetaDate');
        if (de) {
            var svg = de.querySelector('svg');
            de.innerHTML = (svg ? svg.outerHTML : '') + ' بروزرسانی: ' + toJalaliDate(d.updated_at);
        }

        // Reading time
        var rt = document.getElementById('postMetaReadtime');
        if (rt) {
            var svg2 = rt.querySelector('svg');
            rt.innerHTML = (svg2 ? svg2.outerHTML : '') + ' ' + toPersianNum(d.reading_time||0) + ' دقیقه مطالعه';
        }

        // Gallery
        renderGallery(d.files || []);

        // TOC
        buildTOC(d.content_blocks || []);

        // Abstract
        if (d.abstract) {
            document.getElementById('postTakeaways').style.display = '';
            document.getElementById('postTakeawaysText').textContent = d.abstract;
        }

        // Content blocks
        renderBlocks(d.content_blocks || []);

        // Author box
        var ab = document.getElementById('postAuthorBox');
        var ai = document.getElementById('postAuthorImg');
        var an = document.getElementById('postAuthorName');
        var as = document.getElementById('postAuthorSpecialty');
        var abio = document.getElementById('postAuthorBio');
        if (d.profile_photo && ai) { ai.src = murl(d.profile_photo); ai.alt = d.full_name||''; ai.style.display=''; }
        if (an) an.textContent = d.full_name || '';
        if (as) as.textContent = (d.author_specialty||'') + (d.author_university ? ' — ' + d.author_university : '');
        if (abio) abio.textContent = d.author_bio || '';
        ab.style.display = '';

        // Testimonials
        if (d.doctor_reviews && d.doctor_reviews.length) renderTestimonials(d.doctor_reviews);

        // Mobile CTA
        document.getElementById('postMobileCta').style.display = '';

        // Init interactions
        setTimeout(function() {
            initProgress();
            initLightbox();
            initCopyLink();
            initTocHighlight();
            initGalleryLightbox();
        }, 200);
    }

    // ================= GALLERY =================
    function renderGallery(files) {
        var container = document.getElementById('postGallery');
        var thumbs = document.getElementById('galleryThumbs');
        var mainImg = document.getElementById('galleryMainImg');
        var mainVideo = document.getElementById('galleryVideo');
        var player = mainVideo.querySelector('video');
        if (!files.length) return;
        container.style.display = '';

        var items = files.map(function(f) {
            if (f.media_type === 'VIDEO') return { type:'video', src: f.video_url || f.file || '' };
            return { type:'image', src: f.file || '' };
        });

        // Build thumbs
        var html = '';
        for (var i=0; i<items.length; i++) {
            var t = items[i];
            var play = t.type==='video' ? '<span class="post-gallery-thumb-play"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></span>' : '';
            // For video thumbs, grab first frame
            var thumbSrc = t.type==='video' ? '' : t.src;
            html += '<button class="post-gallery-thumb'+(i===0?' is-active':'')+'" data-index="'+i+'" data-type="'+t.type+'" data-src="'+esc(t.src)+'">';
            if (t.type==='video') {
                html += '<video class="post-gallery-thumb-vid" muted preload="metadata"><source src="'+esc(t.src)+'" type="video/mp4"></video>';
                html += play;
            } else {
                html += '<img src="'+esc(t.src)+'" alt="">';
            }
            html += '</button>';
        }
        thumbs.innerHTML = html;

        // Capture first frame for video thumbnails
        var vidThumbs = thumbs.querySelectorAll('.post-gallery-thumb-vid');
        vidThumbs.forEach(function(v) {
            v.addEventListener('loadeddata', function() {
                v.currentTime = 0.1;
            });
            v.addEventListener('seeked', function() {
                // First frame captured — poster is now visible
            });
        });

        var ci = 0;
        var allThumbs = thumbs.querySelectorAll('.post-gallery-thumb');

        // Show first item
        showItem(0);

        function showItem(idx) {
            if (idx<0||idx>=items.length) return;
            allThumbs[ci].classList.remove('is-active');
            ci = idx;
            allThumbs[ci].classList.add('is-active');
            var it = items[ci];

            if (it.type==='video') {
                mainImg.style.display = 'none';
                mainVideo.style.display = 'block';
                player.src = it.src;
                player.load();
                // Auto-play muted, show controls
                player.play().catch(function(){});
            } else {
                player.pause();
                player.src = '';
                mainVideo.style.display = 'none';
                mainImg.style.display = '';
                mainImg.style.opacity = '0';
                mainImg.src = it.src;
                mainImg.onload = function() {
                    mainImg.style.transition = 'opacity 0.3s ease';
                    mainImg.style.opacity = '1';
                };
            }
        }

        for (var j=0; j<allThumbs.length; j++) {
            (function(idx){ allThumbs[idx].addEventListener('click', function(){ showItem(idx); }); })(j);
        }

        var prev = document.getElementById('galleryPrev');
        var next = document.getElementById('galleryNext');
        if (prev) prev.addEventListener('click', function(){ showItem(ci>0?ci-1:items.length-1); });
        if (next) next.addEventListener('click', function(){ showItem(ci<items.length-1?ci+1:0); });
    }

    // ================= CONTENT BLOCKS =================
    function renderBlocks(blocks) {
        var c = document.getElementById('postBody');
        if (!c || !blocks.length) return;
        var html = '';
        var hc = 0;

        for (var i=0; i<blocks.length; i++) {
            var b = blocks[i], bd = b.data||{};
            if (b.type==='heading') {
                hc++;
                var tag = bd.level==='3' ? 'h3' : 'h2';
                html += '<'+tag+' id="section-'+hc+'">'+esc(bd.text)+'</'+tag+'>';
            } else if (b.type==='paragraph') {
                html += '<p>'+esc(bd.text)+'</p>';
            } else if (b.type==='tip') {
                html += '<div class="post-callout post-callout-tip"><span class="post-callout-icon">💡</span><div><strong>'+esc(bd.title||'نکته مهم')+':</strong> '+esc(bd.body)+'</div></div>';
            } else if (b.type==='warning') {
                html += '<div class="post-callout post-callout-warning"><span class="post-callout-icon">⚠️</span><div><strong>'+esc(bd.title||'هشدار پزشکی')+':</strong> '+esc(bd.body)+'</div></div>';
            } else if (b.type==='info') {
                html += '<div class="post-callout post-callout-info"><span class="post-callout-icon">ℹ️</span><div><strong>'+esc(bd.title||'اطلاعات تکمیلی')+':</strong> '+esc(bd.body)+'</div></div>';
            } else if (b.type==='list') {
                var lt = bd.style==='numbered' ? 'ol' : 'ul';
                var lc = bd.style==='numbered' ? 'post-list post-list-ordered' : 'post-list';
                html += '<'+lt+' class="'+lc+'">';
                if (bd.items) bd.items.forEach(function(it){ html += '<li>'+esc(it)+'</li>'; });
                html += '</'+lt+'>';
            } else if (b.type==='quote') {
                html += '<blockquote class="post-quote"><p class="post-quote-text">«'+esc(bd.text)+'»</p>';
                if (bd.author) { html += '<footer class="post-quote-footer"><cite class="post-quote-author">'+esc(bd.author)+'</cite>'; if(bd.role) html+='<span class="post-quote-role"> — '+esc(bd.role)+'</span>'; html+='</footer>'; }
                html += '</blockquote>';
            } else if (b.type==='table') {
                html += '<div class="post-table-wrapper">';
                if (bd.caption) html += '<p class="post-table-caption">'+esc(bd.caption)+'</p>';
                html += '<table class="post-table">';
                if (bd.headers&&bd.headers.length) { html+='<thead><tr>'; bd.headers.forEach(function(h){ html+='<th>'+esc(h)+'</th>'; }); html+='</tr></thead>'; }
                html += '<tbody>';
                if (bd.rows) bd.rows.forEach(function(r){ html+='<tr>'; r.forEach(function(c){ html+='<td>'+esc(c)+'</td>'; }); html+='</tr>'; });
                html += '</tbody></table></div>';
            } else if (b.type==='image') {
                html += '<figure class="post-figure"><img src="'+esc(bd.src)+'" alt="'+esc(bd.alt||'')+'" class="post-figure-img" loading="lazy">';
                if (bd.caption) html += '<figcaption class="post-figure-caption">'+esc(bd.caption)+'</figcaption>';
                html += '</figure>';
            } else if (b.type==='gallery') {
                html += renderGalleryBlock(bd.items||[], i);
            }
        }
        c.innerHTML = html;
    }

    function renderGalleryBlock(items, gi) {
        if (!items.length) return '';
        var gid = 'gb-'+gi, first=items[0], isVid=first.type==='video';
        var h = '<div class="post-gallery" data-gallery-id="'+gid+'"><div class="post-gallery-main">';
        if (isVid) {
            h += '<img src="" alt="" class="post-gallery-img" style="display:none;">';
            h += '<div class="post-gallery-video" style="display:block;"><video class="post-gallery-video-player" controls preload="metadata"><source src="'+esc(first.src||first.video_url||'')+'" type="video/mp4"></video></div>';
        } else {
            h += '<img src="'+esc(first.src||'')+'" alt="'+esc(first.alt||'')+'" class="post-gallery-img">';
            h += '<div class="post-gallery-video" style="display:none;"><video class="post-gallery-video-player" controls preload="metadata"><source src="" type="video/mp4"></video></div>';
        }
        h += '<button class="post-gallery-arrow post-gallery-prev" aria-label="عکس قبلی"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>';
        h += '<button class="post-gallery-arrow post-gallery-next" aria-label="عکس بعدی"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>';
        h += '</div><div class="post-gallery-thumbs">';
        items.forEach(function(it,k){
            var s=it.src||it.video_url||'';
            var pi=it.type==='video'?'<span class="post-gallery-thumb-play"><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></span>':'';
            h += '<button class="post-gallery-thumb'+(k===0?' is-active':'')+'" data-index="'+k+'" data-type="'+(it.type||'image')+'" data-src="'+esc(s)+'">';
            if (it.type==='video') { h+='<video class="post-gallery-thumb-vid" muted preload="metadata"><source src="'+esc(s)+'" type="video/mp4"></video>'+pi; }
            else { h+='<img src="'+esc(s)+'" alt="'+esc(it.alt||'')+'">'; }
            h += '</button>';
        });
        h += '</div></div>';
        return h;
    }

    // ================= TOC =================
    function buildTOC(blocks) {
        var ts = document.getElementById('postToc');
        var tm = document.getElementById('postTocMobileNav');
        var tocM = document.getElementById('postTocMobile');
        if (!blocks.length) return;
        var h = '', hc = 0;
        for (var i=0; i<blocks.length; i++) {
            if (blocks[i].type==='heading') {
                hc++;
                var txt = (blocks[i].data||{}).text||'';
                if ((blocks[i].data||{}).level==='3') {
                    h += '<a href="#section-'+hc+'" class="post-toc-sub">'+esc(txt)+'</a>';
                } else {
                    h += '<a href="#section-'+hc+'" class="post-toc-link'+(hc===1?' is-active':'')+'">'+esc(txt)+'</a>';
                }
            }
        }
        if (ts) ts.innerHTML = h;
        if (tm) { tm.innerHTML = h; tocM.style.display = ''; }
    }

    // ================= TESTIMONIALS =================
    function renderTestimonials(reviews) {
        var sec = document.getElementById('postTestimonialsSection');
        var deck = document.getElementById('testimonialsDeck');
        if (!reviews.length) return;
        sec.style.display = '';

        var h = '';
        reviews.forEach(function(r){
            var stars = '';
            for (var s=1;s<=5;s++) {
                stars += '<svg class="star-icon" viewBox="0 0 20 20" fill="'+(s<=r.rating?'currentColor':'none')+'" stroke="'+(s<=r.rating?'none':'currentColor')+'" stroke-width="1"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            }
            var badge = r.category_name ? '<span class="testimonial-badge">درمان: '+esc(r.category_name)+'</span>' : '';
            h += '<div class="testimonial-card"><div class="testimonial-stars">'+stars+'</div>';
            h += '<blockquote class="testimonial-quote">'+esc(r.content)+'</blockquote>';
            h += '<div class="testimonial-user"><span class="testimonial-name">'+esc(r.user_name||'بیمار')+'</span>'+badge+'</div></div>';
        });
        deck.innerHTML = h;
        setTimeout(initTestimonialsDeck, 100);
    }

    function initTestimonialsDeck() {
        var deck = document.querySelector('.post-testimonials .testimonials-deck');
        if (!deck) return;
        var cards = Array.from(deck.querySelectorAll('.testimonial-card'));
        if (!cards.length) return;
        var dots = document.querySelector('.post-testimonials .testimonials-dots');
        var prev = document.querySelector('.post-testimonials .testimonials-prev');
        var next = document.querySelector('.post-testimonials .testimonials-next');
        var total = cards.length, cur = 0, timer = null;

        function measure() {
            cards.forEach(function(c){ c.style.position='relative'; c.style.visibility='hidden'; c.style.transform='none'; c.style.opacity='0'; c.style.zIndex='1'; });
            var mx=0; cards.forEach(function(c){ if(c.scrollHeight>mx) mx=c.scrollHeight; });
            deck.style.height=mx+'px';
            cards.forEach(function(c){ c.style.position=''; c.style.visibility=''; c.style.transform=''; c.style.opacity=''; c.style.zIndex=''; });
        }
        measure();

        function upd() {
            cards.forEach(function(c,i){
                var d=i-cur, p='hidden';
                if(d===0)p='front';else if(d===1)p='next-1';else if(d===2)p='next-2';else if(d===-1)p='prev-1';else if(d===-2)p='prev-2';
                c.setAttribute('data-pos',p);
            });
            if(dots) dots.querySelectorAll('.testimonials-dot').forEach(function(d,i){ d.classList.toggle('is-active',i===cur); });
            if(prev) prev.disabled=cur<=0;
            if(next) next.disabled=cur>=total-1;
        }
        function go(i){ cur=(i+total)%total; upd(); }
        function sched(){ clearTimeout(timer); timer=setTimeout(function tick(){ cur=(cur+1)%total; upd(); timer=setTimeout(tick,8000); },8000); }

        if(dots){ dots.innerHTML=''; for(var i=0;i<total;i++){var dot=document.createElement('button');dot.type='button';dot.className='testimonials-dot';dot.setAttribute('role','tab');dot.setAttribute('aria-label','نظر '+(i+1));dot.addEventListener('click',(function(idx){return function(){go(idx);sched();}})(i));dots.appendChild(dot);} }
        if(prev) prev.addEventListener('click',function(){go(cur-1);sched();});
        if(next) next.addEventListener('click',function(){go(cur+1);sched();});
        deck.addEventListener('mouseenter',function(){clearTimeout(timer);});
        deck.addEventListener('mouseleave',sched);
        var tx=0;
        deck.addEventListener('touchstart',function(e){tx=e.touches[0].clientX;clearTimeout(timer);},{passive:true});
        deck.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-tx;if(dx<-50)go(cur+1);else if(dx>50)go(cur-1);sched();},{passive:true});
        upd(); sched();
    }

    // ================= PROGRESS BAR =================
    function initProgress() {
        var bar = document.getElementById('readingProgress');
        var body = document.getElementById('postBody');
        if (!bar||!body) return;
        function upd() {
            var r=body.getBoundingClientRect(), bt=r.top+window.scrollY, bh=r.height, sc=window.scrollY-bt, tot=bh-window.innerHeight;
            bar.style.width = Math.max(0,Math.min(100,(sc/tot)*100))+'%';
        }
        window.addEventListener('scroll',upd,{passive:true});
        upd();
    }

    // ================= LIGHTBOX =================
    function initLightbox() {
        var lb = document.createElement('div');
        lb.className = 'post-lightbox';
        lb.innerHTML = '<button class="post-lightbox-close" aria-label="بستن"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg></button><img src="" alt="">';
        document.body.appendChild(lb);
        var lImg = lb.querySelector('img'), lClose = lb.querySelector('.post-lightbox-close');
        function open(s,a){ lImg.src=s;lImg.alt=a||'';lb.classList.add('is-open');document.body.style.overflow='hidden'; }
        function close(){ lb.classList.remove('is-open');document.body.style.overflow=''; }
        lClose.addEventListener('click',function(e){e.stopPropagation();close();});
        lb.addEventListener('click',function(e){if(e.target===lb)close();});
        document.addEventListener('keydown',function(e){if(e.key==='Escape'&&lb.classList.contains('is-open'))close();});
        // Attach to body images
        document.querySelectorAll('.post-body img, .post-figure-img').forEach(function(img){
            img.style.cursor='zoom-in';
            img.addEventListener('click',function(){open(img.src,img.alt);});
        });
    }

    function initGalleryLightbox() {
        // Also allow clicking gallery main image to zoom
        var mainImg = document.getElementById('galleryMainImg');
        if (mainImg) {
            mainImg.style.cursor = 'zoom-in';
            mainImg.addEventListener('click', function() {
                var lb = document.querySelector('.post-lightbox');
                if (lb) {
                    var lImg = lb.querySelector('img');
                    lImg.src = mainImg.src;
                    lImg.alt = mainImg.alt || '';
                    lb.classList.add('is-open');
                    document.body.style.overflow = 'hidden';
                }
            });
        }
    }

    // ================= COPY LINK =================
    function initCopyLink() {
        var btn = document.getElementById('copyLinkBtn');
        if (!btn) return;
        btn.addEventListener('click', function(){
            navigator.clipboard.writeText(window.location.href).then(function(){
                btn.style.background='var(--primary)';btn.style.color='#fff';btn.style.borderColor='var(--primary)';
                setTimeout(function(){btn.style.background='';btn.style.color='';btn.style.borderColor='';},1500);
            });
        });
    }

    // ================= TOC HIGHLIGHT =================
    function initTocHighlight() {
        var links = document.querySelectorAll('.post-toc-link, .post-toc-sub');
        var secs = [];
        links.forEach(function(l){ var id=l.getAttribute('href').replace('#',''); var el=document.getElementById(id); if(el) secs.push({el:el,link:l}); });
        function upd() {
            var sp=window.scrollY+120, act=null;
            for(var i=0;i<secs.length;i++){ if(secs[i].el.offsetTop<=sp) act=secs[i]; }
            links.forEach(function(l){l.classList.remove('is-active');});
            if(act) act.link.classList.add('is-active');
        }
        window.addEventListener('scroll',upd,{passive:true}); upd();
        links.forEach(function(l){
            l.addEventListener('click',function(e){
                e.preventDefault();
                var el=document.getElementById(l.getAttribute('href').replace('#',''));
                if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
            });
        });
    }

    // ================= COMMENTS =================
    function toRelativeTime(iso) {
        if (!iso) return '';
        var now = new Date();
        var then = new Date(iso);
        var diff = Math.floor((now - then) / 1000);
        if (diff < 60) return 'لحظاتی پیش';
        if (diff < 3600) return toPersianNum(Math.floor(diff / 60)) + ' دقیقه پیش';
        if (diff < 86400) return toPersianNum(Math.floor(diff / 3600)) + ' ساعت پیش';
        if (diff < 2592000) return toPersianNum(Math.floor(diff / 86400)) + ' روز پیش';
        if (diff < 31536000) return toPersianNum(Math.floor(diff / 2592000)) + ' ماه پیش';
        return toPersianNum(Math.floor(diff / 31536000)) + ' سال پیش';
    }

    function initComments() {
        var isAuth = window.__IS_AUTHENTICATED__ === true || window.__IS_AUTHENTICATED__ === 'true';
        var nameFields = document.getElementById('commentNameFields');
        var hint = document.getElementById('commentFormHint');
        var submitBtn = document.getElementById('commentSubmitBtn');
        var contentInput = document.getElementById('commentContent');
        var firstNameInput = document.getElementById('commentFirstName');
        var lastNameInput = document.getElementById('commentLastName');

        // Show/hide name fields based on auth status
        if (!isAuth && nameFields) {
            nameFields.style.display = '';
        }
        if (hint) {
            hint.textContent = isAuth ? '' : 'نام و نام خانوادگی شما در دیدگاه نمایش داده خواهد شد.';
        }

        // Load existing comments
        loadComments();

        // Submit handler
        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                submitComment(isAuth);
            });
        }

        // Enter key on name fields
        if (firstNameInput) {
            firstNameInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); lastNameInput.focus(); }
            });
        }
        if (lastNameInput) {
            lastNameInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); contentInput.focus(); }
            });
        }
    }

    function loadComments() {
        var listEl = document.getElementById('commentList');
        var emptyEl = document.getElementById('commentEmpty');
        if (!listEl) return;

        fetch('/api/articles/' + encodeURIComponent(slug) + '/comments/')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var results = data.results || data;
                if (!results || !results.length) {
                    listEl.innerHTML = '';
                    if (emptyEl) emptyEl.style.display = '';
                    return;
                }
                if (emptyEl) emptyEl.style.display = 'none';
                renderComments(results);
            })
            .catch(function(err) { console.error('Comments load error:', err); });
    }

    function renderComments(comments) {
        var listEl = document.getElementById('commentList');
        if (!listEl) return;
        var html = '';
        comments.forEach(function(c) {
            var initial = c.avatar_initial || (c.commenter_name ? c.commenter_name.charAt(0) : 'ن');
            html += '<div class="post-comment">';
            html += '  <div class="post-comment-header">';
            html += '    <div class="post-comment-user">';
            html += '      <div class="post-comment-avatar">' + esc(initial) + '</div>';
            html += '      <div>';
            html += '        <span class="post-comment-name">' + esc(c.commenter_name || 'ناشناس') + '</span>';
            html += '        <span class="post-comment-date">' + toRelativeTime(c.created_at) + '</span>';
            html += '      </div>';
            html += '    </div>';
            html += '  </div>';
            html += '  <p class="post-comment-text">' + esc(c.content) + '</p>';
            // Render replies
            if (c.replies && c.replies.length) {
                c.replies.forEach(function(r) {
                    var rInitial = r.avatar_initial || (r.commenter_name ? r.commenter_name.charAt(0) : 'د');
                    var rPhoto = r.avatar_photo || '';
                    html += '<div class="post-comment-reply">';
                    html += '  <div class="post-comment-header">';
                    html += '    <div class="post-comment-user">';
                    if (rPhoto) {
                        html += '      <img src="' + murl(rPhoto) + '" alt="' + esc(r.commenter_name || '') + '" class="post-comment-reply-avatar">';
                    } else {
                        html += '      <div class="post-comment-avatar">' + esc(rInitial) + '</div>';
                    }
                    html += '      <div>';
                    html += '        <span class="post-comment-name">' + esc(r.commenter_name || 'دندانپزشک') + '</span>';
                    html += '        <span class="post-comment-badge">پاسخ دندانپزشک</span>';
                    html += '        <span class="post-comment-date">' + toRelativeTime(r.created_at) + '</span>';
                    html += '      </div>';
                    html += '    </div>';
                    html += '  </div>';
                    html += '  <p class="post-comment-text">' + esc(r.content) + '</p>';
                    html += '</div>';
                });
            }
            html += '</div>';
        });
        listEl.innerHTML = html;
    }

    function submitComment(isAuth) {
        var submitBtn = document.getElementById('commentSubmitBtn');
        var contentInput = document.getElementById('commentContent');
        var firstNameInput = document.getElementById('commentFirstName');
        var lastNameInput = document.getElementById('commentLastName');
        var content = contentInput ? contentInput.value.trim() : '';

        if (!content) {
            if (window.showToast) window.showToast('لطفاً متن دیدگاه را بنویسید.', 'error');
            return;
        }

        var payload = { content: content };

        if (!isAuth) {
            var fn = firstNameInput ? firstNameInput.value.trim() : '';
            var ln = lastNameInput ? lastNameInput.value.trim() : '';
            if (!fn) {
                if (window.showToast) window.showToast('لطفاً نام خود را وارد کنید.', 'error');
                if (firstNameInput) firstNameInput.focus();
                return;
            }
            if (!ln) {
                if (window.showToast) window.showToast('لطفاً نام خانوادگی خود را وارد کنید.', 'error');
                if (lastNameInput) lastNameInput.focus();
                return;
            }
            payload.first_name = fn;
            payload.last_name = ln;
        }

        // Disable button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'در حال ارسال...';
        }

        fetch('/api/articles/' + encodeURIComponent(slug) + '/comments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(payload)
        })
        .then(function(r) {
            if (!r.ok) return r.json().then(function(err) { throw err; });
            return r.json();
        })
        .then(function(data) {
            // Clear form
            if (contentInput) contentInput.value = '';
            if (firstNameInput) firstNameInput.value = '';
            if (lastNameInput) lastNameInput.value = '';

            if (window.showToast) window.showToast('دیدگاه شما با موفقیت ثبت شد و پس از بررسی نمایش داده خواهد شد.', 'success');

            // Reload comments
            loadComments();
        })
        .catch(function(err) {
            var msg = 'خطا در ارسال دیدگاه.';
            if (err.detail) msg = err.detail;
            else if (err.first_name) msg = Array.isArray(err.first_name) ? err.first_name[0] : err.first_name;
            else if (err.last_name) msg = Array.isArray(err.last_name) ? err.last_name[0] : err.last_name;
            else if (err.content) msg = Array.isArray(err.content) ? err.content[0] : err.content;
            if (window.showToast) window.showToast(msg, 'error');
        })
        .finally(function() {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'ارسال دیدگاه';
            }
        });
    }

    function getCSRFToken() {
        var name = 'csrftoken';
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var c = cookies[i].trim();
            if (c.indexOf(name + '=') === 0) {
                return c.substring(name.length + 1);
            }
        }
        return '';
    }

    // Initialize comments
    setTimeout(function() {
        initComments();
    }, 300);

});
