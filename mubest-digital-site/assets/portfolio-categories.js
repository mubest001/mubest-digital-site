/* Mubest Digital | Portfolio service categories and navigation */
export function initPortfolioCategories(projects, settings={}) {
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const slug = v => String(v ?? "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const configured = Array.isArray(settings.portfolio_service_categories) ? settings.portfolio_service_categories.filter(v => typeof v === "string" && v.trim()) : [];
  if (!configured.length) return;
  const items = Array.isArray(projects) ? projects : [];
  function assigned(item) {
    const saved = item?.details?.service_categories;
    if (Array.isArray(saved) && saved.length) return saved;
    const old = String([item?.category,item?.title,item?.details?.project_type].filter(Boolean).join(" ")).toLowerCase();
    if (/klaviyo|email|newsletter/.test(old)) return ["Email Marketing & Automation"];
    if (/shopify|ecommerce|storefront|product customiz|product personali|online store/.test(old)) return ["Shopify & Ecommerce"];
    if (/social media|instagram|pinterest|tiktok|content creat/.test(old)) return ["Social Media & Content"];
    if (/seo|search engine|paid advertising/.test(old)) return ["SEO & Digital Marketing"];
    if (/brand|identity|logo|graphic design/.test(old)) return ["Branding & Graphic Design"];
    if (/integration|automations|custom systems|api development/.test(old)) return ["Integrations & Custom Systems"];
    if (/website|web design|wordpress|webflow|wix|landing page/.test(old)) return ["Website Design & Development"];
    return [];
  }
  const counts = new Map(configured.map(name => [name,0]));
  for (const item of items) {
    for (const name of configured) {
      if (assigned(item).some(v=>v.toLowerCase()===name.toLowerCase())) counts.set(name,counts.get(name)+1);
    }
  }
  const activeCategories = configured.filter(name => counts.get(name)>0);
  const slugFor = new Map(activeCategories.map(name=>[slug(name),name]));
  const nav = document.querySelector('.site-header .nav[data-site-nav]');
  const portfolioLink = nav?.querySelector('a[href="/portfolio/"]');
  if (portfolioLink && activeCategories.length && !nav.querySelector('.md-portfolio-menu')) {
    const wrapper=document.createElement('div');
    wrapper.className='md-portfolio-menu';
    portfolioLink.parentNode.insertBefore(wrapper,portfolioLink);
    wrapper.appendChild(portfolioLink);
    const button=document.createElement('button');
    button.type='button';
    button.className='md-portfolio-menu-toggle';
    button.setAttribute('aria-label','Show portfolio service categories');
    button.setAttribute('aria-haspopup','true');
    button.setAttribute('aria-expanded','false');
    button.setAttribute('aria-controls','md-portfolio-submenu');
    button.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
    wrapper.appendChild(button);
    const menu=document.createElement('div');
    menu.id='md-portfolio-submenu';
    menu.className='md-portfolio-submenu';
    menu.setAttribute('aria-label','Portfolio categories');
    menu.innerHTML='<a class="md-portfolio-all" href="/portfolio/">All projects</a>'+activeCategories.map(name=>'<a href="/portfolio/?category='+encodeURIComponent(slug(name))+'#portfolio-projects">'+esc(name)+'<small>'+counts.get(name)+'</small></a>').join('');
    wrapper.appendChild(menu);
    const close = () => {wrapper.classList.remove('is-open');button.setAttribute('aria-expanded','false');};
    button.addEventListener('click',event=>{
      event.stopPropagation();
      const open=wrapper.classList.toggle('is-open');
      button.setAttribute('aria-expanded',String(open));
    });
    document.addEventListener('click',event=>{if(!wrapper.contains(event.target))close();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){close();button.focus();}});
    nav.addEventListener('click',event=>{
      const link=event.target.closest('.md-portfolio-submenu a');
      if(!link)return;
      close();
      nav.classList.remove('open');
      document.body.classList.remove('menu-open');
      const menuToggle=document.querySelector('[data-menu-toggle]');
      if(menuToggle)menuToggle.setAttribute('aria-expanded','false');
    });
  }
  const grid=document.querySelector('body[data-page="portfolio"] .portfolio-grid');
  if(!grid || grid.dataset.mdCategoryFilterReady==='1')return;
  grid.dataset.mdCategoryFilterReady='1';
  grid.id='portfolio-projects';
  const cards=Array.from(grid.querySelectorAll(':scope > .work-card'));
  if(!cards.length || !activeCategories.length)return;
  const toolbar=document.createElement('section');
  toolbar.className='md-portfolio-filters';
  toolbar.setAttribute('aria-label','Filter portfolio by service');
  toolbar.innerHTML=
    '<div class="md-portfolio-filter-heading"><div><span class="md-portfolio-filter-kicker">BROWSE BY SERVICE</span><h3>Find work relevant to your project.</h3></div><span class="md-portfolio-filter-count" id="mdPortfolioCount" aria-live="polite"></span></div>'+
    '<div class="md-portfolio-filter-controls"><div class="md-portfolio-filter-pills" role="group" aria-label="Portfolio service filters"><button type="button" data-md-category="" aria-pressed="true">All projects <span>'+cards.length+'</span></button>'+
    activeCategories.map(name=>'<button type="button" data-md-category="'+esc(slug(name))+'" aria-pressed="false">'+esc(name)+' <span>'+counts.get(name)+'</span></button>').join('')+'</div>'+
    '<label class="md-portfolio-select-label">Service category<select id="mdPortfolioSelect"><option value="">All projects</option>'+activeCategories.map(name=>'<option value="'+esc(slug(name))+'">'+esc(name)+'</option>').join('')+'</select></label></div>'+
    '<p class="md-portfolio-empty" id="mdPortfolioEmpty" hidden>No projects match this category. Choose another service to browse the portfolio.</p>';
  grid.parentNode.insertBefore(toolbar,grid);
  const buttons=Array.from(toolbar.querySelectorAll('[data-md-category]'));
  const select=toolbar.querySelector('#mdPortfolioSelect');
  const countEl=toolbar.querySelector('#mdPortfolioCount');
  const emptyEl=toolbar.querySelector('#mdPortfolioEmpty');
  const readSelected=()=>{
    const params=new URLSearchParams(window.location.search);
    const key=params.get('category')||'';
    return slugFor.has(key)?key:'';
  };
  function update(value,fromUser=false){
    const category=slugFor.get(value)||null;
    let shown=0;
    cards.forEach((card,index)=>{
      const visible=!category || assigned(items[index]||{}).some(s=>s.toLowerCase()===category.toLowerCase());
      card.hidden=!visible;
      card.setAttribute('aria-hidden',String(!visible));
      if(visible)shown++;
    });
    buttons.forEach(btn=>btn.setAttribute('aria-pressed',String(btn.dataset.mdCategory===value)));
    select.value=value;
    countEl.textContent=shown+' '+(shown===1?'project':'projects');
    emptyEl.hidden=shown!==0;
    if(fromUser){
      const url=new URL(location.href);
      if(value)url.searchParams.set('category',value);
      else url.searchParams.delete('category');
      history.replaceState(null,'',url.pathname+url.search+url.hash);
    }
  }
  buttons.forEach(btn=>btn.addEventListener('click',()=>update(btn.dataset.mdCategory,true)));
  select.addEventListener('change',()=>update(select.value,true));
  window.addEventListener('popstate',()=>update(readSelected()));
  update(readSelected());
}
