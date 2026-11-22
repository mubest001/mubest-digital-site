/* Mubest Digital Premium Polish V6 · a11y, progress and real-project quick previews */
(function MubestPremiumPolishV6(){
  'use strict';
  if(new URLSearchParams(location.search).has('mubest-editor'))return;
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;', '>':'&gt;', '"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=value=>{const s=String(value||'').trim();return /^https:\/\//i.test(s)||/^\/(?!\/)/.test(s)?s:'';};
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function a11y(){
    const main=$('main');
    if(main&&!$('#v6SkipLink')){
      if(!main.id)main.id='v6-main';
      main.tabIndex=-1;
      const skip=document.createElement('a');
      skip.id='v6SkipLink';skip.className='v6-skip-link';skip.href='#'+main.id;skip.textContent='Skip to main content';
      document.body.prepend(skip);
    }
    $$('img:not([loading])').forEach(img=>{if(!img.closest('.hero,.brand,.case-hero'))img.loading='lazy';});
    const nav=$('.site-header .nav'),toggle=$('[data-menu-toggle]');
    if(nav&&toggle){
      if(!nav.id)nav.id='v6PrimaryNav';
      toggle.setAttribute('aria-controls',nav.id);
      toggle.setAttribute('type','button');
      const close=()=>{
        nav.classList.remove('open');document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');
      };
      document.addEventListener('keydown',event=>{
        if(event.key==='Escape'&&nav.classList.contains('open')){close();toggle.focus();}
      });
      window.addEventListener('resize',()=>{if(window.innerWidth>1024&&nav.classList.contains('open'))close();},{passive:true});
      document.addEventListener('click',event=>{
        if(nav.classList.contains('open')&&!nav.contains(event.target)&&!toggle.contains(event.target))close();
      });
    }
  }
  function progress(){
    if($('#v6ScrollLine'))return;
    const track=document.createElement('div');track.id='v6ScrollLine';track.className='v6-scroll-line';
    track.setAttribute('aria-hidden','true');document.body.append(track);
    const back=document.createElement('button');back.id='v6BackToTop';back.className='v6-back-top';back.type='button';
    back.setAttribute('aria-label','Back to top');
    back.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 14 6-6 6 6"/><path d="M12 8v12"/></svg>';
    back.addEventListener('click',()=>window.scrollTo({top:0,behavior:reduced?'auto':'smooth'}));
    document.body.append(back);
    let raf=0;
    const update=()=>{
      raf=0;
      const total=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
      const pos=Math.max(0,window.scrollY);
      track.style.transform='scaleX('+Math.min(1,pos/total)+')';
      back.classList.toggle('is-visible',pos>Math.max(540,window.innerHeight*.8));
    };
    const schedule=()=>{if(!raf)raf=window.requestAnimationFrame(update);};
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    update();
  }
  function portfolioPreview(data){
    if(document.body.dataset.page!=='portfolio'||$('#v6PreviewDialog'))return;
    const grid=$('.portfolio-grid');if(!grid)return;
    const projects=Array.isArray(data?.portfolio)?data.portfolio:[];
    const list=projects.filter(project=>project&&project.status!=='draft'&&project.status!=='archived');
    if(!list.length)return;
    const bySlug=new Map(list.map(project=>[String(project.slug||''),project]));
    const matched=$$('.work-card',grid).map(card=>{
      const url=$('a[href*="slug="]',card)?.href;
      if(!url)return null;
      try{const slug=new URL(url).searchParams.get('slug')||'';return {card,project:bySlug.get(slug)};}catch{return null;}
    }).filter(item=>item?.project);
    if(!matched.length)return;
    const dialog=document.createElement('dialog');dialog.id='v6PreviewDialog';dialog.className='v6-preview-dialog';
    dialog.setAttribute('aria-label','Portfolio project quick preview');
    dialog.innerHTML='<div class="v6-preview-top"><span>PROJECT SNAPSHOT</span><button class="v6-preview-close" type="button" aria-label="Close project preview">×</button></div><div class="v6-preview-grid"><div class="v6-preview-visual"></div><div class="v6-preview-copy"><span class="v6-preview-category"></span><h2></h2><p></p><div class="v6-preview-services"></div><div class="v6-preview-actions"><a class="button button-primary" href="">Read full case study ↗</a><a class="v6-preview-brief" href="/start-project/">Discuss a similar project ↗</a></div></div></div><div class="v6-preview-footer"><span data-v6-index></span><button class="v6-preview-next" type="button">Next project →</button></div>';
    document.body.append(dialog);
    let activeIndex=0,trigger=null;
    const showProject=index=>{
      activeIndex=(index+matched.length)%matched.length;
      const {project}=matched[activeIndex],details=project.details||{};
      const img=safeUrl(project.cover_image);
      $('.v6-preview-visual',dialog).innerHTML=img
        ?'<img src="'+esc(img)+'" alt="'+esc(project.title||'Portfolio project')+' project preview">'
        :'<span class="v6-preview-monogram" aria-hidden="true">'+esc((project.title||'M').trim().charAt(0).toUpperCase())+'</span>';
      $('.v6-preview-category',dialog).textContent=project.category||'Selected project';
      $('.v6-preview-copy h2',dialog).textContent=project.title||'Portfolio project';
      $('.v6-preview-copy p',dialog).textContent=(project.excerpt||project.description||'Explore the approach and scope in the complete case study.').slice(0,500);
      const services=Array.isArray(details.service_categories)?details.service_categories:[];
      $('.v6-preview-services',dialog).innerHTML=services.slice(0,4).map(x=>'<span>'+esc(x)+'</span>').join('');
      const slug=encodeURIComponent(project.slug||'');
      $('.v6-preview-actions>.button',dialog).href='/portfolio/project/?slug='+slug;
      $('.v6-preview-brief',dialog).href='/start-project/'+(services[0]?'?service='+encodeURIComponent(services[0]):'');
      $('[data-v6-index]',dialog).textContent=String(activeIndex+1).padStart(2,'0')+' / '+String(matched.length).padStart(2,'0')+'  ·  '+(project.category||'Selected work');
      $('.v6-preview-next',dialog).hidden=matched.length<=1;
    };
    matched.forEach((entry,i)=>{
      const info=$('.work-info',entry.card);if(!info)return;
      let actions=$('.v6-quick-actions',info);
      if(!actions){
        actions=document.createElement('div');actions.className='v6-quick-actions';
        const existing=$('a.work-link',info);
        if(existing){info.insertBefore(actions,existing);actions.append(existing);}else info.append(actions);
      }
      const button=document.createElement('button');button.type='button';button.className='v6-quick-open';
      button.setAttribute('aria-label','Quick view '+(entry.project.title||'project'));
      button.textContent='Quick view';
      actions.prepend(button);
      button.addEventListener('click',()=>{
        trigger=button;showProject(i);dialog.showModal();
      });
    });
    $('.v6-preview-close',dialog).addEventListener('click',()=>dialog.close());
    $('.v6-preview-next',dialog).addEventListener('click',()=>showProject(activeIndex+1));
    dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
    dialog.addEventListener('close',()=>trigger?.focus());
    dialog.addEventListener('keydown',event=>{
      if(event.key==='ArrowRight'&&!['INPUT','TEXTAREA'].includes(event.target.tagName)){event.preventDefault();showProject(activeIndex+1);}
      if(event.key==='ArrowLeft'&&!['INPUT','TEXTAREA'].includes(event.target.tagName)){event.preventDefault();showProject(activeIndex-1);}
    });
  }
  async function mount(){
    a11y();progress();
    const data=await (window.MubestPublicContentPromise||Promise.resolve(null)).catch(()=>null);
    if(document.body.dataset.page==='portfolio'&&data){
      // CMS fills the project grid asynchronously; defer to the next paint before reading project cards.
      requestAnimationFrame(()=>requestAnimationFrame(()=>portfolioPreview(data)));
      if(!$('.portfolio-grid .work-card')){
        const grid=$('.portfolio-grid');if(grid){
          const observer=new MutationObserver(()=>{if($('.portfolio-grid .work-card')){observer.disconnect();portfolioPreview(data);}});
          observer.observe(grid,{childList:true,subtree:false});
          setTimeout(()=>observer.disconnect(),6000);
        }
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
