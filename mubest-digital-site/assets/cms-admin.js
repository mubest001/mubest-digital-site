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
  const titles={overview:'Overview',leads:'Enquiries',pages:'Pages',portfolio:'Portfolio',services:'Services',testimonials:'Testimonials',faqs:'FAQs',media:'Media library',branding:'Brand identity',homepage:'Homepage & hero',navigation:'Header & footer',seo:'SEO & sharing',contactsettings:'Contact & social',activity:'Activity & revisions'};
  const settingsViews=['branding','homepage','navigation','seo','contactsettings'];
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
    portfolio:[['title','Project title'],['slug','Project URL slug'],['category','Industry / platform'],['excerpt','Short summary','textarea'],['description','Full case-study description','textarea'],['cover_image','Cover image','image'],['gallery','Gallery images (one URL per line)','textarea'],['project_url','Project website URL','url'],['featured','Feature on homepage','checkbox'],['sort_order','Display order','number'],['status','Publication status','select',['draft','published','archived']]],
    services:[['title','Service name'],['slug','Anchor / URL slug'],['summary','Service card summary','textarea'],['description','Full service details','textarea'],['tag','Keywords / service tags'],['icon','Service category icon','select',['website','email','video','ecommerce','book','ads']],['deliverables','Included deliverables (one per line)','textarea'],['sort_order','Display order','number'],['status','Publication status','select',['draft','published','archived']]],
    testimonials:[['name','Client name'],['role','Job title'],['company','Company / business'],['quote','Client feedback','textarea'],['avatar_url','Portrait image','image'],['rating','Rating (1–5)','number'],['sort_order','Display order','number'],['status','Publication status','select',['draft','published','archived']]],
    faqs:[['question','Question','textarea'],['answer','Answer','textarea'],['sort_order','Display order','number'],['status','Publication status','select',['draft','published','archived']]]
  };

  // These keys are persisted to Neon site_settings, then read by public-content.
  const settingGroups={
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
      {title:'Social profiles',description:'Link to official business profiles only.',fields:[['social_instagram','Instagram link','url'],['social_linkedin','LinkedIn link','url'],['social_facebook','Facebook link','url'],['social_tiktok','TikTok link','url']]}
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
    panel.innerHTML=heading(config[0],config[1],`<button class="admin-button primary" id="addRecord">${icon('plus')} ${config[2]}</button>`)+
      `<div class="collection-toolbar"><div class="toolbar-left"><div class="search-field">${icon('search')}<input id="collectionSearch" type="search" placeholder="Search ${resource}..." aria-label="Search content"></div><select class="filter-select" id="collectionStatus" aria-label="Filter by status">${filters.map(f=>`<option value="${f}">${f==='all'?'All statuses':displayName(f)}</option>`).join('')}</select></div><span id="collectionCount" class="toolbar-count">${list.length} items</span></div>`+
      `<div id="collectionResults" class="panel-card" style="padding:8px 18px 17px"></div>`;
    $('#addRecord',panel).addEventListener('click',()=>openEditor(resource,null));
    const input=$('#collectionSearch',panel), select=$('#collectionStatus',panel);
    function refresh(){
      const term=input.value.trim().toLowerCase(),filter=select.value;
      const filtered=list.filter(x=>(filter==='all'||x.status===filter)&&[x.title,x.name,x.question,x.category,x.summary,x.excerpt,x.company,x.tag,x.slug].join(' ').toLowerCase().includes(term));
      $('#collectionCount',panel).textContent=`${filtered.length} of ${list.length} items`;
      $('#collectionResults',panel).innerHTML=filtered.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Content</th><th>${resource==='portfolio'?'Description':resource==='services'?'Deliverables':'Details'}</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>${filtered.map(item=>{
        const title=item.title||item.name||item.question;
        const sub=item.category||item.company||item.slug||item.role||'';
        const detail=item.excerpt||item.summary||item.quote||item.answer||'';
        const thumb=resource==='portfolio'?`<span class="project-row-thumb">${safeUrl(item.cover_image)?`<img src="${esc(safeUrl(item.cover_image))}" alt="" loading="lazy">`:esc(String(title||'M')[0])}</span>`:'';
        return `<tr><td><div class="content-identity">${thumb}<span><span class="table-title">${esc(short(title))}</span><span class="table-sub">${esc(short(sub))}</span></span></div></td><td><span class="table-sub">${esc(String(detail).slice(0,130))}</span></td><td>${statusPill(item.status)}</td><td>${esc(item.sort_order??'—')}</td><td><div class="row-actions"><button class="text-button" data-edit="${item.id}">${icon('edit')} Edit</button><button class="text-button delete" data-delete="${item.id}">Delete</button></div></td></tr>`;
      }).join('')}</tbody></table></div>`:`<div class="empty-state">Nothing matches your search or status filter.</div>`;
      $$('[data-edit]',panel).forEach(b=>b.addEventListener('click',()=>openEditor(resource,list.find(x=>String(x.id)===b.dataset.edit))));
      $$('[data-delete]',panel).forEach(b=>b.addEventListener('click',()=>deleteItem(resource,b.dataset.delete)));
    }
    input.addEventListener('input',refresh);select.addEventListener('change',refresh);refresh();
  }

  function fieldHtml(field,value){
    const [name,label,type='text',options]=field;
    const raw=Array.isArray(value)?value.join('\n'):value??'';
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
    $('#editorFields').innerHTML=`<div class="editor-grid">${fields.map(f=>fieldHtml(f,item?.[f[0]])).join('')}</div>`;
    const form=$('#editorForm');form.dataset.resource=resource;form.dataset.id=item?.id||'';
    $$('[data-pick-image]',form).forEach(b=>b.addEventListener('click',()=>openMediaPicker(b.dataset.pickImage,form)));
    const title=form.elements.title,slug=form.elements.slug;
    if(title&&slug&&!item?.slug)title.addEventListener('input',()=>{slug.value=title.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');});
    $('#editorDialog').showModal();
  }
  $('#editorForm').addEventListener('submit',async e=>{
    e.preventDefault();const form=e.currentTarget,resource=form.dataset.resource,fields=recordFields[resource];
    const data={id:form.dataset.id||undefined};
    fields.forEach(f=>{const [key,,type='text']=f,el=form.elements[key];if(!el)return;data[key]=type==='checkbox'?el.checked:type==='number'?Number(el.value||0):['gallery','deliverables'].includes(key)?el.value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean):el.value;});
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
  function renderSettings(panel,settings,view){
    const config=settingGroups[view];
    panel.innerHTML=heading(titles[view],config.intro,`<a class="admin-button ghost" href="/" target="_blank" rel="noopener noreferrer">${icon('eye')} Open website</a>`)+
      `<div class="settings-intro"><strong>You're in control of the details.</strong><p>Changes are saved to the existing Neon database. Each card saves independently, so you can update only what you need.</p></div>`+
      config.groups.map((g,i)=>`<div class="panel-card settings-section"><div class="editor-section-head"><span class="section-number">${String(i+1).padStart(2,'0')}</span><div><h3>${g.title}</h3><small>${g.description}</small></div></div><form data-settings-group class="settings-form">`+
        g.fields.map(field=>{
          const [key,label,type='text',options]=field;
          const val=settings[key]!==undefined?settings[key]:({hero_video_enabled:true,show_home_services:true,show_home_work:true,show_home_process:true,show_home_about:true,show_home_faq:true,show_home_testimonials:true,show_home_cta:true}[key]??'');
          const raw=String(val??'');
          if(type==='checkbox')return `<label class="full"><input type="checkbox" name="${esc(key)}" ${val===true||val==='true'?'checked':''}> <span>${esc(label)}</span></label>`;
          if(type==='textarea')return `<label class="full">${esc(label)}<textarea name="${esc(key)}" rows="4">${esc(raw)}</textarea></label>`;
          if(type==='select')return `<label>${esc(label)}<select name="${esc(key)}">${options.map(o=>`<option value="${esc(o)}" ${val===o?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`;
          if(type==='image')return `<label class="full">${esc(label)}<span class="image-input-row"><input name="${esc(key)}" value="${esc(raw)}" placeholder="Choose media or enter URL"><button type="button" class="admin-button ghost" data-pick-image="${esc(key)}">${icon('image')} Media</button></span>${safeUrl(raw)&&!(/\.mp4(?:\?|$)/i.test(raw))?`<span class="image-preview"><img src="${esc(safeUrl(raw))}" alt="Image preview"></span>`:''}</label>`;
          if(type==='color')return `<label>${esc(label)}<input type="color" name="${esc(key)}" value="${/^#[0-9a-fA-F]{6}$/.test(raw)?esc(raw):'#4563f5'}"></label>`;
          return `<label>${esc(label)}<input name="${esc(key)}" type="${type==='email'?'email':'text'}" value="${esc(raw)}"></label>`;
        }).join('')+
        `<div class="form-footer"><small>Only fields in this card are saved.</small><button type="submit" class="admin-button primary">${icon('check')} Save ${esc(g.title.toLowerCase())}</button></div></form></div>`).join('');
    $$('[data-settings-group]',panel).forEach(form=>{
      $$('[data-pick-image]',form).forEach(b=>b.addEventListener('click',()=>openMediaPicker(b.dataset.pickImage,form)));
      form.addEventListener('submit',async e=>{
        e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());
        $$('input[type="checkbox"]',form).forEach(el=>{data[el.name]=el.checked;});
        const submit=form.querySelector('[type="submit"]');submit.disabled=true;
        try{await post('settings','save',{data});Object.assign(state.settings,data);applyAdminBrand(state.settings);toast('Website settings saved.');}
        catch(error){toast(error.message,true);}finally{submit.disabled=false;}
      });
    });
  }

  async function uploadFiles(fileList){
    const files=Array.from(fileList||[]);if(!files.length)return;
    const max=80*1024*1024;
    if(files.some(f=>f.size>max)){toast('Files over 80 MB are not supported by this uploader.',true);return;}
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
  async function openMediaPicker(field,form){
    state.mediaTarget={field,form};
    try{state.media=await get('media');}catch(e){toast(e.message,true);return;}
    const container=$('#mediaPicker');
    container.innerHTML=state.media.length?state.media.filter(x=>String(x.content_type||'').startsWith('image/')||/video|poster|background/.test(field)).map(item=>`<button type="button" class="media-pick" data-select-media="${item.id}">${String(item.content_type||'').startsWith('video/')?`<img src="/assets/favicon.svg" alt="Video file">`:`<img src="${esc(item.url)}" alt="${esc(item.alt_text||'')}">`}<span>${esc(item.filename||'Media')}</span></button>`).join(''):`<div class="empty-state">No media yet. Upload files from your Media library first.</div>`;
    $$('[data-select-media]',container).forEach(b=>b.addEventListener('click',()=>{
      const item=state.media.find(x=>String(x.id)===b.dataset.selectMedia);
      const input=state.mediaTarget.form.elements[state.mediaTarget.field];
      if(item&&input){input.value=item.url;input.dispatchEvent(new Event('input',{bubbles:true}));}
      $('#mediaDialog').close();
    }));
    $('#mediaDialog').showModal();
  }
  $$('[data-close-media]').forEach(b=>b.addEventListener('click',()=>$('#mediaDialog').close()));

  function renderLeads(panel,items){
    const list=Array.isArray(items)?items:[];
    panel.innerHTML=heading('Website enquiries','Keep track of conversations, client requests and follow-ups from your contact form.',`<button id="exportLeads" class="admin-button ghost">${icon('download')} Export CSV</button>`)+
      `<div class="collection-toolbar"><div class="toolbar-left"><div class="search-field">${icon('search')}<input id="leadSearch" placeholder="Search names, emails, services..." type="search"></div><select id="leadFilter" class="filter-select"><option value="all">All enquiries</option>${['new','contacted','in_progress','completed','archived'].map(s=>`<option value="${s}">${displayName(s)}</option>`).join('')}</select></div><span class="toolbar-count" id="leadCount">${list.length} enquiries</span></div><div class="panel-card" id="leadResults"></div>`;
    $('#exportLeads',panel).addEventListener('click',()=>{
      if(!list.length){toast('No enquiries to export.');return;}
      const keys=['created_at','name','email','service','budget','message','status','notes'];
      const csv=[keys.join(','),...list.map(item=>keys.map(k=>'"'+String(item[k]??'').replace(/"/g,'""')+'"').join(','))].join('\r\n');
      const url=URL.createObjectURL(new Blob(['\uFEFF',csv],{type:'text/csv;charset=utf-8;'}));
      const a=document.createElement('a');a.href=url;a.download=`mubest-enquiries-${new Date().toISOString().slice(0,10)}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });
    const renderList=()=>{
      const term=$('#leadSearch',panel).value.toLowerCase(),filter=$('#leadFilter',panel).value;
      const filtered=list.filter(x=>(filter==='all'||x.status===filter)&&[x.name,x.email,x.service,x.message].join(' ').toLowerCase().includes(term));
      $('#leadCount',panel).textContent=`${filtered.length} of ${list.length} enquiries`;
      $('#leadResults',panel).innerHTML=filtered.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Contact</th><th>Project request</th><th>Message</th><th>Follow-up</th><th>Received</th></tr></thead><tbody>${filtered.map(x=>`<tr><td class="lead-contact"><span class="table-title">${esc(x.name)}</span><a href="mailto:${esc(x.email)}">${esc(x.email)}</a></td><td><strong>${esc(x.service||'General enquiry')}</strong><span class="table-sub">${esc(x.budget||'No budget specified')}</span></td><td><div class="lead-cell-msg">${esc(x.message)}</div></td><td><div class="lead-controls"><select class="lead-status" data-lead-status="${x.id}">${['new','contacted','in_progress','completed','archived'].map(s=>`<option value="${s}" ${x.status===s?'selected':''}>${displayName(s)}</option>`).join('')}</select><textarea class="lead-note" data-lead-notes="${x.id}" placeholder="Internal follow-up notes...">${esc(x.notes||'')}</textarea><button class="text-button" data-save-lead="${x.id}">${icon('check')} Save follow-up</button></div></td><td>${day(x.created_at)}</td></tr>`).join('')}</tbody></table></div>`:`<div class="empty-state">No enquiries match this filter.</div>`;
      $$('[data-save-lead]',panel).forEach(b=>b.addEventListener('click',async()=>{const id=b.dataset.saveLead;try{const status=$(`[data-lead-status="${id}"]`,panel).value,notes=$(`[data-lead-notes="${id}"]`,panel).value;await post('leads','update',{id,status,notes});const record=list.find(x=>String(x.id)===id);if(record){record.status=status;record.notes=notes;}toast('Enquiry follow-up saved.');}catch(e){toast(e.message,true);}}));
    };
    $('#leadSearch',panel).addEventListener('input',renderList);$('#leadFilter',panel).addEventListener('change',renderList);renderList();
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
