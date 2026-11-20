/* Mubest Digital · Published section layout renderer. Safe DOM-only content. */
const ALLOWED_LAYOUTS=new Set(['default','left','right','center','wide']);
const safeUrl=value=>{const s=String(value||'').trim();return /^https?:\/\//i.test(s)||/^\/(?!\/)/.test(s)?s:'';};
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const lines=value=>String(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,30);
function builtinNode(page,id){
  const selectors={
    home_hero:'.hero',home_marquee:'.marquee',home_intro:'.intro-section',home_services:'.services-section',home_portfolio:'.work-section',home_process:'.process-section',home_about:'.about-strip',home_faq:'.faq-list',home_reviews:'.cms-testimonials',home_cta:'.cta-section',
    about_hero:'.page-hero',about_story:'.inner-light',about_values:'.values-grid',about_process:'.process-section',about_cta:'.cta-section',
    services_hero:'.page-hero',services_list:'.inner-light',services_cta:'.cta-section',
    portfolio_hero:'.page-hero',portfolio_grid:'.inner-light',portfolio_cta:'.cta-section',
    contact_hero:'.page-hero',contact_form:'.inner-light',contact_cta:'.cta-section'
  };
  if(!id.startsWith(page+'_'))return null;
  const node=document.querySelector(selectors[id]||'#__no_match__');
  return node&&['home_about','home_faq','about_values'].includes(id)?node.closest('section'):node;
}
function makeButton(item){
  const url=safeUrl(item.button_url);if(!url||!item.button_label)return '';
  const external=/^https?:\/\//i.test(url);
  return `<a class="button ${item.kind==='cta'?'button-light':'button-primary'}" href="${escapeHtml(url)}"${external?' target="_blank" rel="noopener noreferrer"':''}>${escapeHtml(item.button_label)} <span>↗</span></a>`;
}
function makeCustomSection(item,data){
  const kind=item.kind;
  if(!['text','image_text','reviews','faq','stats','cta','gallery'].includes(kind))return null;
  let body='';
  if(kind==='reviews'){
    const reviews=Array.isArray(data.testimonials)?data.testimonials:[];
    if(!reviews.length)return null;
    body=`<div class="layout-review-grid">${reviews.slice(0,12).map(r=>`<article class="layout-review"><div class="layout-review-stars" aria-label="${Math.min(5,Math.max(1,Number(r.rating)||5))} out of 5 stars">${'★'.repeat(Math.min(5,Math.max(1,Number(r.rating)||5)))}</div><blockquote>${escapeHtml(r.quote)}</blockquote><strong>${escapeHtml(r.name)}</strong><small>${escapeHtml([r.role,r.company].filter(Boolean).join(' · '))}</small></article>`).join('')}</div>`;
  }else if(kind==='faq'){
    const faqs=Array.isArray(data.faqs)?data.faqs:[];
    if(!faqs.length)return null;
    body=`<div class="layout-faq-list">${faqs.slice(0,20).map(f=>`<details class="layout-faq"><summary>${escapeHtml(f.question)}</summary><p>${escapeHtml(f.answer)}</p></details>`).join('')}</div>`;
  }else if(kind==='stats'){
    const entries=lines(item.items).filter(x=>x.includes('|'));
    if(!entries.length)return null;
    body=`<div class="layout-stats">${entries.map(x=>{const [value,...label]=x.split('|');return `<div class="layout-stat"><strong>${escapeHtml(value.trim())}</strong><span>${escapeHtml(label.join('|').trim())}</span></div>`;}).join('')}</div>`;
  }else if(kind==='gallery'){
    const urls=lines(item.items).map(safeUrl).filter(Boolean);
    if(!urls.length)return null;
    body=`<div class="layout-gallery">${urls.map((url,index)=>`<figure><img loading="lazy" src="${escapeHtml(url)}" alt="${escapeHtml(item.title||'Gallery')} ${index+1}"></figure>`).join('')}</div>`;
  }else{
    const paragraphs=lines(item.body).map(p=>`<p>${escapeHtml(p)}</p>`).join('');
    const content=`<div class="layout-body">${paragraphs}${makeButton(item)}</div>`;
    const image=safeUrl(item.image_url);
    if(kind==='image_text')body=`<div class="layout-split"><div class="layout-visual">${image?`<img loading="lazy" src="${escapeHtml(image)}" alt="${escapeHtml(item.title||'Project image')}">`:'<div class="layout-image-placeholder" aria-hidden="true">M</div>'}</div>${content}</div>`;
    else body=content;
  }
  const section=document.createElement('section');
  section.className='section layout-custom-section'+(kind==='cta'?' layout-cta':'');
  section.dataset.layoutId=item.id;
  section.innerHTML=`<div class="container layout-custom-inner"><div class="layout-heading">${item.kicker?`<span class="eyebrow">${escapeHtml(item.kicker)}</span>`:''}${item.title?`<h2>${escapeHtml(item.title)}</h2>`:''}</div>${body}</div>`;
  return section;
}
export function applyLayout(layouts,page,data){
  if(!layouts || !Array.isArray(layouts[page]))return;
  const main=document.querySelector('main');if(!main)return;
  const ordered=layouts[page];
  const original=Array.from(main.children);
  const placed=new Set();
  for(const item of ordered){
    if(!item || typeof item!=='object' || !item.id)continue;
    const node=item.kind==='builtin'?builtinNode(page,String(item.id)):makeCustomSection(item,data);
    if(!node||placed.has(node))continue;
    placed.add(node);
    const align=ALLOWED_LAYOUTS.has(item.layout)?item.layout:'default';
    node.classList.add('layout-managed','layout-'+align);
    if(item.visible===false)node.style.display='none';
    // Avoid accidentally showing a section previously hidden by admin switches.
    main.appendChild(node);
  }
  // Keep any future native page components that were not represented in the builder.
  for(const node of original){if(!placed.has(node))main.appendChild(node);}
}
