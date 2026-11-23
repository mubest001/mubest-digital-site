/* Mubest Digital · Content Studio 2.0. Uses the existing authenticated CMS API. */
(() => {
  'use strict';
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const icon=name=>`<svg class="ico" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const day=value=>value?new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—';
  const short=value=>String(value??'').slice(0,160);
  const displayName=value=>String(value||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
  const safeUrl=value=>{const v=String(value||'').trim();return /^https?:\/\//i.test(v)||(/^\/(?!\/)/.test(v))?v:'';};
  const toast=(message,error=false)=>{const el=$('#toast');if(!el)return;el.textContent=message;el.className='toast show'+(error?' error':'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',4000);};
  const state={view:'overview',data:{},page:'home',pageRows:[],filter:'all',search:'',media:[],editorResource:null,editorItem:null,mediaTarget:null,settings:{}};
  const titles={overview:'Overview',leads:'Enquiries',pages:'Pages',portfolio:'Portfolio',services:'Services',testimonials:'Testimonials',faqs:'FAQs',media:'Media library',branding:'Brand identity',homepage:'Homepage & hero',navigation:'Header & footer',seo:'SEO & sharing',contactsettings:'Contact & social',activity:'Activity & revisions',layout:'Visual layout builder',portfoliodesign:'Portfolio appearance',portfoliocategories:'Portfolio categories',aiassistant:'AI assistant'};
  const settingsViews=['branding','homepage','navigation','seo','contactsettings','layout','portfoliodesign','portfoliocategories','aiassistant'];
  const pageUrl={home:'/',about:'/about/',services:'/services/',portfolio:'/portfolio/',contact:'/contact/'};

  const pageGroups={
    home:[
      {title:'Hero section',description:'The first thing visitors see.',fields:[['hero_kicker','Small heading'],['hero_title','Main headline','textarea'],['hero_description','Supporting description','textarea'],['hero_primary_label','Primary button text'],['hero_primary_url','Primary button link','url'],['hero_secondary_label','Secondary button text'],['hero_secondary_url','Secondary button link','url']]},
      {title:'Video carousel · slide 2',description:'Split layout for Klaviyo and customer retention. Video must be a direct MP4 or WebM URL; upload video to Media library first.',fields:[['hero_slide_2_kicker','Slide 2 small label'],['hero_slide_2_title','Slide 2 main headline','textarea'],['hero_slide_2_description','Slide 2 description','textarea'],['hero_slide_2_video_url','Slide 2 background video URL','url'],['hero_slide_2_poster_url','Slide 2 fallback image URL','url'],['hero_slide_2_primary_label','Slide 2 primary button'],['hero_slide_2_primary_url','Slide 2 primary link','url'],['hero_slide_2_secondary_label','Slide 2 secondary button'],['hero_slide_2_secondary_url','Slide 2 secondary link','url']]},
      {title:'Video carousel · slide 3',description:'Centered layout for ecommerce and digital shopping experiences.',fields:[['hero_slide_3_kicker','Slide 3 small label'],['hero_slide_3_title','Slide 3 main headline','textarea'],['hero_slide_3_description','Slide 3 description','textarea'],['hero_slide_3_video_url','Slide 3 background video URL','url'],['hero_slide_3_poster_url','Slide 3 fallback image URL','url'],['hero_slide_3_primary_label','Slide 3 primary button'],['hero_slide_3_primary_url','Slide 3 primary link','url'],['hero_slide_3_secondary_label','Slide 3 secondary button'],['hero_slide_3_secondary_url','Slide 3 secondary link','url']]},
      {title:'Introduction',description:'Explain what Mubest Digital offers.',fields:[['intro_eyebrow','Section label'],['intro_heading','Section headline','textarea'],['intro_copy_1','First paragraph','textarea'],['intro_copy_2','Second paragraph','textarea']]},
      {title:'Services section',description:'Introduce the services shown on your homepage.',fields:[['services_eyebrow','Section label'],['services_heading','Section headline','textarea'],['services_description','Section description','textarea']]},
      {title:'Portfolio section',description:'Showcase selected projects.',fields:[['portfolio_eyebrow','Section label'],['portfolio_heading','Section headline','textarea'],['portfolio_description','Section description','textarea']]},
      {title:'Process section',description:'Describe the way you work with clients.',fields:[['process_eyebrow','Section label'],['process_heading','Section headline','textarea'],['process_description','Section description','textarea']]},
      {title:'About section',description:'Introduce the person behind the brand.',fields:[['about_eyebrow','Section label'],['about_heading','Section headline','textarea'],['about_description','Section description','textarea']]},
      {title:'Final call-to-action',description:'Encourage visitors to get in touch.',fields:[['cta_eyebrow','Section label'],['cta_heading','Section headline','textarea'],['cta_button','Button text']]}
    ],
    about:[
      {title:'Page introduction',description:'Your story starts here.',fields:[['hero_eyebrow','Small heading'],['hero_title','Page headline','textarea'],['hero_description','Introduction','textarea']]},
      {title:'Your story',description:'How you work, what you believe and why.',fields:[['intro_eyebrow','Section label'],['intro_heading','Story headline','textarea'],['intro_copy_1','Paragraph one','textarea'],['intro_copy_2','Paragraph two','textarea'],['intro_copy_3','Paragraph three','textarea']]},
      {title:'Values',description:'Explain what working with Mubest Digital feels like.',fields:[['values_eyebrow','Section label'],['values_heading','Section headline','textarea'],['values_description','Description','textarea']]}
    ]
  };
  ['services','portfolio','contact'].forEach(page=>pageGroups[page]=[
    {title:'Page introduction',description:'The headline visitors see first.',fields:[['hero_eyebrow','Small heading'],['hero_title','Page headline','textarea'],['hero_description','Description','textarea']]},
    {title:page==='contact'?'Contact form introduction':'Main content introduction',description:'Edit the main section of this page.',fields:[['section_eyebrow','Section label'],['section_heading','Section headline','textarea'],['section_description','Description','textarea']]}
  ]);
  Object.keys(pageGroups).forEach(page=>pageGroups[page].push({title:'Page SEO',description:'Control how this page appears in search results.',fields:[['seo_title','SEO page title'],['seo_description','Meta description','textarea']]}));

  const recordFields={
    portfolio:[['title','Project title'],['slug','Project URL slug'],['category','Industry / platform'],['service_categories','Service categories','category-multiselect'],['excerpt','Short summary','textarea'],['description','Project overview','textarea'],['role','Your role / contribution'],['project_type','Project type'],['year','Year (optional)'],['duration','Duration (optional)'],['services_used','Services provided (one per line)','textarea'],['skills_used','Skills / tools used (one per line)','textarea'],['deliverables','Deliverables (one per line)','textarea'],['challenge','Client challenge','textarea'],['goals','Goals','textarea'],['approach','Approach & process','textarea'],['solution','Work delivered','textarea'],['outcomes','Outcomes / results (only verified facts)','textarea'],['client_feedback','Client feedback (with permission)','textarea'],['project_highlight','Project highlight / verified takeaway','textarea'],['before_image','Before image (optional)','image'],['after_image','After image (optional)','image'],['walkthrough_video','Walkthrough video URL (optional)'],['cover_image','Cover image','image'],['gallery','Gallery images (one URL per line)','textarea'],['project_url','Optional live project URL','url'],['featured','Feature on homepage','checkbox'],['sort_order','Display order','number'],['status','Publication status','select',['draft','published','archived']]],
    services:[['title','Service name'],['slug','Anchor / URL slug'],['summary','Service card summary','textarea'],['description','Full service details','textarea'],['tag','Keywords / service tags'],['icon','Service category icon','select',['website','email','video','ecommerce','book','ads']],['deliverables','Included deliverables (one per line)','textarea'],['sort_order','Display order','number'],['status','Publication status','select',['draft','published','archived']]],
    testimonials:[['name','Client name'],['role','Job title'],['company','Company / business'],['quote','Client feedback','textarea'],['avatar_url','Portrait image','image'],['rating','Rating (1–5)','number'],['sort_order','Display order','number'],['status','Publication status','select',['draft','published','archived']]],
    faqs:[['question','Question','textarea'],['answer','Answer','textarea'],['sort_order','Display order','number'],['status','Publication status','select',['draft','published','archived']]]
  };

  // These keys are persisted to Neon site_settings, then read by public-content.
  const settingGroups={
    aiassistant:{
      intro:'Give website visitors natural, helpful conversations about Mubest Digital using approved public knowledge and an OpenAI model.',
      groups:[
        {title:'Visitor experience',description:'Choose the name and welcome message. The floating chat assistant becomes visible when it is enabled and the OpenAI connection is configured.',fields:[
          ['ai_assistant_enabled','Enable the public AI assistant','checkbox'],
          ['ai_assistant_name','Assistant name'],
          ['ai_assistant_welcome','Welcome message','textarea']
        ]},
        {title:'About you · approved public profile',description:'Tell the assistant only the professional details you want clients to know. Never add private messages, passwords, personal addresses, or confidential client data.',fields:[
          ['ai_assistant_public_bio','Your public professional story, experience and approach','textarea']
        ]},
        {title:'Additional approved answers',description:'Optional extra facts, policies, work process or frequently asked questions. Use one fact or question/answer per line. The assistant also reads published services, portfolio projects, About content and FAQs automatically.',fields:[
          ['ai_assistant_approved_facts','Approved public details and answers','textarea']
        ]}
      ]
    },
    portfoliocategories:{intro:'Organize your portfolio by service. These categories appear in the website Portfolio dropdown and on the portfolio page.',groups:[
      {title:'Service categories',description:'Enter one service category per line. Use clear names clients will recognize. Assign categories to projects in Portfolio → Edit project.',fields:[['portfolio_service_categories','Category names (one per line)','textarea']]}
    ]},
    portfoliodesign:{intro:'Control your portfolio layout and choose a modern motion style. Preview each hover effect before publishing.',groups:[
      {title:'Portfolio grid layout',description:'Choose the number of projects in each row. Desktop defaults to three, tablet to two, and mobile to one.',fields:[
        ['portfolio_columns_desktop','Projects per row · desktop','select',['1','2','3','4','5']],
        ['portfolio_home_columns','Homepage featured projects per row','select',['1','2','3','4']],
        ['portfolio_columns_tablet','Projects per row · tablet','select',['1','2','3']],
        ['portfolio_columns_mobile','Projects per row · mobile','select',['1','2']],
        ['portfolio_gap','Space between cards (px)','select',['12','18','24','30']]
      ]},
      {title:'Hover animation library',description:'Move your cursor over the preview cards to try a motion style. Works on keyboard focus too.',fields:[
        ['portfolio_hover_animation','Hover style','select',['Lift','Zoom','Tilt','Glow','Sheen','Reveal','Spotlight','Parallax','Border','Float','None']],
        ['portfolio_motion_speed','Animation speed','select',['Fast','Balanced','Slow']]
      ]},
      {title:'Scroll entrance effect',description:'A subtle entrance animation when projects appear. Reduced-motion visitors see a static layout.',fields:[
        ['portfolio_scroll_animation','Entrance style','select',['Fade up','Scale in','Stagger','None']]
      ]}
    ]},
    branding:{intro:'Your identity, consistent across the website.',groups:[
      {title:'Your brand',description:'Your official logo and personal photography.',fields:[['site_name','Business name'],['logo_url','Full horizontal logo','image'],['favicon_url','Icon-only favicon','image'],['about_image_url','About / profile photograph','image']]},
      {title:'Brand colour system',description:'Update the colour palette while keeping the site design.',fields:[['color_ink','Midnight / dark colour','color'],['color_blue','Primary brand colour','color'],['color_lime','Accent colour','color'],['color_paper','Background colour','color']]},
      {title:'Typography',description:'Select the fonts for your website.',fields:[['font_heading','Headings','select',['Manrope','Inter','DM Sans','Montserrat','Poppins']],['font_body','Body text','select',['Inter','DM Sans','Manrope','Arial','Montserrat']]]}
    ]},
    homepage:{intro:'Set your hero video, featured sections and visitor experience.',groups:[
      {title:'Video carousel · slide 1',description:'First slide video and image. Edit all three slide headlines and slide 2/3 video URLs in Page Editor → Home.',fields:[['hero_video_enabled','Show background video','checkbox'],['hero_video_url','Background video (MP4 URL)','image'],['hero_poster_url','Fallback poster image','image']]},
      {title:'Your availability',description:'An optional status indicator in the homepage hero.',fields:[['availability_enabled','Show availability indicator','checkbox'],['availability_text','Status message']]},
      {title:'Homepage sections',description:'Switch sections on or off without deleting content.',fields:[['show_home_services','Show services section','checkbox'],['show_home_work','Show featured portfolio','checkbox'],['show_home_process','Show process section','checkbox'],['show_home_about','Show about preview','checkbox'],['show_home_faq','Show frequently asked questions','checkbox'],['show_home_testimonials','Show testimonials','checkbox'],['show_home_cta','Show closing call-to-action','checkbox']]}
    ]},
    navigation:{intro:'Manage important header and footer text from one place.',groups:[
      {title:'Header navigation',description:'Rename menu labels and customize the header call-to-action.',fields:[['nav_home_label','Home label'],['nav_about_label','About label'],['nav_services_label','Services label'],['nav_portfolio_label','Portfolio label'],['nav_contact_label','Contact label'],['header_cta_label','Header button text'],['header_cta_url','Header button link','url']]},
      {title:'Announcement bar',description:'Show a small optional message above your header.',fields:[['announcement_enabled','Enable announcement bar','checkbox'],['announcement_text','Announcement message','textarea'],['announcement_link_label','Link text'],['announcement_url','Link URL','url']]},
      {title:'Footer content',description:'Keep the closing message fresh and relevant.',fields:[['footer_tagline','Brand description','textarea'],['footer_note','Bottom footer note'],['footer_cta_label','Contact link label']]}
    ]},
    seo:{intro:'Control search snippets and your social-sharing thumbnail.',groups:[
      {title:'Default SEO metadata',description:'Used when a page has no individual SEO override.',fields:[['seo_title','Default website title'],['seo_description','Default meta description','textarea'],['seo_image_url','Social sharing image (OG)','image']]}
    ]},
    contactsettings:{intro:'Make it easy for people to contact you and find your profiles.',groups:[
      {title:'Contact details',description:'Used on your public Contact page.',fields:[['contact_email','Business email','email'],['phone','Phone number'],['whatsapp','WhatsApp URL or phone number'],['location','Service area / location']]},
      {title:'Social profiles',description:'Add your profile URLs. Your website will show platform logos automatically; blank links stay hidden. WhatsApp uses the number or URL in Contact details.',fields:[['social_instagram','Instagram link','url'],['social_linkedin','LinkedIn link','url'],['social_facebook','Facebook link','url'],['social_tiktok','TikTok link','url'],['social_youtube','YouTube channel link','url'],['social_x','X / Twitter profile link','url'],['social_pinterest','Pinterest profile link','url']]}
    ]}
  };

  async function request(url,options={}){
    const res=await fetch(url,{cache:'no-store',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(body.error||`Request failed (${res.status}).`);
    return body;
  }
  const get=async resource=>(await request(`/api/admin?resource=${encodeURIComponent(resource)}`)).data;
  const post=async(resource,action,params={})=>(await request('/api/admin',{method:'POST',body:JSON.stringify({resource,action,...params})})).data;

  function authMode(configured){
    $('#loginForm').hidden=!configured;$('#setupForm').hidden=configured;
    $('#authTitle').textContent=configured?'Welcome back.':'Set up your studio.';
    $('#authSubtitle').textContent=configured?'Sign in to manage your website, content and brand.':'Create the administrator account for Mubest Digital.';
  }
  function showAuthError(message){const el=$('#authMessage');el.textContent=message;}
  async function checkAuth(){
    try{
      const status=await request('/api/auth?action=status');
      if(status.authenticated){showApp(status.email);return;}
      $('#authScreen').hidden=false;$('#adminApp').hidden=true;authMode(status.configured);
    }catch(error){$('#authScreen').hidden=false;$('#adminApp').hidden=true;authMode(true);showAuthError(error.message);}
  }
  function showApp(email){
    $('#authScreen').hidden=true;$('#adminApp').hidden=false;$('#adminEmail').textContent=email||'Administrator';
    loadView('overview');
    get('settings').then(s=>{state.settings=s;applyAdminBrand(s);}).catch(()=>{});
  }
  function applyAdminBrand(s){
    if(!s)return;
    if(s.logo_url&&safeUrl(s.logo_url))$$('[data-brand-logo]').forEach(img=>img.src=safeUrl(s.logo_url));
    const favicon=document.querySelector('link[rel~="icon"]');if(favicon&&safeUrl(s.favicon_url))favicon.href=safeUrl(s.favicon_url);
  }
  $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();try{const data=Object.fromEntries(new FormData(e.currentTarget));const result=await request('/api/auth',{method:'POST',body:JSON.stringify({action:'login',...data})});showApp(result.email);}catch(error){showAuthError(error.message);}});
  $('#setupForm').addEventListener('submit',async e=>{e.preventDefault();try{const data=Object.fromEntries(new FormData(e.currentTarget));const result=await request('/api/auth',{method:'POST',body:JSON.stringify({action:'setup',...data})});showApp(result.email);}catch(error){showAuthError(error.message);}});
  $('#logoutButton').addEventListener('click',async()=>{try{await request('/api/auth',{method:'POST',body:JSON.stringify({action:'logout'})});location.reload();}catch(e){toast(e.message,true);}});
  const closeSidebar=()=>{$('#sidebar').classList.remove('open');$('#sidebarScrim').hidden=true;};
  $('#mobileMenu').addEventListener('click',()=>{const open=$('#sidebar').classList.toggle('open');$('#sidebarScrim').hidden=!open;});
  $('#sidebarScrim').addEventListener('click',closeSidebar);
  $$('.sidebar-nav [data-view]').forEach(button=>button.addEventListener('click',()=>{loadView(button.dataset.view);closeSidebar();}));
  $('#quickAddButton').addEventListener('click',()=>{$('#quickAddMenu').hidden=!$('#quickAddMenu').hidden;});
  document.addEventListener('click',event=>{if(!event.target.closest('#quickAddButton,#quickAddMenu'))$('#quickAddMenu').hidden=true;});
  $$('#quickAddMenu [data-create]').forEach(button=>button.addEventListener('click',()=>{const resource=button.dataset.create;$('#quickAddMenu').hidden=true;if(resource==='media')loadView('media').then(()=>$('#mediaUpload')?.click());else openEditor(resource,null);}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeSidebar();$('#quickAddMenu').hidden=true;}});

  async function loadView(view){
    state.view=view;
    state.filter='all';state.search='';
    $('#viewTitle').textContent=titles[view]||view;
    $('#sectionBreadcrumb').textContent=(titles[view]||view).toUpperCase();
    $$('.sidebar-nav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    $('#adminPanel').innerHTML='<div class="loading-state">Loading content…</div>';
    try{
      const resource=settingsViews.includes(view)?'settings':view;
      state.data=await get(resource);
      if(view==='portfolio' && !Array.isArray(state.settings.portfolio_service_categories)){
        const saved=await get('settings');
        state.settings={...state.settings,...saved};
      }
      if(resource==='settings'){state.settings=state.data;applyAdminBrand(state.settings);}
      renderView();
      if(view==='overview'){
        const c=state.data.counts||{};
        const badge=$('#leadBadge');if(badge)badge.style.display=c.new_leads?'block':'none';
      }
    }catch(error){
      $('#adminPanel').innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;
      if(/sign in|unauthorized|session/i.test(error.message))checkAuth();
    }
  }
  function heading(title,description,action='',kicker='CONTENT STUDIO'){
    return `<div class="panel-heading"><div><span class="section-kicker">${esc(kicker)}</span><h2>${esc(title)}</h2><p>${esc(description)}</p></div>${action?`<div class="panel-actions">${action}</div>`:''}</div>`;
  }
  const statusPill=status=>`<span class="status-pill ${esc(status||'draft')}">${esc(displayName(status||'draft'))}</span>`;
  function renderView(){
    const panel=$('#adminPanel');
    if(state.view==='overview')return renderOverview(panel,state.data);
    if(['portfolio','services','testimonials','faqs'].includes(state.view))return renderCollection(panel,state.view,state.data);
    if(state.view==='pages')return renderPages(panel,state.data);
    if(state.view==='layout')return renderLayoutBuilder(panel);
    if(settingsViews.includes(state.view))return renderSettings(panel,state.data,state.view);
    if(state.view==='media')return renderMedia(panel,state.data);
    if(state.view==='leads')return renderLeads(panel,state.data);
    if(state.view==='activity')return renderActivity(panel,state.data);
  }
  function renderOverview(panel,data){
    const c=data.counts||{}, recent=data.recent||[], recentActions=data.activity||[];
    const stats=[
      {label:'Published projects',value:c.portfolio??0,sub:'Live in your portfolio',icon:'briefcase',tone:'blue'},
      {label:'Active services',value:c.services??0,sub:'Available to visitors',icon:'services',tone:'lime'},
      {label:'New enquiries',value:c.new_leads??0,sub:'Waiting for your reply',icon:'mail',tone:'peach'},
      {label:'Content drafts',value:c.drafts??0,sub:'Portfolio projects in draft',icon:'pages',tone:'rose'}
    ];
    panel.innerHTML=`<section class="welcome-panel"><div class="welcome-content"><div class="welcome-kicker">YOUR DIGITAL WORKSPACE</div><h2>Make your next update <span>effortless.</span></h2><p>Welcome to Mubest Digital Content Studio. Keep every page, project and detail fresh from one beautifully organized place.</p><div class="welcome-actions"><button class="w-primary" data-go="pages">${icon('edit')} Edit a page</button><button class="w-secondary" data-overview-add="portfolio">${icon('plus')} Add a project</button></div></div><div class="welcome-panel-logo"><img src="/assets/favicon.svg" alt="" aria-hidden="true"></div></section>`+
      `<div class="stats-grid">${stats.map(item=>`<div class="stat-card" data-tone="${item.tone}"><div class="stat-head"><small>${item.label}</small><span class="stat-icon">${icon(item.icon)}</span></div><strong>${item.value}</strong><span class="stat-note">${item.sub}</span></div>`).join('')}</div>`+
      `<div class="dashboard-grid"><div class="dashboard-main"><div class="panel-card"><div class="panel-card-header"><div><h3>Latest enquiries</h3><p>Recent conversations started through your site.</p></div><a href="#" data-go="leads">View all ${icon('arrow')}</a></div>`+
      (recent.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Contact</th><th>Interested in</th><th>Status</th><th>Date</th></tr></thead><tbody>${recent.map(r=>`<tr><td><span class="table-title">${esc(r.name)}</span><span class="table-sub">${esc(r.email)}</span></td><td>${esc(r.service||'General enquiry')}</td><td>${statusPill(r.status)}</td><td>${day(r.created_at)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state">No enquiries yet. When someone contacts you, their message will appear here.</div>`)+`</div>`+
      `<div class="panel-card overview-bottom"><div class="panel-card-header"><div><h3>Recent changes</h3><p>A brief history of what's been updated.</p></div><a href="#" data-go="activity">Activity log ${icon('arrow')}</a></div>`+
      (recentActions.length?`<div class="table-wrap"><table class="admin-table"><tbody>${recentActions.map(x=>`<tr><td><span class="table-title">${esc(x.summary||displayName(x.action))}</span><span class="table-sub">${esc(displayName(x.entity_type))}</span></td><td>${day(x.created_at)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state">Your recent editing activity will appear here.</div>`)+`</div></div>`+
      `<div class="dashboard-side"><div class="panel-card"><div class="panel-card-header"><div><h3>Quick actions</h3><p>The tasks you'll do most often.</p></div></div><div class="task-list">`+
      [{t:'Manage portfolio',d:'Add projects and new case studies',v:'portfolio',i:'briefcase'},{t:'Edit homepage',d:'Rewrite headings and text',v:'pages',i:'pages'},{t:'Update brand identity',d:'Logo, colours and typography',v:'branding',i:'palette'},{t:'Change hero video',d:'Set a video and poster image',v:'homepage',i:'video'},{t:'Upload media',d:'Organize photos and site assets',v:'media',i:'image'}].map(item=>`<button class="task-item" data-go="${item.v}"><span class="task-icon">${icon(item.i)}</span><span class="task-copy"><strong>${item.t}</strong><small>${item.d}</small></span>${icon('arrow-right').replace('class="ico"','class="next-icon"')}</button>`).join('')+
      `</div></div><div class="notice-panel"><strong>Publish content without redeploying.</strong><p>Your content changes are saved in Neon and reflected on the website. GitHub and Vercel are only needed when you change the actual site code or add new features.</p><button data-go="pages">Open page editor ${icon('arrow-right')}</button></div></div></div>`;
    $$('[data-go]',panel).forEach(el=>el.addEventListener('click',e=>{e.preventDefault();loadView(el.dataset.go);}));
    $$('[data-overview-add]',panel).forEach(el=>el.addEventListener('click',()=>openEditor(el.dataset.overviewAdd,null)));
  }

  function renderCollection(panel,resource,items){
    const config={
      portfolio:['Portfolio projects','Update the projects you are proud to share with potential clients.','Add project','briefcase'],
      services:['Your services','Edit descriptions, deliverables and the services your visitors can book.','Add service','services'],
      testimonials:['Client testimonials','Showcase verified client feedback that you have permission to publish.','Add testimonial','star'],
      faqs:['Frequently asked questions','Help visitors find answers before they contact you.','Add question','help']
    }[resource];
    const list=Array.isArray(items)?items:[];
    const filters=['all','published','draft','archived'];
    const categories=resource==='portfolio'&&Array.isArray(state.settings.portfolio_service_categories)?state.settings.portfolio_service_categories:[];
    panel.innerHTML=heading(config[0],config[1],`<button class="admin-button primary" id="addRecord">${icon('plus')} ${config[2]}</button>`)+
      (resource==='portfolio'?`<div class="md-portfolio-manage-link"><button type="button" class="admin-button ghost" id="managePortfolioCategories">${icon('grid')} Manage service categories</button></div>`:'')+
      `<div class="collection-toolbar"><div class="toolbar-left"><div class="search-field">${icon('search')}<input id="collectionSearch" type="search" placeholder="Search ${resource}..." aria-label="Search content"></div><select class="filter-select" id="collectionStatus" aria-label="Filter by status">${filters.map(f=>`<option value="${f}">${f==='all'?'All statuses':displayName(f)}</option>`).join('')}</select>${resource==='portfolio'?'<select class="filter-select" id="collectionCategory" aria-label="Filter projects by service category"><option value="">All service categories</option>'+categories.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')+'</select>':''}</div><span id="collectionCount" class="toolbar-count">${list.length} items</span></div>`+
      `<div id="collectionResults" class="panel-card" style="padding:8px 18px 17px"></div>`;
    $('#addRecord',panel).addEventListener('click',()=>openEditor(resource,null));
    $('#managePortfolioCategories',panel)?.addEventListener('click',()=>loadView('portfoliocategories'));
    const input=$('#collectionSearch',panel), select=$('#collectionStatus',panel), categorySelect=$('#collectionCategory',panel);
    function refresh(){
      const term=input.value.trim().toLowerCase(),filter=select.value;
      const filtered=list.filter(x=>(filter==='all'||x.status===filter)&&(!categorySelect||!categorySelect.value||(x.details?.service_categories||[]).includes(categorySelect.value))&&[x.title,x.name,x.question,x.category,x.summary,x.excerpt,x.company,x.tag,x.slug,...(x.details?.service_categories||[])].join(' ').toLowerCase().includes(term));
      $('#collectionCount',panel).textContent=`${filtered.length} of ${list.length} items`;
      $('#collectionResults',panel).innerHTML=filtered.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Content</th><th>${resource==='portfolio'?'Description':resource==='services'?'Deliverables':'Details'}</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>${filtered.map(item=>{
        const title=item.title||item.name||item.question;
        const sub=resource==='portfolio'?[...(item.details?.service_categories||[]),item.category].filter(Boolean).join(' · '):(item.category||item.company||item.slug||item.role||'');
        const detail=item.excerpt||item.summary||item.quote||item.answer||'';
        const thumb=resource==='portfolio'?`<span class="project-row-thumb">${safeUrl(item.cover_image)?`<img src="${esc(safeUrl(item.cover_image))}" alt="" loading="lazy">`:esc(String(title||'M')[0])}</span>`:'';
        return `<tr><td><div class="content-identity">${thumb}<span><span class="table-title">${esc(short(title))}</span><span class="table-sub">${esc(short(sub))}</span></span></div></td><td><span class="table-sub">${esc(String(detail).slice(0,130))}</span></td><td>${statusPill(item.status)}</td><td>${esc(item.sort_order??'—')}</td><td><div class="row-actions">${resource==='portfolio'?`<a class="text-button" href="/portfolio/project/?slug=${encodeURIComponent(item.slug||'')}" target="_blank" rel="noopener noreferrer">View case study ↗</a>`:''}<button class="text-button" data-edit="${item.id}">${icon('edit')} Edit</button><button class="text-button delete" data-delete="${item.id}">Delete</button></div></td></tr>`;
      }).join('')}</tbody></table></div>`:`<div class="empty-state">Nothing matches your search or status filter.</div>`;
      $$('[data-edit]',panel).forEach(b=>b.addEventListener('click',()=>openEditor(resource,list.find(x=>String(x.id)===b.dataset.edit))));
      $$('[data-delete]',panel).forEach(b=>b.addEventListener('click',()=>deleteItem(resource,b.dataset.delete)));
    }
    input.addEventListener('input',refresh);select.addEventListener('change',refresh);categorySelect?.addEventListener('change',refresh);refresh();
  }

  function fieldHtml(field,value){
    const [name,label,type='text',options]=field;
    const raw=Array.isArray(value)?value.join('\n'):value??'';
    if(type==='category-multiselect'){
      const assigned=Array.isArray(value)?value:[];
      const configured=Array.isArray(state.settings.portfolio_service_categories)?state.settings.portfolio_service_categories:[];
      const options=[...new Set([...configured,...assigned])];
      const choices=options.map(name=>`<label class="md-service-category-choice"><input type="checkbox" name="service_categories" value="${esc(name)}" ${assigned.includes(name)?'checked':''}><span>${esc(name)}</span></label>`).join('');
      return `<div class="editor-field full md-service-category-field"><label>Service categories</label><p>Select one or more services for this project. These control the portfolio filters and dropdown navigation.</p><div class="md-service-category-choices">${choices||'<span>No categories configured. Add them under Portfolio categories in the sidebar.</span>'}</div><small>Edit the list in Content Studio → Portfolio categories.</small></div>`;
    }
    if(type==='textarea')return `<div class="editor-field full"><label for="field-${esc(name)}">${esc(label)}</label><textarea id="field-${esc(name)}" name="${esc(name)}" rows="4" placeholder="Write here...">${esc(raw)}</textarea></div>`;
    if(type==='checkbox')return `<div class="editor-field full"><label class="check-field"><input type="checkbox" name="${esc(name)}" ${raw===true||raw==='true'?'checked':''}> <span>${esc(label)}</span></label></div>`;
    if(type==='select')return `<div class="editor-field"><label for="field-${esc(name)}">${esc(label)}</label><select id="field-${esc(name)}" name="${esc(name)}">${options.map(o=>`<option value="${esc(o)}" ${String(raw)===o?'selected':''}>${esc(displayName(o))}</option>`).join('')}</select></div>`;
    if(type==='image')return `<div class="editor-field full"><label for="field-${esc(name)}">${esc(label)}</label><div class="image-input-row"><input id="field-${esc(name)}" name="${esc(name)}" value="${esc(raw)}" placeholder="Choose an existing media file or paste a URL"><button type="button" class="admin-button ghost" data-pick-image="${esc(name)}">${icon('image')} Choose media</button></div></div>`;
    return `<div class="editor-field"><label for="field-${esc(name)}">${esc(label)}</label><input id="field-${esc(name)}" name="${esc(name)}" type="${type==='number'?'number':type==='url'?'text':type==='email'?'email':'text'}" value="${esc(raw)}" ${type==='url'?'placeholder="https://... or /contact/"':''}></div>`;
  }
  function openEditor(resource,item){
    const fields=recordFields[resource];if(!fields){toast('This content type is not editable here.',true);return;}
    state.editorResource=resource;state.editorItem=item;
    $('#editorTitle').textContent=(item?'Edit ':'Add ')+({portfolio:'portfolio project',services:'service',testimonials:'testimonial',faqs:'FAQ'}[resource]);
    $('#editorFields').innerHTML=`<div class="editor-grid">${fields.map(f=>fieldHtml(f,item?.[f[0]]??item?.details?.[f[0]])).join('')}</div>`;
    const form=$('#editorForm');form.dataset.resource=resource;form.dataset.id=item?.id||'';
    $$('[data-pick-image]',form).forEach(b=>b.addEventListener('click',()=>openMediaPicker(b.dataset.pickImage,form)));
    const title=form.elements.title,slug=form.elements.slug;
    if(title&&slug&&!item?.slug)title.addEventListener('input',()=>{slug.value=title.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');});
    $('#editorDialog').showModal();
  }
  $('#editorForm').addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget,resource=form.dataset.resource,fields=recordFields[resource];
    const data={id:form.dataset.id||undefined};
    fields.forEach(f=>{const [key,,type='text']=f,el=form.elements[key];if(type==='category-multiselect'){data[key]=$$('input[name="service_categories"]:checked',form).map(el=>el.value);return;}if(!el)return;data[key]=type==='checkbox'?el.checked:type==='number'?Number(el.value||0):['gallery','deliverables','services_used','skills_used'].includes(key)?el.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean):el.value;});
    if(resource==='portfolio'){
      const extra=['role','project_type','year','duration','services_used','skills_used','deliverables','service_categories','challenge','goals','approach','solution','outcomes','client_feedback','project_highlight','before_image','after_image','walkthrough_video'];
      data.details=Object.fromEntries(extra.map(k=>[k,data[k]]));extra.forEach(k=>delete data[k]);
    }
    const button=form.querySelector('[type="submit"]');button.disabled=true;
    try{await post(resource,'save',{data});$('#editorDialog').close();toast('Saved successfully.');if(state.view===resource)await loadView(resource);else await loadView('overview');}
    catch(error){toast(error.message,true);}finally{button.disabled=false;}
  });
  $$('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>$('#editorDialog').close()));
  async function deleteItem(resource,id){
    if(!confirm('Delete this item? Its previous version will be kept in revision history.'))return;
    try{await post(resource,'delete',{id});toast('Item deleted.');await loadView(resource);}catch(e){toast(e.message,true);}
  }

  function renderPages(panel,rows){
    state.pageRows=rows||[];
    const row=rows.find(x=>x.slug===state.page)||{};
    const content=row.draft||row.published||{};
    panel.innerHTML=heading('Edit website pages','Choose a page, update its content, save a private draft or publish directly to your live site.',`<a class="admin-button ghost" href="${pageUrl[state.page]}" target="_blank" rel="noopener noreferrer">${icon('eye')} Open live page</a>`)+
      `<div class="page-tabs">${Object.keys(pageGroups).map(k=>`<button class="page-tab ${state.page===k?'active':''}" data-page="${k}">${displayName(k)}</button>`).join('')}</div>`+
      `<div class="editor-layout"><div class="editor-main"><form id="pageForm">`+
      pageGroups[state.page].map((group,i)=>`<section class="editor-section"><div class="editor-section-head"><span class="section-number">${String(i+1).padStart(2,'0')}</span><div><h3>${group.title}</h3><small>${group.description}</small></div></div><div class="editor-grid">${group.fields.map(f=>fieldHtml(f,content[f[0]])).join('')}</div></section>`).join('')+
      `<div class="form-footer"><small>Save a draft to keep changes private, or publish to update the live page.</small><button type="button" class="admin-button ghost" id="saveDraft">Save draft</button><button type="submit" class="admin-button primary">${icon('check')} Publish changes</button></div></form></div>`+
      `<aside class="editor-aside"><div class="preview-card"><div class="preview-head"><span>CONTENT PREVIEW</span><small>${statusPill(row.status||'published')}</small></div><div class="preview-browser-bar"><i></i><i></i><i></i></div><div class="preview-stage"><span class="mini-eyebrow" id="miniEyebrow"></span><h3 id="miniTitle"></h3><p id="miniDescription"></p><span class="fake-button">${esc(content.hero_primary_label||'Explore')} ↗</span></div><div class="preview-meta">A simplified text preview (not a pixel-perfect website view).<br><a href="${pageUrl[state.page]}" target="_blank" rel="noopener noreferrer">View published page ↗</a></div></div><div class="helper-note" style="margin-top:17px"><strong>Changes without redeploying</strong><br>Saved drafts stay private. Publishing refreshes the page content for visitors without a new Vercel build.</div></aside></div>`;
    $$('[data-page]',panel).forEach(b=>b.addEventListener('click',()=>{state.page=b.dataset.page;renderPages(panel,rows);}));
    const form=$('#pageForm',panel);
    function preview(){
      const values=Object.fromEntries(new FormData(form).entries());
      $('#miniEyebrow',panel).textContent=values.hero_kicker||values.hero_eyebrow||'MUBEST DIGITAL';
      $('#miniTitle',panel).textContent=values.hero_title||'Your website heading';
      $('#miniDescription',panel).textContent=values.hero_description||'Description text will appear here.';
    }
    form.addEventListener('input',preview);preview();
    const collect=()=>Object.fromEntries(new FormData(form).entries());
    $('#saveDraft',panel).addEventListener('click',async()=>{try{await post('pages','save',{data:{slug:state.page,content:collect()}});toast('Page draft saved. Your live page is unchanged.');await loadView('pages');}catch(error){toast(error.message,true);}});
    form.addEventListener('submit',async e=>{e.preventDefault();if(!confirm(`Publish your ${state.page} page changes now?`))return;try{await post('pages','publish',{data:{slug:state.page,content:collect()}});toast('Page published successfully.');await loadView('pages');}catch(error){toast(error.message,true);}});
  }

  // Checkbox fields are always included, even when unchecked, so hiding a
  // section is actually saved as false rather than silently skipped.
  // The Visual Layout Builder publishes a structured page layout to Neon.
  // Native drag/drop is complemented by arrow buttons for touch and keyboard access.
  const BUILTIN_LAYOUTS = {
    home:[['home_hero','Three-video hero'],['home_marquee','Services ticker'],['home_intro','Introduction'],['home_services','Services'],['home_portfolio','Featured work'],['home_process','How I work'],['home_about','About preview'],['home_faq','FAQs'],['home_reviews','Client reviews'],['home_cta','Final call-to-action']],
    about:[['about_hero','Page header'],['about_story','Story & introduction'],['about_values','Values'],['about_process','Process'],['about_cta','Contact call-to-action']],
    services:[['services_hero','Page header'],['services_list','Service list'],['services_cta','Contact call-to-action']],
    portfolio:[['portfolio_hero','Page header'],['portfolio_grid','Portfolio cards'],['portfolio_cta','Contact call-to-action']],
    contact:[['contact_hero','Page header'],['contact_form','Contact form'],['contact_cta','Final call-to-action']]
  };
  const SECTION_TYPES={text:'Text section',image_text:'Image & text',reviews:'Client reviews',faq:'FAQs',stats:'Highlights / figures',cta:'Call-to-action',gallery:'Image gallery'};
  const DEFAULT_SECTIONS={
    text:{title:'New section',kicker:'More about my work',body:''},
    image_text:{title:'Your section headline',kicker:'A closer look',body:'',image_url:''},
    reviews:{title:'Words from clients',kicker:'Testimonials'},
    faq:{title:'Frequently asked questions',kicker:'Helpful answers'},
    stats:{title:'The details that matter',kicker:'Highlights',items:''},
    cta:{title:'Ready to start?',kicker:'Let’s talk',button_label:'Start a project',button_url:'/contact/'},
    gallery:{title:'Project gallery',kicker:'A closer look',items:''}
  };
  let builderPage='home';
  let builderDraft={};
  let builderEditing=null;
  function layoutItemsForPage(page){
    if(!builderDraft[page]){
      const saved=state.settings?.layout_sections?.[page];
      builderDraft[page]=(Array.isArray(saved)?saved:BUILTIN_LAYOUTS[page].map(([id,title])=>({id,kind:'builtin',title,visible:true,layout:'default'}))).map(x=>({...x}));
    }
    return builderDraft[page];
  }
  function layoutField(item,key){return esc(String(item[key]??''));}
  function renderLayoutBuilder(panel){
    const items=layoutItemsForPage(builderPage);
    const name=displayName(builderPage);
    panel.innerHTML=heading('Visual layout builder','Drag, move, hide and add website sections. Save changes to publish the new layout without a deployment.',`<a class="admin-button ghost" href="${pageUrl[builderPage]}" target="_blank" rel="noopener noreferrer">${icon('eye')} View live page</a>`)+
      `<div class="builder-banner"><strong>Design freedom, without touching code.</strong><p>Move whole website sections and choose their layout. Add content, real client reviews, FAQs, image sections or calls to action. Your main navigation and footer remain safely fixed.</p></div>`+
      `<div class="page-tabs">${Object.keys(BUILTIN_LAYOUTS).map(p=>`<button type="button" class="page-tab ${p===builderPage?'active':''}" data-layout-page="${p}">${displayName(p)}</button>`).join('')}</div>`+
      `<div class="builder-toolbar"><div><h3>${esc(name)} page sections</h3><p>Drag by the handle or use the arrows. Edit a section to change its arrangement and content.</p></div><div class="builder-actions"><select id="builderKind" aria-label="Choose section type">${Object.entries(SECTION_TYPES).map(([key,label])=>`<option value="${key}">${esc(label)}</option>`).join('')}</select><button class="admin-button ghost" id="builderAdd">${icon('plus')} Add section</button></div></div>`+
      `<div class="builder-list" id="builderList" aria-label="Reorder website sections">${items.map((item,index)=>{
        const builtin=item.kind==='builtin'; const editing=builderEditing===item.id;
        return `<article class="builder-row ${editing?'is-editing':''} ${item.visible===false?'is-hidden':''}" data-builder-id="${esc(item.id)}" draggable="true"><div class="builder-row-header"><span class="builder-grip" aria-hidden="true" title="Drag section">⠿</span><span class="builder-index">${String(index+1).padStart(2,'0')}</span><div class="builder-row-copy"><strong>${esc(item.title||SECTION_TYPES[item.kind]||'Section')}</strong><small>${builtin?'Existing website section':SECTION_TYPES[item.kind]||'Custom section'} · ${item.visible===false?'Hidden':'Visible'} · ${esc(item.layout||'default')} layout</small></div><label class="builder-switch"><input type="checkbox" data-builder-field="visible" ${item.visible!==false?'checked':''}><span>Show</span></label><div class="builder-row-actions"><button type="button" data-builder-shift="-1" aria-label="Move section up" ${index===0?'disabled':''}>↑</button><button type="button" data-builder-shift="1" aria-label="Move section down" ${index===items.length-1?'disabled':''}>↓</button><button type="button" data-builder-edit aria-expanded="${editing}">${editing?'Close':'Edit'}</button>${builtin?'':`<button type="button" class="builder-danger" data-builder-remove aria-label="Remove this section">×</button>`}</div></div>`+
        (editing?`<div class="builder-edit-grid"><label>Position and alignment<select data-builder-field="layout">${['default','left','right','center','wide'].map(x=>`<option value="${x}" ${(item.layout||'default')===x?'selected':''}>${displayName(x)}</option>`).join('')}</select></label>`+
        (builtin?`<p class="builder-hint">Edit this section’s content in <strong>Pages</strong> or its relevant dashboard section. Change its position, alignment or visibility here.</p>`:
        `<label>Small heading<input data-builder-field="kicker" value="${layoutField(item,'kicker')}" placeholder="Section eyebrow"></label><label class="builder-full">Section heading<input data-builder-field="title" value="${layoutField(item,'title')}" placeholder="A compelling heading"></label><label class="builder-full">Body text<textarea data-builder-field="body" rows="4" placeholder="Tell your story clearly">${layoutField(item,'body')}</textarea></label>`+
        (['image_text','gallery'].includes(item.kind)?`<label class="builder-full">${item.kind==='gallery'?'Use the list below for image URLs':'Image URL'}<input data-builder-field="image_url" value="${layoutField(item,'image_url')}" placeholder="https://... or /assets/..."></label>`:'')+
        (['stats','gallery'].includes(item.kind)?`<label class="builder-full">${item.kind==='stats'?'One highlight per line: Value | Label':'One image URL per line'}<textarea data-builder-field="items" rows="5">${layoutField(item,'items')}</textarea></label>`:'')+
        (['cta','image_text','text'].includes(item.kind)?`<label>Button label (optional)<input data-builder-field="button_label" value="${layoutField(item,'button_label')}" placeholder="Learn more"></label><label>Button URL (optional)<input data-builder-field="button_url" value="${layoutField(item,'button_url')}" placeholder="/contact/"></label>`:'')+
        (['reviews','faq'].includes(item.kind)?`<p class="builder-hint">This section automatically uses <strong>${item.kind==='reviews'?'published Testimonials':'published FAQs'}</strong> from your dashboard. Add real content there before publishing.</p>`:''))+
        `</div>`:'')+`</article>`;
      }).join('')}</div>`+
      `<div class="builder-footer"><div><strong>${items.filter(x=>x.visible!==false).length} visible</strong><p>Your changes remain private until you publish this page layout.</p></div><button class="admin-button ghost" id="builderReset">Reset this page</button><button class="admin-button primary" id="builderSave">${icon('check')} Publish layout</button></div>`;
    $$('[data-layout-page]',panel).forEach(b=>b.addEventListener('click',()=>{builderPage=b.dataset.layoutPage;builderEditing=null;renderLayoutBuilder(panel);}));
    $('#builderAdd',panel).addEventListener('click',()=>{
      const kind=$('#builderKind',panel).value;
      const id=`custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
      const item={id,kind,layout:'default',visible:true,...(DEFAULT_SECTIONS[kind]||{})};
      layoutItemsForPage(builderPage).push(item);builderEditing=id;renderLayoutBuilder(panel);
    });
    $('#builderReset',panel).addEventListener('click',()=>{
      if(!confirm('Reset this page arrangement to the original sections? This clears unsaved custom sections on this page.'))return;
      builderDraft[builderPage]=BUILTIN_LAYOUTS[builderPage].map(([id,title])=>({id,title,kind:'builtin',visible:true,layout:'default'}));
      builderEditing=null;renderLayoutBuilder(panel);
    });
    $('#builderSave',panel).addEventListener('click',async e=>{
      const button=e.currentTarget;button.disabled=true;
      try{
        const updated={...(state.settings.layout_sections||{})};
        Object.entries(builderDraft).forEach(([page,rows])=>updated[page]=rows);
        await post('settings','save',{data:{layout_sections:updated}});
        state.settings.layout_sections=updated;
        toast('Page layout published. Refresh the website to see the changes.');
      }catch(error){toast(error.message,true);}finally{button.disabled=false;}
    });
    $$('.builder-row',panel).forEach(row=>{
      const id=row.dataset.builderId;
      row.querySelector('[data-builder-edit]').addEventListener('click',()=>{builderEditing=builderEditing===id?null:id;renderLayoutBuilder(panel);});
      row.querySelector('[data-builder-remove]')?.addEventListener('click',()=>{
        if(!confirm('Remove this custom section from the page layout?'))return;
        builderDraft[builderPage]=layoutItemsForPage(builderPage).filter(x=>x.id!==id);
        if(builderEditing===id)builderEditing=null;
        renderLayoutBuilder(panel);
      });
      row.querySelectorAll('[data-builder-shift]').forEach(b=>b.addEventListener('click',()=>{
        const list=layoutItemsForPage(builderPage);const i=list.findIndex(x=>x.id===id);const j=i+Number(b.dataset.builderShift);
        if(i<0||j<0||j>=list.length)return;
        [list[i],list[j]]=[list[j],list[i]];renderLayoutBuilder(panel);
      }));
      row.querySelectorAll('[data-builder-field]').forEach(input=>input.addEventListener('input',()=>{
        const item=layoutItemsForPage(builderPage).find(x=>x.id===id);if(!item)return;
        item[input.dataset.builderField]=input.type==='checkbox'?input.checked:input.value;
        if(input.type==='checkbox')row.classList.toggle('is-hidden',!input.checked);
      }));
      row.addEventListener('dragstart',event=>{
        if(event.target.closest('input,textarea,select,button')){event.preventDefault();return;}
        event.dataTransfer.setData('text/plain',id);event.dataTransfer.effectAllowed='move';row.classList.add('dragging');
      });
      row.addEventListener('dragend',()=>row.classList.remove('dragging'));
      row.addEventListener('dragover',event=>{event.preventDefault();event.dataTransfer.dropEffect='move';row.classList.add('drag-over');});
      row.addEventListener('dragleave',()=>row.classList.remove('drag-over'));
      row.addEventListener('drop',event=>{
        event.preventDefault();row.classList.remove('drag-over');
        const from=event.dataTransfer.getData('text/plain');const to=id;if(!from||from===to)return;
        const list=layoutItemsForPage(builderPage);const i=list.findIndex(x=>x.id===from),j=list.findIndex(x=>x.id===to);
        if(i<0||j<0)return;
        list.splice(j,0,list.splice(i,1)[0]);renderLayoutBuilder(panel);
      });
    });
  }

  function renderSettings(panel,settings,view){
    settings={portfolio_columns_desktop:'3',portfolio_home_columns:'3',portfolio_columns_tablet:'2',portfolio_columns_mobile:'1',portfolio_gap:'18',portfolio_hover_animation:'Lift',portfolio_scroll_animation:'Fade up',portfolio_motion_speed:'Balanced',...settings};
    const config=settingGroups[view];
    panel.innerHTML=heading(titles[view],config.intro,`<a class="admin-button ghost" href="/" target="_blank" rel="noopener noreferrer">${icon('eye')} Open website</a>`)+
      `<div class="settings-intro"><strong>You're in control of the details.</strong><p>Changes are saved to the existing Neon database. Each card saves independently, so you can update only what you need.</p></div>`+
      config.groups.map((g,i)=>`<div class="panel-card settings-section"><div class="editor-section-head"><span class="section-number">${String(i+1).padStart(2,'0')}</span><div><h3>${g.title}</h3><small>${g.description}</small></div></div><form data-settings-group class="settings-form">`+
        g.fields.map(field=>{
          const [key,label,type='text',options]=field;
          const val=settings[key]!==undefined?settings[key]:({hero_video_enabled:true,show_home_services:true,show_home_work:true,show_home_process:true,show_home_about:true,show_home_faq:true,show_home_testimonials:true,show_home_cta:true}[key]??'');
          const raw=Array.isArray(val)?val.join('\n'):String(val??'');
          if(type==='checkbox')return `<label class="full"><input type="checkbox" name="${esc(key)}" ${val===true||val==='true'?'checked':''}> <span>${esc(label)}</span></label>`;
          if(type==='textarea')return `<label class="full">${esc(label)}<textarea name="${esc(key)}" rows="${key==='ai_assistant_public_bio'||key==='ai_assistant_approved_facts'?'9':'4'}">${esc(raw)}</textarea></label>`;
          if(type==='select')return `<label>${esc(label)}<select name="${esc(key)}">${options.map(o=>`<option value="${esc(o)}" ${val===o?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
          if(type==='image')return `<label class="full">${esc(label)}<span class="image-input-row"><input name="${esc(key)}" value="${esc(raw)}" placeholder="Choose media or enter URL"><button type="button" class="admin-button ghost" data-pick-image="${esc(key)}">${icon('image')} Media</button></span>${safeUrl(raw)&&!(/\.mp4(?:\?|$)/i.test(raw))?`<span class="image-preview"><img src="${esc(safeUrl(raw))}" alt="Image preview"></span>`:''}</label>`;
          if(type==='color')return `<label>${esc(label)}<input type="color" name="${esc(key)}" value="${/^#[0-9a-fA-F]{6}$/.test(raw)?esc(raw):'#4563f5'}"></label>`;
          return `<label>${esc(label)}<input name="${esc(key)}" type="${type==='email'?'email':'text'}" value="${esc(raw)}"></label>`;
        }).join('')+
        `<div class="form-footer"><small>Only fields in this card are saved.</small><button type="submit" class="admin-button primary">${icon('check')} Save ${esc(g.title.toLowerCase())}</button></div></form></div>`).join('');
    if(view==='aiassistant'){
      const banner=document.createElement('section');
      banner.className='md-ai-admin-status panel-card';
      banner.innerHTML='<div class="md-ai-admin-badge">✳ OPENAI-POWERED ASSISTANT</div><h3>Real conversations, grounded in your website.</h3><p>The assistant reads published website content plus the professional details you approve below. It does <strong>not</strong> automatically read your ChatGPT conversations or personal memories.</p><div class="md-ai-admin-connection" id="mdAiConnection" role="status">Checking API connection…</div><div class="md-ai-admin-steps"><strong>Connect OpenAI securely</strong><p>1. Create an API key in <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API keys ↗</a>.<br>2. In <strong>Vercel → Mubest Digital → Settings → Environment Variables</strong>, add the secret named <code>OPENAI_API_KEY</code> to Production (and Preview if desired).<br>3. Redeploy the site. The widget appears automatically once the key and enabled setting are both present.</p><p>ChatGPT subscriptions and OpenAI API usage are billed separately. Never paste a secret API key into this dashboard or into your public website code.</p></div><div class="md-ai-admin-links"><a class="admin-button ghost" href="/" target="_blank" rel="noopener noreferrer">View website ↗</a><a class="admin-button ghost" href="/start-project/" target="_blank" rel="noopener noreferrer">Project enquiries ↗</a></div>';
      const first=panel.querySelector('.settings-section');
      if(first)first.before(banner);else panel.append(banner);
      fetch('/api/ai-chat',{cache:'no-store'}).then(r=>r.json()).then(status=>{
        const el=$('#mdAiConnection',panel);if(!el)return;
        el.classList.toggle('is-ready',Boolean(status.available));
        el.classList.toggle('is-pending',!status.available);
        el.textContent=status.available?'● API configured · The assistant is enabled and ready for visitor conversations.':status.enabled===false?'○ Assistant disabled in Content Studio. Turn it on when ready.':'○ OpenAI API key not connected yet. Live AI chat remains hidden until you configure it.';
      }).catch(()=>{const el=$('#mdAiConnection',panel);if(el)el.textContent='Could not verify the AI connection. Check the website API deployment.';});
    }
    if(view==='portfoliodesign'){
      const first=panel.querySelector('.settings-section');
      first?.insertAdjacentHTML('beforebegin',
        '<section class="md-motion-preview"><div class="md-preview-head"><div><span class="md-preview-eyebrow">INTERACTIVE PREVIEW</span><h3>See the motion before you publish.</h3><p>Hover or focus a card; changing the selector updates this preview instantly.</p></div><a href="/portfolio/" target="_blank" rel="noopener noreferrer">View live portfolio ↗</a></div><div class="md-preview-grid" id="mdMotionPreview">'+
        ['Shopify Storefront','Email Design','Product Customizer','Brand Experience','Digital Campaign'].map((name,i)=>'<div class="md-preview-card" tabindex="0"><div class="md-preview-art md-art-'+(i+1)+'"><span>0'+(i+1)+'</span></div><strong>'+name+'</strong><small>View project ↗</small></div>').join('')+
        '</div></section>');
      const preview=panel.querySelector('#mdMotionPreview');
      const sync=()=>{
        if(!preview)return;
        preview.dataset.hover=String(panel.querySelector('[name="portfolio_hover_animation"]')?.value||'Lift').toLowerCase();
        preview.style.setProperty('--preview-cols',String(Math.max(1,Math.min(5,Number(panel.querySelector('[name="portfolio_columns_desktop"]')?.value)||3))));
        const speed=String(panel.querySelector('[name="portfolio_motion_speed"]')?.value||'Balanced');
        preview.style.setProperty('--preview-time',speed==='Fast'?'220ms':speed==='Slow'?'700ms':'420ms');
      };
      panel.querySelectorAll('select').forEach(el=>el.addEventListener('change',sync));
      sync();
    }
    $$('[data-settings-group]',panel).forEach(form=>{
      $$('[data-pick-image]',form).forEach(b=>b.addEventListener('click',()=>openMediaPicker(b.dataset.pickImage,form)));
      form.addEventListener('submit',async e=>{
        e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());
        $$('input[type="checkbox"]',form).forEach(el=>{data[el.name]=el.checked;});
        const submit=form.querySelector('[type="submit"]');submit.disabled=true;
        try{await post('settings','save',{data});Object.assign(state.settings,data);applyAdminBrand(state.settings);toast('Website settings saved.');if(view==='portfoliocategories'||view==='aiassistant')await loadView(view);}
        catch(error){toast(error.message,true);}finally{submit.disabled=false;}
      });
    });
  }

  async function uploadFiles(fileList){
    const files=Array.from(fileList||[]);if(!files.length)return;
    const max=50*1024*1024;
    if(files.some(f=>f.size>max)){toast('Files over 50 MB are not supported by this uploader.',true);return;}
    try{
      toast(`Uploading ${files.length} file${files.length!==1?'s':''}…`);
      const {upload}=await import('https://esm.sh/@vercel/blob@2.0.0/client');
      for(const file of files){
        const result=await upload(file.name,file,{access:'public',handleUploadUrl:'/api/upload'});
        await post('media','create',{data:{url:result.url,pathname:result.pathname,filename:file.name,content_type:file.type,size_bytes:file.size,alt_text:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')}});
      }
      toast('Files uploaded.');await loadView('media');
    }catch(error){toast(error.message||'Upload failed. Check your Vercel Blob settings.',true);}
  }
  function renderMedia(panel,items){
    const list=Array.isArray(items)?items:[];state.media=list;
    panel.innerHTML=heading('Media library','Upload and manage brand logos, hero backgrounds, client screenshots, images and videos.',`<label class="admin-button primary" for="mediaUpload">${icon('plus')} Upload media</label><input id="mediaUpload" type="file" accept="image/*,video/mp4,video/webm" multiple hidden>`)+
      `<div class="collection-toolbar"><div class="toolbar-left"><div class="search-field">${icon('search')}<input id="mediaSearch" type="search" placeholder="Search filenames..." aria-label="Search media"></div><select class="filter-select" id="mediaFilter" aria-label="Media type"><option value="all">All media</option><option value="image">Images</option><option value="video">Videos</option></select></div><span class="toolbar-count" id="mediaCount">${list.length} files</span></div><div id="mediaGrid"></div>`;
    $('#mediaUpload',panel).addEventListener('change',event=>uploadFiles(event.target.files));
    const renderList=()=>{
      const term=$('#mediaSearch',panel).value.trim().toLowerCase(),filter=$('#mediaFilter',panel).value;
      const filtered=list.filter(item=>(filter==='all'||String(item.content_type||'').startsWith(filter+'/'))&&[item.filename,item.alt_text].join(' ').toLowerCase().includes(term));
      $('#mediaCount',panel).textContent=`${filtered.length} of ${list.length} files`;
      $('#mediaGrid',panel).innerHTML=filtered.length?`<div class="media-grid">${filtered.map(x=>{
        const isVideo=String(x.content_type||'').startsWith('video/');
        return `<article class="media-card"><div class="media-thumb">${isVideo?`<video src="${esc(x.url)}" muted preload="metadata"></video>`:`<img src="${esc(x.url)}" alt="${esc(x.alt_text||x.filename||'Image')}" loading="lazy">`}</div><div class="media-meta"><strong title="${esc(x.filename||'Media')}">${esc(x.filename||'Media file')}</strong><small>${esc(x.content_type||'file')} · ${Math.round((Number(x.size_bytes)||0)/1024)} KB</small><div class="media-actions"><button class="text-button" data-copy-url="${esc(x.id)}">Copy URL</button><button class="text-button delete" data-delete-media="${esc(x.id)}">Delete</button></div><div class="alt-editor"><input data-alt="${esc(x.id)}" value="${esc(x.alt_text||'')}" placeholder="Image alt text" aria-label="Alt text for ${esc(x.filename||'image')}"><button data-save-alt="${esc(x.id)}">Save</button></div></div></article>`;
      }).join('')}</div>`:`<div class="empty-state">No matching media yet. Upload an image or video to get started.</div>`;
      $$('[data-copy-url]',panel).forEach(b=>b.addEventListener('click',async()=>{const x=list.find(i=>String(i.id)===b.dataset.copyUrl);if(!x)return;try{await navigator.clipboard.writeText(x.url);toast('Media link copied.');}catch{toast('Unable to copy. Please select and copy the URL manually.',true);}}));
      $$('[data-save-alt]',panel).forEach(b=>b.addEventListener('click',async()=>{try{const id=b.dataset.saveAlt,alt=$(`[data-alt="${id}"]`,panel).value;await post('media','update',{id,alt_text:alt});const item=list.find(x=>String(x.id)===id);if(item)item.alt_text=alt;toast('Media description updated.');}catch(e){toast(e.message,true);}}));
      $$('[data-delete-media]',panel).forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Permanently delete this media file? Check that it is not being used on a page first.'))return;try{await post('media','delete',{id:b.dataset.deleteMedia});toast('Media deleted.');await loadView('media');}catch(e){toast(e.message,true);}}));
    };
    $('#mediaSearch',panel).addEventListener('input',renderList);$('#mediaFilter',panel).addEventListener('change',renderList);renderList();
  }
  // Integrated media picker: reuses the authenticated Vercel Blob + Neon endpoints.
  // It never switches away from the record the administrator is currently editing.
  function renderMediaPicker(message='',tone=''){
    const dialog=$('#mediaDialog'),container=$('#mediaPicker');
    const field=String(state.mediaTarget?.field||'');
    const allowVideo=/video|poster|background/i.test(field);
    const available=(state.media||[]).filter(item=>{
      const mime=String(item.content_type||'').toLowerCase();
      return mime.startsWith('image/')||(allowVideo&&mime.startsWith('video/'));
    });
    const fileCount=available.length;
    container.innerHTML=`
      <div class="mpu-intro">
        <div class="mpu-drop" id="mpuDrop" role="button" tabindex="0" aria-label="Browse your computer to upload media">
          <span class="mpu-drop-mark" aria-hidden="true">${icon('plus')}</span>
          <div class="mpu-drop-copy"><strong>Drop your media here</strong><small>Or click to browse your computer. JPG, PNG, WebP, GIF, SVG, MP4 and WebM · Maximum 50 MB per file.</small></div>
          <button type="button" class="mpu-browse">Browse files</button>
        </div>
        <div class="mpu-toolbar"><div class="mpu-search">${icon('search')}<input id="mpuSearch" type="search" placeholder="Search your media library..." aria-label="Search existing media"></div><span class="mpu-count" id="mpuCount">${fileCount} file${fileCount===1?'':'s'}</span></div>
      </div>
      <div id="mpuFeedback" class="mpu-feedback" role="status" aria-live="polite" ${message?'':'hidden'}></div>
      <div id="mpuResults" class="mpu-results"></div>`;
    const feedback=$('#mpuFeedback',container);
    if(message){feedback.textContent=message;feedback.dataset.tone=tone;}
    const draw=()=>{
      const term=$('#mpuSearch',container).value.trim().toLowerCase();
      const filtered=available.filter(item=>[item.filename,item.alt_text].join(' ').toLowerCase().includes(term));
      $('#mpuCount',container).textContent=`${filtered.length} of ${fileCount} files`;
      $('#mpuResults',container).innerHTML=filtered.length?`<div class="mpu-grid">${filtered.map(item=>{
        const isVideo=String(item.content_type||'').startsWith('video/');
        const thumb=isVideo?`<span class="mpu-video-icon">${icon('video')}</span>`:`<img src="${esc(item.url||'')}" alt="${esc(item.alt_text||item.filename||'Image')}" loading="lazy">`;
        return `<button type="button" class="mpu-tile" data-select-media="${esc(item.id)}" title="Insert ${esc(item.filename||'media')}"><span class="mpu-thumb">${thumb}</span><span class="mpu-filename">${esc(item.filename||'Media')}</span><span class="mpu-insert">Select ${icon('arrow-right')}</span></button>`;
      }).join('')}</div>`:`<div class="mpu-empty"><strong>${term?'No matching files':'Your media library is empty'}</strong><p>${term?'Try a different search.':'Upload a photo, logo or video above, then select it for this field.'}</p></div>`;
    };
    $('#mpuSearch',container).addEventListener('input',draw);
    $('#mpuResults',container).addEventListener('click',event=>{
      const button=event.target.closest('[data-select-media]');if(!button)return;
      const item=state.media.find(asset=>String(asset.id)===button.dataset.selectMedia);
      const target=state.mediaTarget?.form?.elements[state.mediaTarget?.field];
      if(item&&target){
        target.value=item.url;
        target.dispatchEvent(new Event('input',{bubbles:true}));
        target.dispatchEvent(new Event('change',{bubbles:true}));
        dialog.close();
        toast('Media selected. Save your changes to publish it.');
      }else toast('Could not insert that file. Please reopen the editor.',true);
    });
    const drop=$('#mpuDrop',container);
    drop.querySelector('.mpu-browse').addEventListener('click',event=>{event.stopPropagation();$('#mediaPickerUpload').click();});
    drop.addEventListener('click',event=>{if(event.target.closest('button'))return;$('#mediaPickerUpload').click();});
    drop.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();$('#mediaPickerUpload').click();}});
    for(const name of ['dragenter','dragover'])drop.addEventListener(name,event=>{event.preventDefault();drop.classList.add('is-dragging');});
    drop.addEventListener('dragleave',event=>{event.preventDefault();if(!drop.contains(event.relatedTarget))drop.classList.remove('is-dragging');});
    drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('is-dragging');if(event.dataTransfer?.files?.length)uploadMediaPickerFiles(event.dataTransfer.files);});
    draw();
  }
  let pickerUploading=false;
  async function uploadMediaPickerFiles(fileList){
    if(pickerUploading)return;
    const files=Array.from(fileList||[]);if(!files.length)return;
    const types=new Set(['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm']);
    if(files.some(f=>f.size>50*1024*1024)){renderMediaPicker('Each file must be no larger than 50 MB.','error');return;}
    if(files.some(f=>!types.has(f.type))){renderMediaPicker('Unsupported format. Please choose JPG, PNG, WebP, GIF, SVG, MP4 or WebM.','error');return;}
    const input=$('#mediaPickerUpload');const label=$('#mediaDialog .mpu-header-upload');
    pickerUploading=true;input.disabled=true;label.classList.add('is-uploading');
    const refreshStatus=(text)=>{const feedback=$('#mpuFeedback');if(feedback){feedback.hidden=false;feedback.textContent=text;feedback.dataset.tone='progress';}};
    let completed=0;
    try{
      const {upload}=await import('https://esm.sh/@vercel/blob@2.0.0/client');
      for(const file of files){
        refreshStatus(`Uploading ${completed+1} of ${files.length}: ${file.name}`);
        const result=await upload(file.name,file,{access:'public',handleUploadUrl:'/api/upload'});
        await post('media','create',{data:{url:result.url,pathname:result.pathname,filename:file.name,content_type:file.type,size_bytes:file.size,alt_text:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')}});
        completed++;
      }
      state.media=await get('media');
      renderMediaPicker(`${completed} file${completed===1?'':'s'} uploaded successfully. Choose an asset below to insert it.`,'success');
      toast('Upload complete. Select your file below.');
    }catch(error){
      try{state.media=await get('media');}catch{}
      renderMediaPicker(`${completed?`${completed} uploaded. `:''}${error.message||'Upload failed. Please try again.'}`,'error');
      toast(error.message||'Media upload failed.',true);
    }finally{
      pickerUploading=false;input.disabled=false;input.value='';label.classList.remove('is-uploading');
    }
  }
  $('#mediaPickerUpload').addEventListener('change',event=>uploadMediaPickerFiles(event.target.files));
  async function openMediaPicker(field,form){
    state.mediaTarget={field,form};
    try{state.media=await get('media');}catch(e){toast(e.message,true);return;}
    renderMediaPicker();
    $('#mediaDialog').showModal();
  }
  $$('[data-close-media]').forEach(b=>b.addEventListener('click',()=>$('#mediaDialog').close()));

  function renderLeads(panel,items){
    const list=Array.isArray(items)?items:[];
    panel.innerHTML=heading('Website enquiries','Keep track of conversations, client requests and follow-ups from your contact form.',`<button id="exportLeads" class="admin-button ghost">${icon('download')} Export CSV</button>`)+
      `<div class="collection-toolbar"><div class="toolbar-left"><div class="search-field">${icon('search')}<input id="leadSearch" placeholder="Search names, emails, services..." type="search"></div><select id="leadSource" class="filter-select" aria-label="Enquiry source"><option value="all">All sources</option><option value="guided">Guided project briefs</option><option value="call">Discovery call requests</option><option value="contact">Contact form</option></select><select id="leadFilter" class="filter-select"><option value="all">All enquiries</option>${['new','contacted','in_progress','completed','archived'].map(s=>`<option value="${s}">${displayName(s)}</option>`).join('')}</select></div><span class="toolbar-count" id="leadCount">${list.length} enquiries</span></div><div class="panel-card" id="leadResults"></div>`;
    $('#exportLeads',panel).addEventListener('click',()=>{
      if(!list.length){toast('No enquiries to export.');return;}
      const keys=['created_at','name','email','service','budget','message','status','notes'];
      const csv=[keys.join(','),...list.map(item=>keys.map(k=>'"'+String(item[k]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n');
      const url=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'}));
      const a=document.createElement('a');a.href=url;a.download=`mubest-enquiries-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    const renderList=()=>{
      const term=$('#leadSearch',panel).value.toLowerCase(),filter=$('#leadFilter',panel).value,source=$('#leadSource',panel).value;
      const filtered=list.filter(x=>(filter==='all'||x.status===filter)&&(source==='all'||(source==='call'?String(x.message||'').includes('Discovery call request: Yes'):(source==='guided')===String(x.message||'').startsWith('MUBEST DIGITAL — GUIDED PROJECT BRIEF')))&&[x.name,x.email,x.service,x.message].join(' ').toLowerCase().includes(term));
      $('#leadCount',panel).textContent=`${filtered.length} of ${list.length} enquiries`;
      $('#leadResults',panel).innerHTML=filtered.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Contact</th><th>Project request</th><th>Message</th><th>Follow-up</th><th>Received</th></tr></thead><tbody>${filtered.map(x=>`<tr><td class="lead-contact"><span class="table-title">${esc(x.name)}</span><a href="mailto:${esc(x.email)}">${esc(x.email)}</a></td><td><strong>${esc(x.service||'General enquiry')}</strong><span class="table-sub">${esc(x.budget||'No budget specified')}</span></td><td>${String(x.message||'').startsWith('MUBEST DIGITAL — GUIDED PROJECT BRIEF')?`<div class="v5-lead-badge">Guided brief</div><details class="v5-lead-brief"><summary>Read complete project brief</summary><pre>${esc(x.message)}</pre></details>`:`<div class="lead-cell-msg">${esc(x.message)}</div>`}</td><td><div class="lead-controls"><select class="lead-status" data-lead-status="${x.id}">${['new','contacted','in_progress','completed','archived'].map(s=>`<option value="${s}" ${x.status===s?'selected':''}>${displayName(s)}</option>`).join('')}</select><textarea class="lead-note" data-lead-notes="${x.id}" placeholder="Internal follow-up notes...">${esc(x.notes||'')}</textarea><button class="text-button" data-save-lead="${x.id}">${icon('check')} Save follow-up</button></div></td><td>${day(x.created_at)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state">No enquiries match this filter.</div>`;
      $$('[data-save-lead]',panel).forEach(b=>b.addEventListener('click',async()=>{const id=b.dataset.saveLead;try{const status=$(`[data-lead-status="${id}"]`,panel).value,notes=$(`[data-lead-notes="${id}"]`,panel).value;await post('leads','update',{id,status,notes});const record=list.find(x=>String(x.id)===id);if(record){record.status=status;record.notes=notes;}toast('Enquiry follow-up saved.');}catch(e){toast(e.message,true);}}));
    };
    $('#leadSearch',panel).addEventListener('input',renderList);$('#leadFilter',panel).addEventListener('change',renderList);$('#leadSource',panel).addEventListener('change',renderList);renderList();
  }

  function renderActivity(panel,data){
    const logs=data.logs||[],revs=data.revisions||[];
    panel.innerHTML=heading('Activity & revisions','See what changed, who made the change, and restore a previous version when needed.')+
      `<div class="panel-card"><div class="panel-card-header"><div><h3>Recent activity</h3><p>Latest published content and administrative actions.</p></div></div>`+
      (logs.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Action</th><th>Content type</th><th>Details</th><th>By</th><th>Date</th></tr></thead><tbody>${logs.map(x=>`<tr><td><span class="table-title">${esc(displayName(x.action))}</span></td><td>${esc(displayName(x.entity_type))}</td><td>${esc(x.summary||'')}</td><td>${esc(x.email||'System')}</td><td>${day(x.created_at)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state">No activity recorded yet.</div>`)+`</div>`+
      `<div class="panel-card"><div class="panel-card-header"><div><h3>Saved versions</h3><p>Restore an earlier snapshot if you need to undo an edit.</p></div></div>`+
      (revs.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Section</th><th>Item</th><th>Editor</th><th>Date</th><th>Action</th></tr></thead><tbody>${revs.map(x=>`<tr><td><span class="table-title">${esc(displayName(x.entity_type))}</span></td><td>${esc(x.entity_id)}</td><td>${esc(x.email||'Administrator')}</td><td>${day(x.created_at)}</td><td><button class="text-button" data-restore="${x.id}">Restore version</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state">Previous versions will appear here after you edit content.</div>`)+`</div>`;
    $$('[data-restore]',panel).forEach(b=>b.addEventListener('click',async()=>{
      if(!confirm('Restore this earlier version? The currently saved content may be replaced.'))return;
      try{await post('activity','restore',{id:b.dataset.restore});toast('Earlier version restored.');await loadView('activity');}catch(e){toast(e.message,true);}
    }));
  }
  checkAuth();
})();
