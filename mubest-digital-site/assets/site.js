/* Mubest Digital — public interactions, CMS bridge and Studio 4.0 runtime. */
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-site-nav]');
if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open'); document.body.classList.remove('menu-open'); menuToggle.setAttribute('aria-expanded', 'false');
  }));
}
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const syncHeader = () => siteHeader.classList.toggle('is-scrolled', window.scrollY > 24);
  syncHeader(); window.addEventListener('scroll', syncHeader, { passive: true });
}
const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold:0.12 });
  revealItems.forEach(item => observer.observe(item));
} else revealItems.forEach(item => item.classList.add('is-visible'));
document.querySelectorAll('[data-faq-question]').forEach(button => button.addEventListener('click', () => {
  const item=button.closest('.faq-item'), answer=item?.querySelector('.faq-answer'), open=item?.classList.toggle('open');
  button.setAttribute('aria-expanded', String(Boolean(open))); if(answer)answer.style.maxHeight=open?`${answer.scrollHeight}px`:'0px';
}));
const contactForm=document.querySelector('[data-contact-form]');
if(contactForm){
  const honeypot=document.createElement('input');honeypot.type='text';honeypot.name='website';honeypot.tabIndex=-1;honeypot.autocomplete='off';honeypot.setAttribute('aria-hidden','true');honeypot.style.cssText='position:absolute;left:-10000px;width:1px;height:1px;opacity:0';contactForm.appendChild(honeypot);
  contactForm.addEventListener('submit',async event=>{event.preventDefault();const status=contactForm.querySelector('[data-form-status]');if(!contactForm.reportValidity())return;const button=contactForm.querySelector('[type="submit"]'),original=button?.innerHTML;if(button){button.disabled=true;button.textContent='Sending…';}try{const data=Object.fromEntries(new FormData(contactForm).entries());const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Your enquiry could not be sent.');status.textContent=result.message||'Thank you. Your enquiry has been received.';status.classList.add('show');contactForm.reset();}catch(error){status.textContent=error.message||'Something went wrong. Please try again.';status.classList.add('show');}finally{if(button){button.disabled=false;button.innerHTML=original;}}});
}
const heroVideo=document.querySelector('.hero-video');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData=Boolean(navigator.connection&&navigator.connection.saveData);
if(heroVideo&&(reduceMotion||saveData)){heroVideo.pause();heroVideo.removeAttribute('autoplay');}
document.querySelectorAll('[data-current-year]').forEach(node=>node.textContent=new Date().getFullYear());
const editorPreview=new URLSearchParams(location.search).has('mubest-editor');
if(editorPreview){const bridge=document.createElement('script');bridge.src='/assets/visual-editor-bridge.js?v=2-direct';document.body.appendChild(bridge);}
if(!editorPreview){
  const premium=document.createElement('script');premium.src='/assets/premium-v5.js?v=1';premium.defer=true;document.body.appendChild(premium);
}
if(!editorPreview){
  const assistant=document.createElement('script');assistant.src='/assets/ai-widget.js?v=1';assistant.defer=true;document.body.appendChild(assistant);
}

const cmsScript=document.createElement('script');cmsScript.src='/assets/cms-public.js?v=premium-v5-1';cmsScript.defer=true;
cmsScript.addEventListener('load',()=>{
  const brandTheme=document.createElement('link');brandTheme.rel='stylesheet';brandTheme.href='/assets/brand-two-color.css';brandTheme.dataset.brandTheme='two-colour';document.head.appendChild(brandTheme);
  if(!document.querySelector('[data-premium-v6-css]')){
    const v6css=document.createElement('link');v6css.rel='stylesheet';v6css.href='/assets/premium-v6.css?v=1';v6css.dataset.premiumV6Css='true';document.head.appendChild(v6css);
  }
  if(!editorPreview && !document.querySelector('[data-premium-v6-js]')){
    const v6=document.createElement('script');v6.src='/assets/premium-v6.js?v=1';v6.dataset.premiumV6Js='true';document.body.appendChild(v6);
  }
});
document.body.appendChild(cmsScript);
if(!editorPreview && ['home','about','services','portfolio','contact'].includes(document.body.dataset.page)){const runtime=document.createElement('script');runtime.src='/assets/studio4-runtime.js?v=premium-v5-1';runtime.defer=true;document.body.appendChild(runtime);}
