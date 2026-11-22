/* Mubest Digital Premium Experience V5 — services, search, verified proof and project guidance */
(function MubestPremiumV5(){
  'use strict';
  if(new URLSearchParams(location.search).has('mubest-editor'))return;
  const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const urls={home:'/',services:'/services/',portfolio:'/portfolio/',about:'/about/',contact:'/contact/',brief:'/start-project/'};
  const safe=x=>{const s=String(x??'').trim();return /^https:\/\//i.test(s)||/^\/(?!\/)/.test(s)?s:'';};
  const title=v=>String(v||'').trim();
  const config=window.MubestPremiumV5Config||{};
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href='/assets/premium-v5.css?v=1';document.head.appendChild(stylesheet);
  const setBodyScroll=()=>document.body.classList.toggle('v5-modal-open',Boolean($('.v5-search-dialog[open]')));
  function closeMobileNavigation(){
    const nav=$('[data-site-nav]'),toggle=$('[data-menu-toggle]');
    nav?.classList.remove('open');document.body.classList.remove('menu-open');toggle?.setAttribute('aria-expanded','false');
  }
  function mountMega(services){
    const nav=$('.site-header .nav[data-site-nav]'),original=nav?.querySelector('a[href="/services/"]');
    if(!original||!Array.isArray(services)||!services.length||nav.querySelector('.v5-services-menu'))return;
    const wrapper=document.createElement('div');wrapper.className='v5-services-menu';
    original.parentNode.insertBefore(wrapper,original);wrapper.appendChild(original);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='v5-services-toggle';toggle.setAttribute('aria-label','Browse website services');toggle.setAttribute('aria-haspopup','true');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','v5ServicesSubmenu');toggle.innerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';wrapper.append(toggle);
    const panel=document.createElement('div');panel.className='v5-services-panel';panel.id='v5ServicesSubmenu';panel.setAttribute('aria-label','Explore services');
    const links=services.slice(0,10).map((item,index)=>'<a class="v5-service-link" href="/services/#'+encodeURIComponent(item.slug||'')+'"><span class="v5-service-index">'+String(index+1).padStart(2,'0')+'</span><span><strong>'+esc(item.title||'Service')+'</strong><small>'+esc(item.summary||item.description||'').slice(0,112)+'</small></span><span class="v5-arrow" aria-hidden="true">↗</span></a>').join('');
    panel.innerHTML='<div class="v5-services-panel-intro"><div><span class="v5-overline">WHAT WE DO</span><h3>Choose where to begin.</h3><p>Explore focused services or bring together a few connected needs.</p></div><a href="/start-project/">Tell us about your project ↗</a></div><div class="v5-services-grid">'+links+'</div><div class="v5-services-panel-bottom"><span>Not sure what fits?</span><a href="/start-project/">Start with a guided brief ↗</a></div>';
    wrapper.append(panel);
    const close=()=>{wrapper.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');};
    toggle.addEventListener('click',e=>{e.stopPropagation();const on=!wrapper.classList.contains('is-open');wrapper.classList.toggle('is-open',on);toggle.setAttribute('aria-expanded',String(on));});
    document.addEventListener('click',e=>{if(!wrapper.contains(e.target))close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&wrapper.classList.contains('is-open')){close();toggle.focus();}});
    panel.addEventListener('click',e=>{if(e.target.closest('a')){close();closeMobileNavigation();}});
  }
  function mountSearch(data){
    const header=$('.site-header .header-inner');
    if(!header||$('#v5SiteSearch'))return;
    const launch=document.createElement('button');launch.id='v5SearchLaunch';launch.className='v5-search-launch';launch.type='button';launch.setAttribute('aria-label','Search website');launch.title='Search services and portfolio (Ctrl+K)';
    launch.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><span>Search</span>';
    const cta=$('.header-cta',header);if(cta)cta.before(launch);else header.append(launch);
    const dialog=document.createElement('dialog');dialog.className='v5-search-dialog';dialog.id='v5SiteSearch';dialog.setAttribute('aria-label','Search Mubest Digital');
    dialog.innerHTML='<div class="v5-search-top"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></svg><label class="v5-sr-only" for="v5SearchInput">Search pages, services and projects</label><input id="v5SearchInput" type="search" placeholder="Search services, work and pages…" autocomplete="off"><button type="button" data-v5-close aria-label="Close search">ESC</button></div><div class="v5-search-results" id="v5SearchResults" role="region" aria-live="polite"></div><div class="v5-search-foot"><span>↑ ↓ Navigate</span><span>Enter to open</span><span>Esc to close</span></div>';
    document.body.append(dialog);
    const records=[
      {label:'Home',description:'Discover Mubest Digital',type:'Page',url:urls.home},
      {label:'Services',description:'Explore digital services',type:'Page',url:urls.services},
      {label:'Portfolio',description:'Case studies and work',type:'Page',url:urls.portfolio},
      {label:'About',description:'How I work and who I am',type:'Page',url:urls.about},
      {label:'Contact',description:'Contact Mubest Digital',type:'Page',url:urls.contact},
      {label:'Start a project',description:'Send a guided project brief',type:'Page',url:urls.brief},
      ...(data.services||[]).map(x=>({label:title(x.title),description:title(x.summary||x.description),type:'Service',url:'/services/#'+encodeURIComponent(x.slug||'')})),
      ...(data.portfolio||[]).map(x=>({label:title(x.title),description:title(x.excerpt||x.category),type:'Project',url:'/portfolio/project/?slug='+encodeURIComponent(x.slug||'')}))
    ].filter(x=>x.label);
    const input=$('#v5SearchInput',dialog),results=$('#v5SearchResults',dialog);
    const render=()=>{
      const query=input.value.trim().toLocaleLowerCase().slice(0,90);
      let matches=records.map(r=>({...r,score:(r.label.toLowerCase().startsWith(query)?4:0)+(r.label.toLowerCase().includes(query)?2:0)+(r.description.toLowerCase().includes(query)?1:0)}))
        .filter(r=>!query||r.score>0).sort((a,b)=>b.score-a.score||a.type.localeCompare(b.type)).slice(0,9);
      if(!query)matches=[...records.slice(0,6)];
      results.innerHTML=matches.length?'<p class="v5-search-eyebrow">'+(query?'SEARCH RESULTS':'QUICK LINKS')+'</p>'+matches.map((r,index)=>'<a class="v5-search-result" href="'+esc(r.url)+'" data-v5-result="'+index+'"><span class="v5-search-kind">'+esc(r.type)+'</span><span class="v5-search-result-text"><strong>'+esc(r.label)+'</strong><small>'+esc(r.description).slice(0,120)+'</small></span><span class="v5-search-result-arrow">↗</span></a>').join(''):'<div class="v5-search-empty"><b>No results for that search.</b><p>Try a service name or <a href="/start-project/">describe your project instead</a>.</p></div>';
    };
    const open=()=>{if(!dialog.open){render();dialog.showModal();setBodyScroll();setTimeout(()=>input.focus(),30);}};
    const close=()=>{if(dialog.open)dialog.close();};
    launch.addEventListener('click',open);
    $('[data-v5-close]',dialog).addEventListener('click',close);
    input.addEventListener('input',render);
    dialog.addEventListener('close',setBodyScroll);
    dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
    dialog.addEventListener('keydown',e=>{
      if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;
      const all=$$('.v5-search-result',results);if(!all.length)return;
      e.preventDefault();
      const i=all.indexOf(document.activeElement);
      if(e.key==='ArrowDown')all[(i+1)%all.length].focus();
      else (i<0?all[all.length-1]:all[(i-1+all.length)%all.length]).focus();
    });
    document.addEventListener('keydown',e=>{
      const editable=e.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName);
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}
      else if(!editable&&e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();open();}
    });
  }
  function trustOnServices(data){
    const page=document.body.dataset.page;
    if(!['services','portfolio'].includes(page)||$('.v5-testimonials'))return;
    const items=Array.isArray(data.testimonials)?data.testimonials:[];if(!items.length)return;
    const section=document.createElement('section');section.className='v5-testimonials section';
    const cards=items.slice(0,3).map(t=>'<figure class="v5-testimonial"><div class="v5-testimonial-mark">“</div><blockquote>'+esc(t.quote||'')+'</blockquote><figcaption><strong>'+esc(t.name||'Client')+'</strong><span>'+esc([t.role,t.company].filter(Boolean).join(' · '))+'</span></figcaption></figure>').join('');
    section.innerHTML='<div class="container"><div class="v5-trust-heading"><div><span class="eyebrow">Client voices</span><h2>Thoughtful work, told by clients.</h2></div><p>Feedback from clients whose testimonials have been published with permission.</p></div><div class="v5-testimonial-grid">'+cards+'</div></div>';
    const cta=$('.cta-section');if(cta)cta.before(section);
  }
  function serviceActions(data){
    if(document.body.dataset.page!=='services')return;
    const services=Array.isArray(data.services)?data.services:[];
    const hydrate=()=>{
      for(const service of services){
        const row=document.getElementById(service.slug);
        if(!row||row.querySelector('.v5-service-cta'))continue;
        const target=$('div',row);if(!target)continue;
        const link=document.createElement('a');link.className='v5-service-cta';link.href='/start-project/?service='+encodeURIComponent(service.title||'');link.textContent='Discuss this service ↗';target.appendChild(link);
      }
    };
    hydrate();
    const list=$('.service-list');
    if(list){
      const observer=new MutationObserver(hydrate);observer.observe(list,{childList:true});setTimeout(()=>observer.disconnect(),7500);
    }
  }
  function addBriefLinks(){
    // Keep existing Contact link intact; give visitors a separate guided option.
    const contactForm=$('[data-contact-form]');
    if(contactForm&&!$('#v5BriefAlternative')){
      const item=document.createElement('a');item.id='v5BriefAlternative';item.href='/start-project/';item.className='v5-brief-alternative';item.innerHTML='<span><strong>Prefer a guided project brief?</strong><small>Answer a few structured questions so I can understand your project better.</small></span><span aria-hidden="true">↗</span>';
      contactForm.prepend(item);
    }
    const last=$('.cta-panel .button');
    if(last&&location.pathname.startsWith('/services/'))last.href='/start-project/';
  }
  function installFooterLink(){
    const footer=$('.site-footer .footer-top .footer-col:last-child');
    if(!footer||footer.querySelector('.v5-footer-brief'))return;
    const link=document.createElement('a');link.href='/start-project/';link.className='v5-footer-brief';link.textContent='Request a project quote ↗';footer.append(link);
  }
  async function run(){
    let data={services:[],portfolio:[],testimonials:[]};
    try{
      const response=await fetch('/api/public-content',{cache:'no-store'});
      if(response.ok)data=await response.json();
    }catch(e){console.warn('V5 service search unavailable:',e);}
    const services=Array.isArray(data.services)?data.services:[];
    mountMega(services);
    mountSearch(data);
    trustOnServices(data);
    serviceActions(data);
    addBriefLinks();
    installFooterLink();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
