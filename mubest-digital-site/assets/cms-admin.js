(() => {
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  const esc = v => String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const state = { view:"overview", data:{}, media:[], page:"home", editorResource:null, editorItem:null, mediaTarget:null };
  const titles={overview:"Overview",portfolio:"Portfolio",services:"Services",pages:"Page editor",media:"Media library",testimonials:"Testimonials",faqs:"FAQs",leads:"Enquiries",settings:"Website settings",activity:"Activity & revisions"};
  const pageFields={
    home:[
      ["hero_kicker","Hero kicker"],["hero_title","Hero heading","textarea"],["hero_description","Hero description","textarea"],["hero_primary_label","Primary button label"],["hero_primary_url","Primary button link"],["hero_secondary_label","Secondary button label"],["hero_secondary_url","Secondary button link"],
      ["intro_eyebrow","Intro label"],["intro_heading","Intro heading","textarea"],["intro_copy_1","Intro paragraph 1","textarea"],["intro_copy_2","Intro paragraph 2","textarea"],
      ["services_eyebrow","Services label"],["services_heading","Services heading","textarea"],["services_description","Services description","textarea"],
      ["portfolio_eyebrow","Portfolio label"],["portfolio_heading","Portfolio heading","textarea"],["portfolio_description","Portfolio description","textarea"],
      ["process_eyebrow","Process label"],["process_heading","Process heading","textarea"],["process_description","Process description","textarea"],
      ["about_eyebrow","About section label"],["about_heading","About section heading","textarea"],["about_description","About section description","textarea"],
      ["cta_eyebrow","Call-to-action label"],["cta_heading","Call-to-action heading","textarea"],["cta_button","Call-to-action button"]
    ],
    about:[
      ["hero_eyebrow","Hero label"],["hero_title","Hero heading","textarea"],["hero_description","Hero description","textarea"],
      ["intro_eyebrow","Intro label"],["intro_heading","Intro heading","textarea"],["intro_copy_1","Paragraph 1","textarea"],["intro_copy_2","Paragraph 2","textarea"],["intro_copy_3","Paragraph 3","textarea"],
      ["values_eyebrow","Values label"],["values_heading","Values heading","textarea"],["values_description","Values description","textarea"]
    ],
    services:[["hero_eyebrow","Hero label"],["hero_title","Hero heading","textarea"],["hero_description","Hero description","textarea"],["section_eyebrow","Section label"],["section_heading","Section heading","textarea"],["section_description","Section description","textarea"]],
    portfolio:[["hero_eyebrow","Hero label"],["hero_title","Hero heading","textarea"],["hero_description","Hero description","textarea"],["section_eyebrow","Section label"],["section_heading","Section heading","textarea"],["section_description","Section description","textarea"]],
    contact:[["hero_eyebrow","Hero label"],["hero_title","Hero heading","textarea"],["hero_description","Hero description","textarea"],["section_eyebrow","Contact section label"],["section_heading","Contact section heading","textarea"],["section_description","Contact section description","textarea"]]
  };
  const recordFields={
    portfolio:[
      ["title","Project title"],["slug","URL slug"],["category","Category / platform"],["excerpt","Short description","textarea"],["description","Project description","textarea"],["cover_image","Cover image URL","image"],["gallery","Gallery image URLs (one per line)","textarea"],["project_url","Project website URL"],["featured","Feature on homepage","checkbox"],["sort_order","Display order","number"],["status","Publication status","select",["draft","published","archived"]]
    ],
    services:[
      ["title","Service title"],["slug","URL slug"],["summary","Short summary","textarea"],["description","Full description","textarea"],["tag","Service tags"],["icon","Icon","select",["website","email","video","ecommerce","book","ads"]],["deliverables","Deliverables (one per line)","textarea"],["sort_order","Display order","number"],["status","Publication status","select",["draft","published","archived"]]
    ],
    testimonials:[
      ["name","Client name"],["role","Role / title"],["company","Company"],["quote","Testimonial","textarea"],["avatar_url","Client photo URL","image"],["rating","Rating (1–5)","number"],["sort_order","Display order","number"],["status","Publication status","select",["draft","published","archived"]]
    ],
    faqs:[
      ["question","Question","textarea"],["answer","Answer","textarea"],["sort_order","Display order","number"],["status","Publication status","select",["draft","published","archived"]]
    ]
  };
  const settingGroups=[
    {title:"Brand identity",fields:[["site_name","Website / brand name"],["logo_url","Horizontal logo","image"],["favicon_url","Favicon (icon only)","image"],["about_image_url","About/profile picture","image"]]},
    {title:"Contact details",fields:[["contact_email","Business email"],["phone","Phone number"],["whatsapp","WhatsApp number or link"],["location","Location / service area"]]},
    {title:"Search appearance",fields:[["seo_title","Default SEO title"],["seo_description","Default SEO description","textarea"]]},
    {title:"Social profiles",fields:[["social_instagram","Instagram URL"],["social_linkedin","LinkedIn URL"],["social_facebook","Facebook URL"],["social_tiktok","TikTok URL"]]},
    {title:"Brand colours and fonts",fields:[["color_ink","Dark / ink colour","color"],["color_blue","Primary blue","color"],["color_lime","Accent lime","color"],["color_paper","Background colour","color"],["font_heading","Heading font","select",["Manrope","Inter","DM Sans","Montserrat","Poppins"]],["font_body","Body font","select",["Inter","DM Sans","Manrope","Arial"]]]}
  ];

  async function request(url,options={}) {
    const response=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})},cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||"Something went wrong.");
    return data;
  }
  const get = async resource => (await request(`/api/admin?resource=${encodeURIComponent(resource)}`)).data;
  const post = async (resource,action,data={}) => (await request("/api/admin",{method:"POST",body:JSON.stringify({resource,action,...data})})).data;
  function toast(message,error=false){const el=$("#toast");el.textContent=message;el.className=`toast show${error?" error":""}`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className="toast",3200);}
  function showAuthMessage(message,error=true){const el=$("#authMessage");el.textContent=message||"";el.style.color=error?"#ffb3b3":"#b9e769";}
  function authMode(configured){
    $("#loginForm").hidden=!configured;$("#setupForm").hidden=configured;
    $("#authTitle").textContent=configured?"Welcome back.":"Set up your admin account.";
    $("#authSubtitle").textContent=configured?"Sign in to manage your website.":"This is a one-time setup. Keep your admin password private.";
  }
  async function checkAuth(){
    try{
      const status=await request("/api/auth?action=status");
      if(status.authenticated){showApp(status.email);return;}
      $("#authScreen").hidden=false;$("#adminApp").hidden=true;authMode(status.configured);
    }catch(error){$("#authScreen").hidden=false;authMode(true);showAuthMessage(error.message);}
  }
  function showApp(email){
    $("#authScreen").hidden=true;$("#adminApp").hidden=false;$("#adminEmail").textContent=email||"Administrator";loadView("overview");
  }
  $("#loginForm").addEventListener("submit",async e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));
    try{const result=await request("/api/auth",{method:"POST",body:JSON.stringify({action:"login",...data})});showApp(result.email);}
    catch(error){showAuthMessage(error.message);}
  });
  $("#setupForm").addEventListener("submit",async e=>{
    e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget));
    try{const result=await request("/api/auth",{method:"POST",body:JSON.stringify({action:"setup",...data})});showAuthMessage("Admin account created.",false);showApp(result.email);}
    catch(error){showAuthMessage(error.message);}
  });
  $("#logoutButton").addEventListener("click",async()=>{try{await request("/api/auth",{method:"POST",body:JSON.stringify({action:"logout"})});location.reload();}catch(e){toast(e.message,true);}});
  $("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $$(".sidebar-nav [data-view]").forEach(button=>button.addEventListener("click",()=>{loadView(button.dataset.view);$("#sidebar").classList.remove("open");}));

  async function loadView(view){
    state.view=view;$("#viewTitle").textContent=titles[view]||view;
    $$(".sidebar-nav [data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
    $("#adminPanel").innerHTML='<div class="loading-state">Loading…</div>';
    try{state.data=await get(view);renderView();}
    catch(error){$("#adminPanel").innerHTML=`<div class="empty-state">${esc(error.message)}</div>`;if(error.message.includes("sign in"))checkAuth();}
  }
  function heading(title,desc,button=""){return `<div class="panel-heading"><div><h2>${esc(title)}</h2><p>${esc(desc)}</p></div>${button?`<div class="panel-actions">${button}</div>`:""}</div>`;}
  function btn(label,action="add"){return `<button class="admin-button primary" data-action="${action}">＋ ${label}</button>`;}
  function statusPill(status){return `<span class="status-pill ${esc(status)}">${esc(String(status||"draft").replace("_"," "))}</span>`;}
  function renderView(){
    const panel=$("#adminPanel");
    if(state.view==="overview") return renderOverview(panel,state.data);
    if(["portfolio","services","testimonials","faqs"].includes(state.view)) return renderCollection(panel,state.view,state.data);
    if(state.view==="pages") return renderPages(panel,state.data);
    if(state.view==="settings") return renderSettings(panel,state.data);
    if(state.view==="media") return renderMedia(panel,state.data);
    if(state.view==="leads") return renderLeads(panel,state.data);
    if(state.view==="activity") return renderActivity(panel,state.data);
  }
  function renderOverview(panel,data){
    const c=data.counts||{};
    panel.innerHTML=heading("Your website at a glance","Manage the content behind your live website. Changes publish without a new Vercel deployment.",`<a class="admin-button ghost" href="/" target="_blank">Open live website ↗</a>`)
      +`<div class="stats-grid">${[["Published projects",c.portfolio||0,"Portfolio items live"],["Active services",c.services||0,"Services visible"],["New enquiries",c.new_leads||0,"Awaiting attention"],["Draft projects",c.drafts||0,"Not public yet"]].map(x=>`<div class="stat-card"><small>${x[0]}</small><strong>${x[1]}</strong><span>${x[2]}</span></div>`).join("")}</div>`
      +`<div class="panel-card"><h3>Recent enquiries</h3>${(data.recent||[]).length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Contact</th><th>Service</th><th>Status</th><th>Received</th></tr></thead><tbody>${data.recent.map(x=>`<tr><td><span class="table-title">${esc(x.name)}</span><span class="table-sub">${esc(x.email)}</span></td><td>${esc(x.service)}</td><td>${statusPill(x.status)}</td><td>${new Date(x.created_at).toLocaleDateString()}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state">No enquiries yet. New website enquiries will appear here.</div>`}</div>`
      +`<div class="panel-card"><h3>Quick actions</h3><div class="panel-actions"><button class="admin-button primary" data-quick="portfolio">＋ Add portfolio project</button><button class="admin-button ghost" data-quick="media">Upload media</button><button class="admin-button ghost" data-quick="settings">Change brand settings</button></div></div>`;
    $$("[data-quick]",panel).forEach(b=>b.addEventListener("click",()=>{const v=b.dataset.quick;if(v==="portfolio")openEditor("portfolio",null);else loadView(v);}));
  }
  function renderCollection(panel,resource,items){
    const configs={portfolio:["Portfolio projects","Add and update the projects visitors can explore."],services:["Services","Manage the services and deliverables shown on your website."],testimonials:["Testimonials","Add approved customer feedback. Only published testimonials appear publicly."],faqs:["Frequently asked questions","Keep common questions and answers up to date."]};
    panel.innerHTML=heading(configs[resource][0],configs[resource][1],btn(resource==="portfolio"?"Add project":resource==="services"?"Add service":resource==="faqs"?"Add FAQ":"Add testimonial"))
      +(items.length?`<div class="panel-card"><div class="table-wrap"><table class="admin-table"><thead><tr><th>Item</th><th>Details</th><th>Status</th><th>Order</th><th>Actions</th></tr></thead><tbody>${items.map(item=>{
        const title=item.title||item.name||item.question;const sub=item.category||item.company||item.slug||item.role||item.summary||"";
        return `<tr><td><span class="table-title">${esc(title)}</span><span class="table-sub">${esc(sub)}</span></td><td>${esc(item.excerpt||item.summary||item.quote||item.answer||"")}</td><td>${statusPill(item.status)}</td><td>${esc(item.sort_order??"—")}</td><td><div class="row-actions"><button class="text-button" data-edit="${item.id}">Edit</button><button class="text-button delete" data-delete="${item.id}">Delete</button></div></td></tr>`;
      }).join("")}</tbody></table></div></div>`:`<div class="empty-state">Nothing here yet. Use the button above to add your first item.</div>`);
    $('[data-action="add"]',panel)?.addEventListener("click",()=>openEditor(resource,null));
    $$("[data-edit]",panel).forEach(b=>b.addEventListener("click",()=>openEditor(resource,items.find(x=>String(x.id)===b.dataset.edit))));
    $$("[data-delete]",panel).forEach(b=>b.addEventListener("click",()=>deleteItem(resource,b.dataset.delete)));
  }
  function renderPages(panel,rows){
    const row=rows.find(x=>x.slug===state.page)||{};
    const content=row.draft||row.published||{};
    panel.innerHTML=heading("Edit website pages","Save your changes as a draft, preview them, then publish when ready.")
      +`<div class="page-tabs">${Object.keys(pageFields).map(k=>`<button class="page-tab ${state.page===k?"active":""}" data-page="${k}">${k[0].toUpperCase()+k.slice(1)}</button>`).join("")}</div>`
      +`<div class="panel-card"><div class="panel-heading"><div><h2>${state.page[0].toUpperCase()+state.page.slice(1)} page</h2><p>Editing does not change the live page until you publish.</p></div><div>${statusPill(row.status||"published")}</div></div><form id="pageForm" class="editor-grid">${pageFields[state.page].map(f=>fieldHtml(f,content[f[0]])).join("")}<div class="editor-field full"><div class="panel-actions"><button type="button" class="admin-button ghost" id="saveDraft">Save draft</button><button type="submit" class="admin-button primary">Publish changes ↗</button></div></div></form></div>`;
    $$("[data-page]",panel).forEach(b=>b.addEventListener("click",()=>{state.page=b.dataset.page;renderPages(panel,rows);}));
    const form=$("#pageForm",panel);
    const collect=()=>Object.fromEntries(new FormData(form).entries());
    $("#saveDraft",panel).addEventListener("click",async()=>{try{await post("pages","save",{data:{slug:state.page,content:collect()}});toast("Draft saved.");await loadView("pages");}catch(e){toast(e.message,true);}});
    form.addEventListener("submit",async e=>{e.preventDefault();try{await post("pages","publish",{data:{slug:state.page,content:collect()}});toast("Page published. Your live website is updated.");await loadView("pages");}catch(error){toast(error.message,true);}});
  }
  function fieldHtml(field,value){
    const [key,label,type="text",options]=field;
    const full=type==="textarea"||type==="image";
    if(type==="textarea")return `<div class="editor-field full"><label>${esc(label)}</label><textarea name="${esc(key)}">${esc(Array.isArray(value)?value.join("\n"):(value||""))}</textarea></div>`;
    if(type==="checkbox")return `<div class="editor-field"><label class="check-field"><input type="checkbox" name="${esc(key)}" ${value?"checked":""}> ${esc(label)}</label></div>`;
    if(type==="select")return `<div class="editor-field"><label>${esc(label)}</label><select name="${esc(key)}">${options.map(o=>`<option value="${esc(o)}" ${value===o?"selected":""}>${esc(o)}</option>`).join("")}</select></div>`;
    if(type==="image")return `<div class="editor-field full"><label>${esc(label)}</label><div class="image-input-row"><input name="${esc(key)}" value="${esc(Array.isArray(value)?value.join("\n"):(value||""))}" placeholder="Upload or paste an image URL"><button type="button" class="admin-button ghost" data-pick-image="${esc(key)}">Choose media</button></div></div>`;
    return `<div class="editor-field"><label>${esc(label)}</label><input name="${esc(key)}" type="${type==="number"?"number":"text"}" value="${esc(value??"")}"></div>`;
  }
  function openEditor(resource,item){
    state.editorResource=resource;state.editorItem=item;
    const fields=recordFields[resource];
    $("#editorTitle").textContent=(item?"Edit ":"Add ")+(resource==="portfolio"?"project":resource==="services"?"service":resource==="faqs"?"FAQ":"testimonial");
    $("#editorFields").innerHTML=`<div class="editor-grid">${fields.map(f=>fieldHtml(f,item?.[f[0]])).join("")}</div>`;
    const form=$("#editorForm");form.dataset.resource=resource;form.dataset.id=item?.id||"";
    $$("[data-pick-image]",form).forEach(b=>b.addEventListener("click",()=>openMediaPicker(b.dataset.pickImage,form)));
    const titleInput=form.querySelector('[name="title"]');const slugInput=form.querySelector('[name="slug"]');
    if(titleInput&&slugInput&&!item?.slug){titleInput.addEventListener("input",()=>{slugInput.value=titleInput.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");});}
    $("#editorDialog").showModal();
  }
  $("#editorForm").addEventListener("submit",async e=>{
    e.preventDefault();const form=e.currentTarget;const resource=form.dataset.resource;const fields=recordFields[resource];const data={id:form.dataset.id||undefined};
    fields.forEach(f=>{const el=form.elements[f[0]];if(!el)return;const type=f[2]||"text";data[f[0]]=type==="checkbox"?el.checked:type==="number"?Number(el.value||0):type==="textarea"&&["gallery","deliverables"].includes(f[0])?el.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean):el.value;});
    try{await post(resource,"save",{data});$("#editorDialog").close();toast("Changes saved.");await loadView(resource);}catch(error){toast(error.message,true);}
  });
  $$("[data-close-dialog]").forEach(b=>b.addEventListener("click",()=>$("#editorDialog").close()));
  async function deleteItem(resource,id){if(!confirm("Delete this item? A copy will be kept in the revision history."))return;try{await post(resource,"delete",{id});toast("Item deleted.");await loadView(resource);}catch(e){toast(e.message,true);}}

  function renderSettings(panel,settings){
    panel.innerHTML=heading("Website settings","Manage the brand identity, contact information, SEO and social links without editing source files.")
      +settingGroups.map(group=>`<div class="panel-card settings-section"><h3>${esc(group.title)}</h3><form class="settings-form" data-settings-group>${group.fields.map(f=>{
        const [key,label,type="text",options]=f;const value=settings[key]??"";
        if(type==="textarea")return `<label class="full">${esc(label)}<textarea name="${key}">${esc(value)}</textarea></label>`;
        if(type==="select")return `<label>${esc(label)}<select name="${key}">${options.map(o=>`<option ${value===o?"selected":""}>${o}</option>`).join("")}</select></label>`;
        if(type==="image")return `<label class="full">${esc(label)}<div class="image-input-row"><input name="${key}" value="${esc(value)}" placeholder="Upload or paste URL"><button type="button" class="admin-button ghost" data-pick-image="${key}">Choose media</button></div></label>`;
        if(type==="color")return `<label>${esc(label)}<input type="color" name="${key}" value="${esc(value||"#17191f")}"></label>`;
        return `<label>${esc(label)}<input name="${key}" value="${esc(value)}"></label>`;
      }).join("")}<div class="full"><button class="admin-button primary" type="submit">Save ${esc(group.title.toLowerCase())}</button></div></form></div>`).join("");
    $$("[data-settings-group]",panel).forEach(form=>{
      $$("[data-pick-image]",form).forEach(b=>b.addEventListener("click",()=>openMediaPicker(b.dataset.pickImage,form)));
      form.addEventListener("submit",async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form).entries());try{await post("settings","save",{data});toast("Website settings saved.");}catch(error){toast(error.message,true);}});
    });
  }

  async function uploadFiles(fileList){
    const files=Array.from(fileList||[]);if(!files.length)return;
    try{
      toast("Uploading files…");
      const {upload}=await import("https://esm.sh/@vercel/blob@2.0.0/client");
      for(const file of files){
        const blob=await upload(file.name,file,{access:"public",handleUploadUrl:"/api/upload"});
        await post("media","create",{data:{url:blob.url,pathname:blob.pathname,filename:file.name,content_type:file.type,size_bytes:file.size}});
      }
      toast("Upload complete.");await loadView("media");
    }catch(error){toast(error.message||"Upload failed. Check that Vercel Blob is connected.",true);}
  }
  function renderMedia(panel,items){
    state.media=items||[];
    panel.innerHTML=heading("Media library","Upload and reuse images, logos, profile photos, screenshots and videos.",`<label class="admin-button primary">＋ Upload files<input id="mediaUpload" type="file" accept="image/*,video/mp4,video/webm" multiple hidden></label>`)
      +(items.length?`<div class="media-grid">${items.map(item=>`<article class="media-card"><div class="media-thumb">${String(item.content_type||"").startsWith("video/")?`<video src="${esc(item.url)}" muted></video>`:`<img src="${esc(item.url)}" alt="${esc(item.alt_text||item.filename)}" loading="lazy">`}</div><div class="media-meta"><strong>${esc(item.filename||"Uploaded file")}</strong><small>${esc(item.content_type||"file")} · ${Math.round((Number(item.size_bytes)||0)/1024)} KB</small><div class="media-actions"><button class="text-button" data-copy="${esc(item.url)}">Copy URL</button><button class="text-button delete" data-media-delete="${item.id}">Delete</button></div></div></article>`).join("")}</div>`:`<div class="empty-state">Your media library is empty. Upload a logo, profile picture or portfolio image to get started.</div>`);
    $("#mediaUpload",panel)?.addEventListener("change",e=>uploadFiles(e.target.files));
    $$("[data-copy]",panel).forEach(b=>b.addEventListener("click",async()=>{await navigator.clipboard.writeText(b.dataset.copy);toast("Media URL copied.");}));
    $$("[data-media-delete]",panel).forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Delete this file from the media library and storage?"))return;try{await post("media","delete",{id:b.dataset.mediaDelete});toast("File deleted.");await loadView("media");}catch(e){toast(e.message,true);}}));
  }
  async function openMediaPicker(field,form){
    state.mediaTarget={field,form};try{state.media=await get("media");}catch(e){toast(e.message,true);return;}
    const box=$("#mediaPicker");
    box.innerHTML=state.media.length?state.media.map(item=>`<button type="button" class="media-pick" data-select-media="${item.id}"><img src="${esc(item.url)}" alt=""><span>${esc(item.filename||"Media")}</span></button>`).join(""):`<div class="empty-state">No media uploaded yet. Close this window and upload a file in Media library.</div>`;
    $$("[data-select-media]",box).forEach(b=>b.addEventListener("click",()=>{
      const item=state.media.find(x=>String(x.id)===b.dataset.selectMedia);
      const input=state.mediaTarget.form.querySelector(`[name="${state.mediaTarget.field}"]`);
      if(input&&item)input.value=item.url;
      $("#mediaDialog").close();
    }));
    $("#mediaDialog").showModal();
  }
  $$("[data-close-media]").forEach(b=>b.addEventListener("click",()=>$("#mediaDialog").close()));

  function renderLeads(panel,items){
    panel.innerHTML=heading("Website enquiries","Every contact form submission is stored here. Update the status and keep your follow-up notes.")
      +(items.length?`<div class="panel-card"><div class="table-wrap"><table class="admin-table"><thead><tr><th>Contact</th><th>Request</th><th>Message</th><th>Status / notes</th><th>Received</th></tr></thead><tbody>${items.map(x=>`<tr><td><span class="table-title">${esc(x.name)}</span><span class="table-sub">${esc(x.email)}</span></td><td>${esc(x.service)}<span class="table-sub">${esc(x.budget)}</span></td><td>${esc(x.message)}</td><td><select data-lead-status="${x.id}" class="lead-status">${["new","contacted","in_progress","completed","archived"].map(s=>`<option value="${s}" ${x.status===s?"selected":""}>${s.replace("_"," ")}</option>`).join("")}</select><textarea class="lead-note" data-lead-notes="${x.id}" placeholder="Follow-up notes…">${esc(x.notes||"")}</textarea><button class="text-button" data-save-lead="${x.id}">Save</button></td><td>${new Date(x.created_at).toLocaleString()}</td></tr>`).join("")}</tbody></table></div></div>`:`<div class="empty-state">No enquiries have been received yet.</div>`);
    $$("[data-save-lead]",panel).forEach(b=>b.addEventListener("click",async()=>{const id=b.dataset.saveLead;try{await post("leads","update",{id,status:$(`[data-lead-status="${id}"]`,panel).value,notes:$(`[data-lead-notes="${id}"]`,panel).value});toast("Enquiry updated.");}catch(e){toast(e.message,true);}}));
  }
  function renderActivity(panel,data){
    const logs=data.logs||[],revs=data.revisions||[];
    panel.innerHTML=heading("Activity & revisions","Review administrator actions and restore earlier versions of editable content.")
      +`<div class="panel-card"><h3>Recent activity</h3>${logs.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Action</th><th>Section</th><th>Details</th><th>By</th><th>Date</th></tr></thead><tbody>${logs.map(x=>`<tr><td>${esc(x.action)}</td><td>${esc(x.entity_type)}</td><td>${esc(x.summary)}</td><td>${esc(x.email||"System")}</td><td>${new Date(x.created_at).toLocaleString()}</td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state">No activity recorded yet.</div>`}</div>`
      +`<div class="panel-card"><h3>Saved revisions</h3>${revs.length?`<div class="table-wrap"><table class="admin-table"><thead><tr><th>Section</th><th>Item</th><th>Saved by</th><th>Date</th><th></th></tr></thead><tbody>${revs.map(x=>`<tr><td>${esc(x.entity_type)}</td><td>${esc(x.entity_id)}</td><td>${esc(x.email||"Administrator")}</td><td>${new Date(x.created_at).toLocaleString()}</td><td><button class="text-button" data-restore="${x.id}">Restore this version</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty-state">Previous versions will appear here when you edit content.</div>`}</div>`;
    $$("[data-restore]",panel).forEach(b=>b.addEventListener("click",async()=>{if(!confirm("Restore this earlier version? The current version will remain in the revision history."))return;try{await post("activity","restore",{id:b.dataset.restore});toast("Previous version restored.");await loadView("activity");}catch(e){toast(e.message,true);}}));
  }

  checkAuth();
})();
