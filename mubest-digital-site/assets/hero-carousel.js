/* Mubest Digital — three-slide video hero, CMS-aware, keyboard/swipe accessible. */
(() => {
  'use strict';
  const hero = document.querySelector('[data-hero-carousel]');
  if (!hero) return;
  const slides = Array.from(hero.querySelectorAll('.hero-slide'));
  const dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  const prev = hero.querySelector('[data-hero-prev]');
  const next = hero.querySelector('[data-hero-next]');
  const currentEl = hero.querySelector('[data-hero-current]');
  const currentLabel = hero.querySelector('[data-hero-current-label]');
  const indicators = hero.querySelector('.hero-carousel-indicators');
  const labels = ['Creative digital solutions','Klaviyo & customer retention','Ecommerce experiences'];
  const INTERVAL = 8000;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  let index=0, timer=null, paused=false, visible=true, touchX=null, videosEnabled=true;

  const validUrl = url => {
    const value=String(url || '').trim();
    return (/^https:\/\//i.test(value) || /^\/(?!\/)/.test(value)) ? value : '';
  };
  const isSafeLink = href => validUrl(href);
  const videoOf = slide => slide.querySelector('video');
  function playVideo(slide) {
    const video=videoOf(slide);
    if(!video || !videosEnabled || reducedMotion.matches || saveData || document.hidden || !visible) return;
    if(video.dataset.src && !video.src){video.src=video.dataset.src;video.load();}
    const result=video.play();if(result&&typeof result.catch==='function')result.catch(()=>{});
  }
  function pauseVideo(slide) { const video=videoOf(slide);if(video)video.pause(); }
  function clearTimer(){if(timer){clearTimeout(timer);timer=null;}}
  function updatePauseUI(){if(indicators)indicators.classList.toggle('is-paused',paused||document.hidden||!visible||reducedMotion.matches);}
  function schedule(){
    clearTimer();updatePauseUI();
    if(paused || document.hidden || !visible || reducedMotion.matches)return;
    timer=setTimeout(()=>go(index+1),INTERVAL);
  }
  function go(to, manual=false){
    const target=(to+slides.length)%slides.length;
    if(target===index){if(manual)schedule();return;}
    slides.forEach((slide,i)=>{
      const active=i===target;
      if(!active)pauseVideo(slide);
      slide.classList.toggle('is-active',active);
      slide.setAttribute('aria-hidden',String(!active));
      slide.inert=!active;
    });
    dots.forEach((dot,i)=>{
      dot.classList.toggle('is-active',i===target);
      dot.setAttribute('aria-current',String(i===target));
    });
    index=target;
    currentEl.textContent=String(index+1).padStart(2,'0');
    currentLabel.textContent=labels[index]||'Digital services';
    if(manual){paused=false;updatePauseUI();}
    if(videosEnabled)playVideo(slides[index]);
    schedule();
  }
  prev?.addEventListener('click',()=>go(index-1,true));
  next?.addEventListener('click',()=>go(index+1,true));
  dots.forEach((d,i)=>d.addEventListener('click',()=>go(i,true)));
  hero.addEventListener('keydown',event=>{
    if(event.target instanceof HTMLElement && ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;
    if(event.key==='ArrowRight'){event.preventDefault();go(index+1,true);}
    if(event.key==='ArrowLeft'){event.preventDefault();go(index-1,true);}
  });
  hero.addEventListener('touchstart',e=>{if(e.touches.length===1)touchX=e.touches[0].clientX;},{passive:true});
  hero.addEventListener('touchend',e=>{
    if(touchX===null || e.changedTouches.length===0)return;
    const difference=e.changedTouches[0].clientX-touchX;touchX=null;
    if(Math.abs(difference)>60)go(index+(difference<0?1:-1),true);
  },{passive:true});
  hero.addEventListener('mouseenter',()=>{paused=true;clearTimer();updatePauseUI();});
  hero.addEventListener('mouseleave',()=>{paused=false;schedule();});
  hero.addEventListener('focusin',()=>{paused=true;clearTimer();updatePauseUI();});
  hero.addEventListener('focusout',event=>{if(!hero.contains(event.relatedTarget)){paused=false;schedule();}});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){pauseVideo(slides[index]);clearTimer();}
    else playVideo(slides[index]);
    schedule();
  });
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      visible=entries.some(e=>e.isIntersecting);
      if(!visible){pauseVideo(slides[index]);clearTimer();}
      else playVideo(slides[index]);
      schedule();
    },{threshold:.12});observer.observe(hero);
  }
  reducedMotion.addEventListener?.('change',()=>{if(reducedMotion.matches)pauseVideo(slides[index]);else playVideo(slides[index]);schedule();});

  function putText(slide,selector,value){if(!value)return;const node=slide.querySelector(selector);if(node)node.textContent=String(value);}
  function putEmText(slide,selector,value){
    if(!value)return;
    const node=slide.querySelector(selector);if(!node)return;
    // Preserve the lime emphasis on the final word(s), without injecting HTML from CMS.
    const raw=String(value).trim(); const chunks=raw.split(/\s+/); const final=chunks.pop();
    node.replaceChildren(document.createTextNode(chunks.join(' ')+(chunks.length?' ':'')));
    const em=document.createElement('em');em.textContent=final;node.appendChild(em);
  }
  function setButton(slide,selector,label,url){
    const btn=slide.querySelector(selector);if(!btn)return;
    if(label){const span=btn.querySelector('span');btn.textContent=String(label)+' ';if(span)btn.appendChild(span);}
    if(isSafeLink(url))btn.href=url;
  }
  function configureVideo(slide,videoUrl,poster){
    const video=videoOf(slide);if(!video)return;
    if(validUrl(poster))video.poster=poster;
    if(validUrl(videoUrl)){
      pauseVideo(slide);
      video.removeAttribute('src');video.dataset.src=videoUrl;
      if(slide.classList.contains('is-active')&&!reducedMotion.matches&&!saveData&&!document.hidden){video.src=videoUrl;video.load();playVideo(slide);}
    }
  }
  function applySettings(data){
    const settings=data.settings||{};
    const page=(data.pages||{}).home||{};
    videosEnabled=settings.hero_video_enabled!==false;
    if(!videosEnabled){slides.forEach(slide=>{const video=videoOf(slide);if(video){pauseVideo(slide);video.style.display='none';}});}
    const video1=videoOf(slides[0]);
    if(settings.hero_poster_url && validUrl(settings.hero_poster_url))video1.poster=settings.hero_poster_url;
    if(settings.hero_video_url && validUrl(settings.hero_video_url)){
      const source=video1.querySelector('source');if(source){source.src=settings.hero_video_url;video1.load();}else video1.src=settings.hero_video_url;
      if(!reducedMotion.matches&&!saveData&&videosEnabled)playVideo(slides[0]);
    }
    [2,3].forEach(number=>{
      const slide=slides[number-1],prefix='hero_slide_'+number+'_';
      putText(slide,'.hero-kicker',page[prefix+'kicker']);
      putEmText(slide,'.hero-heading',page[prefix+'title']);
      putText(slide,'.hero-copy',page[prefix+'description']);
      setButton(slide,'.hero-actions a:first-child',page[prefix+'primary_label'],page[prefix+'primary_url']);
      setButton(slide,'.hero-actions a:nth-child(2)',page[prefix+'secondary_label'],page[prefix+'secondary_url']);
      configureVideo(slide,page[prefix+'video_url'],page[prefix+'poster_url']);
    });
  }

  slides.forEach((s,i)=>{s.inert=i!==0;});
  dots.forEach((d,i)=>d.setAttribute('aria-current',String(i===0)));
  playVideo(slides[0]);schedule();
  fetch('/api/public-content',{cache:'no-store'})
    .then(r=>r.ok?r.json():null).then(data=>{if(data)applySettings(data);})
    .catch(()=>{/* Static video slides remain available if CMS is offline. */});
})();
