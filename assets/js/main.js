if(document.documentElement.classList.contains('figma-static'))document.querySelectorAll('img[loading="lazy"]').forEach(i=>{i.loading='eager'});
/* VietinBank Premium landing v0.2 · không thư viện ngoài */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;

  /* ---------- Ngôn ngữ VI / EN ---------- */
  const i18nEls = $$('[data-en]');
  i18nEls.forEach((el) => { el.dataset.vi = el.innerHTML; });
  const ARIA = {
    vi: { menu: 'Mở menu', close: 'Đóng menu', chat: 'Mở hộp chat', top: 'Lên đầu trang' },
    en: { menu: 'Open menu', close: 'Close menu', chat: 'Open chat', top: 'Back to top' }
  };
  const mark = (s) => s.replace(/\[[^\]]+\]/g, '<span class="todo">$&</span>');
  const setLang = (lang, save = true) => {
    root.lang = lang;
    i18nEls.forEach((el) => {
      const html = lang === 'en' ? mark(el.dataset.en) : el.dataset.vi;
      if (el.tagName === 'TITLE') document.title = html.replace(/<[^>]+>/g, ''); else el.innerHTML = html;
    });
    $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
    const a = ARIA[lang];
    $('.island .menu-btn')?.setAttribute('aria-label', a.menu);
    $('#sheet [data-close].menu-btn')?.setAttribute('aria-label', a.close);
    $('.bubble--chat')?.setAttribute('aria-label', a.chat);
    $('.bubble--top')?.setAttribute('aria-label', a.top);
    if (save) { try { localStorage.setItem('vtb-lang', lang); } catch (e) {} }
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  };
  $$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  if (root.lang === 'en') setLang('en', false);

  /* ---------- Island: thu gọn khi rời hero; nút lên đầu trang ---------- */
  const island = $('#island');
  const hero = $('.hero');
  const toTop = $('.bubble--top');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;height:140px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => island.classList.toggle('is-compact', !e.isIntersecting)).observe(sentinel);
  if (hero) new IntersectionObserver(([e]) => toTop.classList.toggle('is-on', !e.isIntersecting), { threshold: 0.15 }).observe(hero);
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ---------- Menu di động ---------- */
  const sheet = $('#sheet');
  const openBtn = $('.island .menu-btn');
  const setSheet = (open) => {
    if (open) { sheet.hidden = false; requestAnimationFrame(() => sheet.classList.add('is-open')); }
    else { sheet.classList.remove('is-open'); setTimeout(() => { if (!sheet.classList.contains('is-open')) sheet.hidden = true; }, 500); }
    openBtn.setAttribute('aria-expanded', String(open));
    root.style.overflow = open ? 'hidden' : '';
    if (open) setTimeout(() => $('.menu-btn', sheet).focus(), 60);
  };
  openBtn.addEventListener('click', () => setSheet(true));
  $$('[data-close]', sheet).forEach((el) => el.addEventListener('click', () => setSheet(false)));

  /* ---------- Chat box ---------- */
  const chat = $('#chat');
  const chatBtn = $('.bubble--chat');
  const setChat = (open) => {
    chat.classList.toggle('is-open', open);
    chatBtn.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => $('a', chat).focus({ preventScroll: true }), 120);
  };
  chatBtn.addEventListener('click', (e) => { e.stopPropagation(); setChat(!chat.classList.contains('is-open')); });
  $$('[data-chat-close]', chat).forEach((el) => el.addEventListener('click', () => setChat(false)));
  document.addEventListener('click', (e) => { if (chat.classList.contains('is-open') && !chat.contains(e.target)) setChat(false); });
  $$('[data-open-chat]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); setChat(true); }));
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (chat.classList.contains('is-open')) { setChat(false); chatBtn.focus(); }
    if (sheet.classList.contains('is-open')) { setSheet(false); openBtn.focus(); }
  });

  /* ---------- Mục menu đang xem ---------- */
  const links = $$('.nav a');
  const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const a = map.get(e.target.id);
      if (a && e.isIntersecting) { links.forEach((l) => l.removeAttribute('aria-current')); a.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  map.forEach((_, id) => { const el = document.getElementById(id); el && spy.observe(el); });
  /* v0.20: đang ở banner/phần mở đầu thì không gạch chân mục nào */
  const clear = () => links.forEach((l) => l.removeAttribute('aria-current'));
  const intro = new IntersectionObserver((entries) => { entries.forEach((e) => { if (e.isIntersecting) clear(); }); }, { rootMargin: '-45% 0px -50% 0px' });
  ['.hero', '.pillars', '.exclusive'].forEach((q) => { const el = document.querySelector(q); el && intro.observe(el); });

  /* ---------- Hiện dần khi cuộn ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal').forEach((el) => (reduce ? el.classList.add('is-in') : io.observe(el)));

  /* ---------- FAQ: mặc định đóng hết; mở một câu thì các câu khác đóng, chuyển động trượt + mờ dần ---------- */
  const qas = $$('.qa');
  const EASE = 'cubic-bezier(.16,1,.3,1)';
  const qaClose = (d) => {
    if (!d.open) return;
    if (reduce) { d.open = false; return; }
    const sum = $('summary', d);
    const from = d.offsetHeight, to = sum.offsetHeight + 1;
    d.classList.add('is-anim', 'is-closing'); d.style.overflow = 'hidden';
    const an = d.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 420, easing: EASE });
    an.onfinish = () => { d.open = false; d.style.overflow = ''; d.classList.remove('is-anim', 'is-closing'); };
  };
  const qaOpen = (d) => {
    qas.forEach((o) => { if (o !== d) qaClose(o); });
    const from = d.offsetHeight;
    d.open = true;
    if (reduce) return;
    const to = d.offsetHeight;
    d.classList.add('is-anim'); d.style.overflow = 'hidden';
    const an = d.animate([{ height: from + 'px' }, { height: to + 'px' }], { duration: 560, easing: EASE });
    an.onfinish = () => { d.style.overflow = ''; d.classList.remove('is-anim'); };
    [...$('.qa__a', d).children].forEach((c, i) => c.animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
      { duration: 520, delay: 80 + i * 70, easing: EASE, fill: 'backwards' }));
  };
  qas.forEach((d) => $('summary', d).addEventListener('click', (e) => {
    e.preventDefault();
    if (d.classList.contains('is-anim')) return;
    d.open ? qaClose(d) : qaOpen(d);
  }));

  /* ---------- Popup chi tiết (mobile: bottom sheet) ---------- */
  const pop = $('#pop');
  const popMedia = $('.pop__media', pop);
  const popBody = $('.pop__body', pop);
  let popFrom = null;
  const clean = (html) => html.replace(/\sid="[^"]*"/g, '').replace(/\saria-controls="[^"]*"/g, '');
  const openPop = ({ img = '', html = '' }) => {
    delete pop.dataset.tier;
    popFrom = document.activeElement;
    popMedia.innerHTML = img ? `<img src="${img}" alt="">` : '';
    popBody.innerHTML = clean(html);
    $('.pop__scroll', pop).scrollTop = 0;
    pop.hidden = false; root.classList.add('pop-lock');
    requestAnimationFrame(() => requestAnimationFrame(() => pop.classList.add('is-open')));
    setTimeout(() => $('.pop__x', pop).focus({ preventScroll: true }), 80);
  };
  window.vtbPop = openPop;
  const closePop = () => {
    if (pop.hidden) return;
    pop.classList.remove('is-open'); root.classList.remove('pop-lock');
    setTimeout(() => { if (!pop.classList.contains('is-open')) pop.hidden = true; }, 600);
    popFrom && popFrom.focus && popFrom.focus({ preventScroll: true });
  };
  $$('[data-pop-close]', pop).forEach((el) => el.addEventListener('click', closePop));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closePop(); });
  const isMobile = matchMedia('(max-width: 767px)');

  /* ---------- Carousel ngang: card nào đang ở vị trí xem thì card đó được làm nổi ---------- */
  const track = (list, items, align, onChange) => {
    let raf = 0;
    const pick = () => {
      raf = 0;
      if (!isMobile.matches) { items.forEach((c) => c.classList.remove('is-active')); return; }
      const lr = list.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(list).paddingLeft) || 0;
      const ref = align === 'center' ? lr.left + lr.width / 2 : lr.left + pad;
      let best = 0, bd = Infinity;
      items.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs((align === 'center' ? r.left + r.width / 2 : r.left) - ref);
        if (d < bd) { bd = d; best = i; }
      });
      items.forEach((c, i) => c.classList.toggle('is-active', i === best));
      onChange && onChange(best);
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(pick); };
    list.addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    pick();
    return pick;
  };
  const plist = $('.pillars__list');
  if (plist) track(plist, $$('.pillar', plist), 'start');

  /* ---------- Điều kiện (mobile): bấm hạng để xem chi tiết đầy đủ ---------- */
  $$('.cmp__tier').forEach((b) => b.addEventListener('click', () => {
    const card = $(`.tcard--${b.dataset.tcard}`);
    if (card) openPop({ html: `<div class="pop-tcard tcard tcard--${b.dataset.tcard}">${card.innerHTML}</div>` });
  }));

  /* ---------- Dải rose gold: tắt ánh chạy khi người dùng giảm chuyển động ---------- */
  if (reduce) $$('.facet svg').forEach((svg) => { try { svg.pauseAnimations(); svg.setCurrentTime(0); } catch (e) {} });

  /* ---------- Hành trình di sản ---------- */
  const stage = $('[data-journey]');
  if (stage) {
    const curveBox = $('.journey__curve', stage);
    const svg = $('.journey__curve > svg:not(.jsilk)', stage);
    const base = $('.curve-base', stage);
    const glow = $('.curve-glow', stage);
    const head = $('.curve-head', stage);
    const nodes = $$('.node', stage);
    const tiers = $$('.tier', stage);
    const arts = $$('.jart', stage);
    const total = base.getTotalLength();
    const VB = { w: 1200, h: 300 };
    const mobile = matchMedia('(max-width: 767px)');
    let lens = [0, 0, 0];
    let done = false;

    const lenAtX = (x) => {
      let lo = 0, hi = total;
      for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; base.getPointAtLength(m).x < x ? (lo = m) : (hi = m); }
      return lo;
    };
    const toPx = (p, r) => ({ x: (p.x / VB.w) * r.width, y: (p.y / VB.h) * r.height });
    // Node thẳng hàng với mép trái từng hạng, đường dóng xuống hạng
    const place = () => {
      const r = svg.getBoundingClientRect();
      if (!r.width) return;
      lens = tiers.map((t, i) => {
        const tx = t.getBoundingClientRect().left - r.left;
        const l = lenAtX((tx / r.width) * VB.w);
        const p = toPx(base.getPointAtLength(l), r);
        nodes[i].style.left = p.x + 'px';
        nodes[i].style.top = p.y + 'px';
        nodes[i].style.setProperty('--drop', Math.max(0, r.height - p.y - 18) + 'px');
        return l;
      });
    };
    place();
    new ResizeObserver(place).observe(stage);

    // Mở phần "giá trị nổi bật" của một hạng (desktop: một hạng mở tại một thời điểm)
    const openTier = (i, only = true) => tiers.forEach((t, k) => {
      const on = k === i ? true : (only ? false : t.classList.contains('is-open'));
      t.classList.toggle('is-open', on);
      $('.tier__toggle', t).setAttribute('aria-expanded', String(on));
    });
    const light = (i) => {
      nodes[i].classList.add('is-lit'); tiers[i].classList.add('is-lit'); arts[i].classList.add('is-lit');
    };
    glow.style.strokeDasharray = total;
    glow.style.strokeDashoffset = total;

    // Đường cong tự chạy hết, đi qua từng mốc: mốc sáng lên, nội dung hiện rõ, ảnh chìm xuất hiện
    const run = () => {
      if (reduce || mobile.matches) { glow.style.strokeDashoffset = 0; [0, 1, 2].forEach(light); done = true; return; }
      const dur = 3600, t0 = performance.now();
      const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
      stage.classList.add('is-running');
      const r = svg.getBoundingClientRect();
      const lit = [false, false, false];
      const step = (now) => {
        const k = Math.min(1, (now - t0) / dur);
        const L = ease(k) * total;
        glow.style.strokeDashoffset = total - L;
        const p = toPx(base.getPointAtLength(L), r);
        head.style.left = p.x + 'px'; head.style.top = p.y + 'px';
        lens.forEach((l, i) => { if (!lit[i] && L >= l) { lit[i] = true; light(i); } });
        if (k < 1) requestAnimationFrame(step);
        else { stage.classList.remove('is-running'); done = true; }
      };
      requestAnimationFrame(step);
    };
    new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { obs.disconnect(); run(); } }, { threshold: 0.35 }).observe(stage);

    // Hover / focus: mốc được chọn nổi bật, hai mốc còn lại mờ đi
    const focus = (i) => {
      if (!done || mobile.matches) return;
      openTier(i === null ? -1 : i);
      stage.classList.toggle('has-focus', i !== null);
      [tiers, nodes, arts].forEach((group) => group.forEach((el, k) => el.classList.toggle('is-active', k === i)));
    };
    tiers.forEach((t, i) => { t.addEventListener('pointerenter', () => focus(i)); t.addEventListener('focus', () => focus(i)); });
    // Click: desktop mở hạng được chọn; mobile bật/tắt từng hạng
    tiers.forEach((t, i) => $('.tier__toggle', t).addEventListener('click', (e) => {
      e.stopPropagation();
      if (mobile.matches) {
        // Mobile: mở popup có ảnh minh hoạ và đầy đủ giá trị nổi bật của hạng
        const pick = (sel) => ($(sel, t) ? $(sel, t).outerHTML : '');
        openPop({
          img: $('img', arts[i]).currentSrc || $('img', arts[i]).src,
          html: pick('.tier__level') + pick('.tier__name') + pick('.tier__tag') + pick('.tier__desc') + $('.tier__more > div', t).innerHTML
        });
      } else { done = true; openTier(i); }
    }));
    stage.addEventListener('pointerleave', () => focus(null));
    stage.addEventListener('focusout', (e) => { if (!stage.contains(e.relatedTarget)) focus(null); });
  }
})();

/* v0.7 · hero KV video: dừng khi giảm chuyển động hoặc khi hero khuất khỏi màn hình */
(()=>{const v=document.querySelector('.hero__media video');if(!v)return;
if(matchMedia('(max-width:767px)').matches&&v.dataset.mobile){v.poster=v.dataset.mobilePoster||v.poster;v.src=v.dataset.mobile;v.load()}
const rm=matchMedia('(prefers-reduced-motion: reduce)');
const sync=()=>{if(rm.matches){v.pause();v.currentTime=0}else v.play().catch(()=>{})};
rm.addEventListener?.('change',sync);sync();
new IntersectionObserver(([e])=>{if(rm.matches)return;e.isIntersecting?v.play().catch(()=>{}):v.pause()}).observe(v);})();

/* v0.15 · Hành trình di sản: đường cong luỹ tiến (pathLength=1, vẽ từ điểm đầu), đồng tiền đứng yên theo bố cục mặc định, thẻ mở rộng ngang */
(()=>{const root=document.querySelector('[data-ascend]');if(!root)return;
const row=root.querySelector('.ascend__row'),steps=[...root.querySelectorAll('.step')];
const svg=root.querySelector('.ascend__line'),paths=[...svg.querySelectorAll('path')];
const nodes=[...root.querySelectorAll('.anode')];
const mobile=matchMedia('(max-width:767px)');
paths.forEach(p=>p.setAttribute('pathLength','1'));
const bez=(p0,p1,p2,p3,t)=>{const u=1-t;return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3};
let lastW=0;
const layout=()=>{if(mobile.matches)return;
  const W=svg.clientWidth,H=svg.clientHeight;if(!W||!H)return;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const lo=H-72,P=[[0,lo],[W*.36,lo],[W*.64,H*.6],[W,16]];
  const d=`M${P[0][0]} ${P[0][1]} C ${P[1][0]} ${P[1][1]}, ${P[2][0]} ${P[2][1]}, ${P[3][0]} ${P[3][1]}`;
  paths.forEach(p=>p.setAttribute('d',d));
  const cs=getComputedStyle(row),gap=parseFloat(cs.columnGap)||16,cw=(row.clientWidth-2*gap)/3,rowTop=row.offsetTop;
  nodes.forEach((n,i)=>{const x=i*(cw+gap)+cw/2;let a=0,b=1;
    for(let k=0;k<30;k++){const m=(a+b)/2;bez(P[0][0],P[1][0],P[2][0],P[3][0],m)<x?a=m:b=m}
    const y=bez(P[0][1],P[1][1],P[2][1],P[3][1],a);
    n.style.setProperty('--x',x+'px');n.style.setProperty('--y',y+'px');
    n.style.setProperty('--drop',Math.max(0,rowTop-y-15)+'px');
    n.style.setProperty('--nd',(.45+2.1*Math.pow(a,1.15)).toFixed(2)+'s');});
  lastW=W;};
const activate=(i)=>{if(mobile.matches)return;
  root.classList.toggle('has-active',i!==null);root.dataset.active=i===null?'':i;
  steps.forEach((s,k)=>s.classList.toggle('is-active',k===i));
  nodes.forEach((n,k)=>{n.classList.toggle('is-on',k===i);n.classList.toggle('is-off',i!==null&&k===1&&i!==1)});};
/* v0.20: hover có độ trễ nhỏ + khoá trong lúc thẻ đang giãn, tránh nhảy qua lại khi ranh giới thẻ dịch chuyển dưới con trỏ */
let cur=null,tIn=0,tOut=0,lockUntil=0;
const want=(i)=>{clearTimeout(tOut);clearTimeout(tIn);if(i===cur)return;const now=performance.now(),wait=Math.max(cur===null?60:110,lockUntil-now);tIn=setTimeout(()=>{cur=i;lockUntil=performance.now()+260;activate(i)},wait)};
steps.forEach((s,i)=>{s.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')want(i)});s.addEventListener('focus',()=>{cur=i;activate(i)});
  const btn=s.querySelector('.step__toggle');btn&&btn.addEventListener('click',e=>{e.stopPropagation();if(!mobile.matches){activate(i);return}if(window.vtbPop){const t=s.className.match(/step--(\w+)/)[1],img=s.querySelector('.step__media img').getAttribute('src');window.vtbPop({img,html:`<div class="step-pop step--${t}"><span class="step-pop__pat" aria-hidden="true"></span>${s.querySelector('.step__level').outerHTML}${s.querySelector('.step__head').outerHTML}<div class="step-pop__panel">${s.querySelector('.step__more > div').innerHTML}</div></div>`});document.getElementById('pop').dataset.tier=t;return}});});
steps.forEach(s=>s.addEventListener('click',e=>{if(!mobile.matches||e.target.closest('a,button'))return;const t=s.querySelector('.step__toggle');t&&t.click()}));
root.addEventListener('pointerleave',()=>{clearTimeout(tIn);clearTimeout(tOut);tOut=setTimeout(()=>{cur=null;lockUntil=0;activate(null)},180)});
root.addEventListener('pointerenter',()=>clearTimeout(tOut));
root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget)){cur=null;activate(null)}});
new ResizeObserver(()=>{if(svg.clientWidth!==lastW)layout()}).observe(root);
addEventListener('load',layout);document.fonts&&document.fonts.ready.then(layout);
mobile.addEventListener&&mobile.addEventListener('change',()=>{activate(null);layout()});
layout();
new IntersectionObserver(([e],o)=>{if(e.isIntersecting){o.disconnect();layout();requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.add('is-in')))}},{threshold:.25}).observe(root);
})();
/* mobile: chiều dài đường dọc cho ánh sáng chạy hết */
(()=>{const a=document.querySelector('[data-ascend]');if(!a)return;const set=()=>a.style.setProperty('--rowh',a.getBoundingClientRect().height+'px');new ResizeObserver(set).observe(a);set();})();

/* v0.14 · Điều kiện (mobile): card trượt ngang + chấm; nút "Xem điều kiện" cuộn tới và trượt đúng hạng */
(()=>{const grid=document.querySelector('.conditions__grid');if(!grid)return;
const cards=[...grid.querySelectorAll('.tcard')],dots=[...document.querySelectorAll('.cdots i')],mq=matchMedia('(max-width:767px)');
const red=matchMedia('(prefers-reduced-motion: reduce)').matches;
const center=(c,smooth)=>grid.scrollTo({left:c.offsetLeft-(grid.clientWidth-c.offsetWidth)/2,behavior:smooth&&!red?'smooth':'auto'});
let raf=0;const pick=()=>{raf=0;if(!mq.matches){cards.forEach(c=>c.classList.remove('is-cur'));return}
  const r=grid.getBoundingClientRect(),m=r.left+r.width/2;let b=0,bd=1e9;
  cards.forEach((c,i)=>{const q=c.getBoundingClientRect(),d=Math.abs(q.left+q.width/2-m);if(d<bd){bd=d;b=i}});
  cards.forEach((c,i)=>c.classList.toggle('is-cur',i===b));dots.forEach((d,i)=>d.classList.toggle('is-on',i===b))};
grid.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(pick)},{passive:true});addEventListener('resize',pick);
cards.forEach(c=>c.addEventListener('click',()=>{if(mq.matches&&!c.classList.contains('is-cur'))center(c,true)}));
requestAnimationFrame(()=>{if(mq.matches)center(cards[0],false);pick()});
const sec=document.getElementById('dieu-kien');const order=['plat','dia','eli'];
const go=(t)=>{const c=grid.querySelector(`.tcard[data-tier="${t}"]`);if(!c)return;
  const hdr=72;const top=(mq.matches?grid:sec).getBoundingClientRect().top+scrollY-hdr-(mq.matches?120:24);
  scrollTo({top,behavior:red?'auto':'smooth'});
  setTimeout(()=>{if(mq.matches)center(c,true);cards.forEach(o=>o.classList.remove('is-focus'));void c.offsetWidth;c.classList.add('is-focus');setTimeout(()=>c.classList.remove('is-focus'),2600)},red?0:700)};
const closeP=()=>{const p=document.getElementById('pop');if(p&&!p.hidden){p.querySelector('.pop__x').click();return 420}return 0};
const goPriv=(t)=>{const w=document.querySelector('[data-pvx]');if(!w)return;
  scrollTo({top:w.getBoundingClientRect().top+scrollY-110,behavior:red?'auto':'smooth'});
  if(order.indexOf(t)>-1){clearTimeout(w._ft);w.dataset.focus=t;w._ft=setTimeout(()=>delete w.dataset.focus,3200)}};
document.addEventListener('click',e=>{const pb=e.target.closest('[data-goto-priv]');
  if(pb){e.preventDefault();e.stopPropagation();const t=pb.dataset.gotoPriv;setTimeout(()=>goPriv(t),closeP());return}
  const b=e.target.closest('[data-goto-cond]');if(!b)return;e.preventDefault();e.stopPropagation();const wait=closeP();let t=b.dataset.gotoCond;
  setTimeout(()=>{
  if(!t){if(!mq.matches){scrollTo({top:sec.getBoundingClientRect().top+scrollY-96,behavior:red?'auto':'smooth'});setTimeout(()=>cards.forEach((c,i)=>setTimeout(()=>{c.classList.remove('is-focus');void c.offsetWidth;c.classList.add('is-focus');setTimeout(()=>c.classList.remove('is-focus'),2600)},i*180)),red?0:700);return}t='plat'}go(t)},wait)},true);
})();

/* v0.21 · Đặc quyền: chọn từng nhóm đặc quyền (tab), vuốt ngang trên mobile */
(()=>{const root=document.querySelector('[data-pvx]');if(!root)return;
const tabs=[...root.querySelectorAll('.pvx__tab')],panels=[...root.querySelectorAll('.pvx__panel')],nav=root.querySelector('.pvx__nav');
let cur=0;const red=matchMedia('(prefers-reduced-motion: reduce)').matches;
const center=(t,smooth)=>{if(nav.scrollWidth<=nav.clientWidth+2)return;const nr=nav.getBoundingClientRect(),tr=t.getBoundingClientRect();nav.scrollTo({left:nav.scrollLeft+(tr.left+tr.width/2)-(nr.left+nr.width/2),behavior:smooth?'smooth':'auto'})};
const set=(i,focus)=>{i=(i+tabs.length)%tabs.length;if(i===cur)return;cur=i;
  tabs.forEach((t,k)=>{const on=k===i;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1});
  panels.forEach((p,k)=>{const on=k===i;p.classList.toggle('is-on',on);if(on){p.removeAttribute('aria-hidden');p.inert=false}else{p.setAttribute('aria-hidden','true');p.inert=true}});
  const t=tabs[i];if(focus)t.focus({preventScroll:true});
  center(t,!red)};
tabs.forEach((t,i)=>t.addEventListener('click',()=>set(i)));
nav.addEventListener('keydown',e=>{const k={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];if(k){e.preventDefault();set(cur+k,true)}else if(e.key==='Home'){e.preventDefault();set(0,true)}else if(e.key==='End'){e.preventDefault();set(tabs.length-1,true)}});
const stage=root.querySelector('.pvx__stage');let x0=null,y0=0;
stage.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
stage.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.4)set(cur+(dx<0?1:-1))},{passive:true});
})();

/* v0.21 · Dành riêng KHƯT (mobile): chấm trang cho slider */
(()=>{const g=document.querySelector('.exclusive__grid'),dots=[...document.querySelectorAll('.xdots i')];if(!g||!dots.length)return;
const cards=[...g.querySelectorAll('.xcard')];let raf=0;
const pick=()=>{raf=0;const L=g.getBoundingClientRect().left+parseFloat(getComputedStyle(g).paddingLeft||0);let b=0,bd=1e9;cards.forEach((c,i)=>{const d=Math.abs(c.getBoundingClientRect().left-L);if(d<bd){bd=d;b=i}});
  if(g.scrollLeft+g.clientWidth>=g.scrollWidth-4)b=cards.length-1;dots.forEach((d,i)=>d.classList.toggle('is-on',i===b))};
g.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(pick)},{passive:true});})();

/* v0.24 · Sản phẩm (mobile): slide thẻ, thẻ ở giữa nổi rõ + chấm trang */
(()=>{const g=document.querySelector('.products .cards'),dots=[...document.querySelectorAll('.pdots i')];if(!g)return;
const cards=[...g.querySelectorAll('.ccard')],mq=matchMedia('(max-width:767px)');let raf=0;
const pick=()=>{raf=0;if(!mq.matches){cards.forEach(c=>c.classList.remove('is-cur'));return}
  const r=g.getBoundingClientRect(),mid=r.left+r.width/2;let b=0,bd=1e9;
  cards.forEach((c,i)=>{const cr=c.getBoundingClientRect(),d=Math.abs(cr.left+cr.width/2-mid);if(d<bd){bd=d;b=i}});
  cards.forEach((c,i)=>c.classList.toggle('is-cur',i===b));dots.forEach((d,i)=>d.classList.toggle('is-on',i===b))};
g.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(pick)},{passive:true});addEventListener('resize',pick);
cards.forEach(c=>c.addEventListener('click',e=>{if(mq.matches&&!c.classList.contains('is-cur')&&!e.target.closest('a')){g.scrollTo({left:c.offsetLeft-(g.clientWidth-c.offsetWidth)/2,behavior:'smooth'})}}));
requestAnimationFrame(pick);})();

/* v0.28 · Mobile: ẩn nút chat/lên đầu trang khi CTA hero đang hiện, tránh che nút */
(()=>{const cta=document.querySelector('.hero__cta'),dock=document.querySelector('.dock');if(!cta||!dock||!('IntersectionObserver' in window))return;
const mq=matchMedia('(max-width:767px)');
new IntersectionObserver(([e])=>{dock.classList.toggle('is-tucked',mq.matches&&e.isIntersecting&&!dock.querySelector('.chat.is-open'))},{threshold:0}).observe(cta);})();

/* v0.29 · Hành trình (desktop): đo trước kích thước thẻ ở trạng thái thu/giãn để cố định bề ngang chữ và khung ảnh */
(()=>{const root=document.querySelector('.ascend');if(!root)return;const steps=[...root.querySelectorAll('.step')];if(steps.length<2)return;
const mq=matchMedia('(min-width:768px)');
const measure=()=>{if(!mq.matches){['--aw','--mw','--tw'].forEach(v=>root.style.removeProperty(v));return}
  const saved=steps.map(s=>s.classList.contains('is-active')),had=root.classList.contains('has-active');
  root.classList.add('is-measuring');
  steps.forEach(s=>s.classList.remove('is-active'));root.classList.remove('has-active');
  const wi=steps[0].getBoundingClientRect().width;
  steps[1].classList.add('is-active');root.classList.add('has-active');
  const aw=steps[1].getBoundingClientRect().width,cw=steps[0].getBoundingClientRect().width;
  steps[1].classList.remove('is-active');root.classList.toggle('has-active',had);
  steps.forEach((s,i)=>s.classList.toggle('is-active',saved[i]));
  const body=steps[0].querySelector('.step__body'),cs=getComputedStyle(body),pad=parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight);
  root.style.setProperty('--aw',aw+'px');
  root.style.setProperty('--mw',Math.ceil(Math.max(aw*.62,wi,cw))+'px');
  root.style.setProperty('--tw',Math.floor(Math.min(cw,400)-pad)+'px');root.style.setProperty('--twi',Math.floor(Math.min(wi,400)-pad)+'px');
  void root.offsetWidth;root.classList.remove('is-measuring')};
let t=0;addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(measure,120)});
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(measure);measure();})();

/* v0.29 · Tạm dừng animation lặp ở các section ngoài màn hình (đỡ tốn GPU/CPU, cuộn & hover mượt hơn) */
(()=>{if(!('IntersectionObserver' in window))return;
const io=new IntersectionObserver(es=>es.forEach(e=>e.target.classList.toggle('is-offscreen',!e.isIntersecting)),{rootMargin:'120px 0px'});
document.querySelectorAll('main > section, .hero, footer, .silk').forEach(s=>io.observe(s));})();

/* v0.30 · Chèn viền SVG "tô sáng dần" cho 3 thẻ hạng */
(()=>{const steps=document.querySelectorAll('.ascend .step');const NS='http://www.w3.org/2000/svg';
const pal={plat:['#FFFFFF','#E6EAF0','#9AA4B4'],dia:['#F4FEFF','#C2F0F1','#4FB3BC'],eli:['#FFF4F0','#F0C3BA','#B5635F']};
steps.forEach((s,i)=>{const f=s.querySelector('.step__frame');if(!f||f.querySelector('.step__trace'))return;
  const k=s.classList.contains('step--eli')?'eli':s.classList.contains('step--dia')?'dia':'plat',c=pal[k],id='trg'+i;
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('class','step__trace');svg.setAttribute('aria-hidden','true');
  svg.innerHTML=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c[0]}"/><stop offset=".45" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[2]}"/></linearGradient></defs>`+
   `<rect x="0" y="0" width="100%" height="100%" rx="18" ry="18" pathLength="1" stroke="url(#${id})"/>`+
   `<rect class="tr-tip" x="0" y="0" width="100%" height="100%" rx="18" ry="18" pathLength="1" stroke="#FFFFFF"/>`;
  f.appendChild(svg)});})();
