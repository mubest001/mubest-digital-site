/* Mubest Digital · Public case-study pages. The project URL is optional. */
(() => {
  'use strict';
  const $=selector=>document.querySelector(selector);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url=v=>{const s=String(v||'').trim();return /^https?:\/\//i.test(s)||/^\/(?!\/)/.test(s)?s:'';};
  const list=v=>Array.isArray(v)?v.filter(Boolean):String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const linkTo=item=>'/portfolio/project/?slug='+encodeURIComponent(String(item.slug||''));
  const detailBlock=(title,content)=>String(content||'').trim()?`<section class="case-detail-section"><span class="eyebrow">${esc(title)}</span><div class="case-paragraphs">${String(content).trim().split(/\n\s*\n|\n/).filter(Boolean).map(p=>`<p>${esc(p)}</p>`).join('')}</div></section>`:'';
  function chipBlock(title,items){const entries=list(items);return entries.length?`<div class="case-chip-group"><h3>${esc(title)}</h3><div class="case-chips">${entries.map(e=>`<span>${esc(e)}</span>`).join('')}</div></div>`:'';}
  function render(data,project){
    const details=project.details&&typeof project.details==='object'?project.details:{};
    $('#caseLoading').hidden=true;
    $('#caseHeading').hidden=false;
    $('#caseMain').hidden=false;
    $('#caseBread').textContent=project.title;
    $('#caseCategory').textContent=project.category||'MUBEST DIGITAL PROJECT';
    $('#caseTitle').textContent=project.title;
    $('#caseExcerpt').textContent=project.excerpt||project.description||'A closer look at the work.';
    document.title=`${project.title} · Portfolio | Mubest Digital`;
    const description=$('meta[name="description"]');if(description)description.content=(project.excerpt||project.description||'Project case study').slice(0,170);
    const actions=[];
    if(url(project.project_url))actions.push(`<a class="button button-light" href="${esc(url(project.project_url))}" target="_blank" rel="noopener noreferrer">Visit live project <span>↗</span></a>`);
    actions.push(`<a class="case-back-link" href="/portfolio/">← All projects</a>`);
    $('#caseActions').innerHTML=actions.join('');
    const summary=[['Project type',details.project_type||project.category],['My role',details.role],['Year',details.year],['Duration',details.duration]].filter(([,v])=>String(v||'').trim());
    const chipGroups=[chipBlock('Services provided',details.services_used),chipBlock('Skills & tools',details.skills_used),chipBlock('Deliverables',details.deliverables)].filter(Boolean);
    const sidebar=summary.length?`<div class="case-facts">${summary.map(([label,value])=>`<div class="case-fact"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join('')}</div>`:'';
    $('#caseSummary').innerHTML=`<span class="case-aside-label">PROJECT DETAILS</span>${sidebar}${chipGroups.join('')}`;
    if(!sidebar && !chipGroups.length){$('.case-aside').hidden=true;$('#caseMain').classList.add('case-no-aside');}
    $('#caseContent').innerHTML=
      detailBlock('Project overview',project.description||project.excerpt)+
      detailBlock('The challenge',details.challenge)+
      detailBlock('Project goals',details.goals)+
      detailBlock('My approach',details.approach)+
      detailBlock('The solution',details.solution)+
      detailBlock('Outcomes',details.outcomes)+
      (String(details.client_feedback||'').trim()?`<section class="case-quote"><span class="eyebrow">Client feedback</span><blockquote>“${esc(details.client_feedback)}”</blockquote></section>`:'');
    if(!$('#caseContent').textContent.trim())$('#caseContent').innerHTML='<section class="case-detail-section"><span class="eyebrow">Project overview</span><p>More project details will be added here.</p></section>';
    const cover=url(project.cover_image);
    $('#caseVisualSection').hidden=false;
    $('#caseVisual').innerHTML=cover?`<div class="case-cover"><img src="${esc(cover)}" alt="${esc(project.title)} — main project image" loading="eager"></div>`:`<div class="case-cover case-cover-fallback"><span>MUBEST DIGITAL · PROJECT SHOWCASE</span><strong>${esc(project.title)}</strong></div>`;
    const gallery=list(project.gallery).map(url).filter(Boolean).slice(0,24);
    if(gallery.length){$('#caseGallerySection').hidden=false;$('#caseGallery').innerHTML=gallery.map((src,i)=>`<figure><img loading="lazy" src="${esc(src)}" alt="${esc(project.title)} screenshot ${i+1}"><figcaption>Project visual ${String(i+1).padStart(2,'0')}</figcaption></figure>`).join('');}
    const related=(data.portfolio||[]).filter(x=>x.id!==project.id).slice(0,3);
    if(related.length){
      $('#caseRelatedSection').hidden=false;
      $('#caseRelated').innerHTML=related.map(item=>`<a class="case-related-card" href="${esc(linkTo(item))}"><span class="case-related-visual">${url(item.cover_image)?`<img loading="lazy" src="${esc(url(item.cover_image))}" alt="${esc(item.title)} preview">`:`<strong>${esc(item.title.slice(0,1))}</strong>`}</span><small>${esc(item.category||'Project')}</small><h3>${esc(item.title)} <span aria-hidden="true">↗</span></h3><p>${esc(item.excerpt||'')}</p></a>`).join('');
    }
    const settings=data.settings||{};
    if(url(settings.logo_url))document.querySelectorAll('.brand-logo').forEach(img=>img.src=url(settings.logo_url));
    if(url(settings.favicon_url))$('link[rel="icon"]').href=url(settings.favicon_url);
    window.dispatchEvent(new CustomEvent('mubest:case-ready',{detail:{data,project}}));
  }
  function showError(message){$('#caseLoading').innerHTML=`<p>${esc(message)}</p><a class="button button-light" href="/portfolio/">Back to portfolio ↗</a>`;}
  const menuToggle=$('[data-menu-toggle]');const nav=$('[data-site-nav]');
  menuToggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');document.body.classList.toggle('menu-open',open);menuToggle.setAttribute('aria-expanded',String(open));});
  nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');document.body.classList.remove('menu-open');}));
  const siteHeader=$('.site-header');const syncHeader=()=>siteHeader?.classList.toggle('is-scrolled',scrollY>24);
  syncHeader();addEventListener('scroll',syncHeader,{passive:true});
  document.querySelectorAll('[data-current-year]').forEach(el=>el.textContent=new Date().getFullYear());
  (async()=>{
    const slug=new URLSearchParams(location.search).get('slug');
    if(!slug||slug.length>180){showError('This project could not be found.');return;}
    try{
      const data=await (window.MubestPublicContentPromise ||= fetch('/api/public-content',{cache:'no-store'}).then(async res=>{if(!res.ok)throw new Error('Portfolio details are temporarily unavailable.');return res.json();}));
      const project=(data.portfolio||[]).find(item=>item.slug===slug);
      if(!project){showError('This project is not published or cannot be found.');return;}
      render(data,project);
    }catch(e){showError(e.message||'Portfolio details are temporarily unavailable.');}
  })();
})();
