/* Mubest Digital · conversational AI widget (no personal ChatGPT data or API keys in browser) */
(function MubestAiWidget(){
  "use strict";
  if(window.MubestAiWidgetInitialized || new URLSearchParams(location.search).has("mubest-editor") || location.pathname.startsWith("/admin/"))return;
  window.MubestAiWidgetInitialized=true;
  const ENDPOINT="/api/ai-chat", STORAGE_KEY="mubest_ai_chat_session_v1";
  const icons={
    spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m12 2 2.7 7.3L22 12l-7.3 2.7L12 22l-2.7-7.3L2 12l7.3-2.7Z"/></svg>',
    send:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v14"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 12h16m-7-7 7 7-7 7"/></svg>',
    copy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>',
    reset:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>'
  };
  const escape=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  let config=null,dialog=null,launcher=null,history=[],busy=false,abort=null,previousFocus=null;
  let lastInsights=null,briefDialog=null;
  const INSIGHTS_KEY="mubest_ai_insights_v2",BRIEF_KEY="mubest_ai_brief_v2";
  const $=(s,root=document)=>root.querySelector(s);
  function readSession(){
    try{
      const state=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||"[]");
      return Array.isArray(state)?state.filter(x=>x&&["user","assistant"].includes(x.role)&&typeof x.content==="string").slice(-14).map(x=>({role:x.role,content:x.content.slice(0,3500)})):[];
    }catch{return [];}
  }
  function saveSession(){try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(history.slice(-14)));}catch{}}
  function appendTextWithLinks(element,text){
    // Never interpret the model's raw content as HTML. Only same-site Markdown links become anchors.
    const markdown=/\[([^\]]{1,100})\]\(([^()\s]{1,360})\)/g;
    let from=0,match;
    while((match=markdown.exec(text))!==null){
      element.append(document.createTextNode(text.slice(from,match.index)));
      let dest;try{dest=new URL(match[2],location.origin);}catch{dest=null;}
      if(dest && dest.origin===location.origin && ["http:","https:"].includes(dest.protocol)){
        const a=document.createElement("a");a.href=dest.pathname+dest.search+dest.hash;a.textContent=match[1];element.append(a);
      }else element.append(document.createTextNode(match[0]));
      from=match.index+match[0].length;
    }
    element.append(document.createTextNode(text.slice(from)));
  }
  function renderAssistantText(node,text){
    node.replaceChildren();
    const sections=String(text||"").split(/\n{2,}/).slice(0,14);
    for(const section of sections){
      // Plain line-by-line presentation for services; never display raw Markdown
      // list markers such as "* Website Design" or "**Email Marketing**".
      let paragraph=null,linesGroup=null;
      for(const rawLine of section.split("\n")){
        const item=rawLine.match(/^\s*(?:[*•-]\s+|\d+[.)]\s+)(.*)$/);
        const content=(item?item[1]:rawLine).replace(/\*\*/g,"");
        if(item){
          paragraph=null;
          if(!linesGroup){
            linesGroup=document.createElement("div");
            linesGroup.className="md-ai-clean-list";
            node.append(linesGroup);
          }
          const line=document.createElement("div");
          line.className="md-ai-clean-line";
          appendTextWithLinks(line,content);
          linesGroup.append(line);
        }else{
          linesGroup=null;
          if(!paragraph){
            paragraph=document.createElement("p");
            node.append(paragraph);
          }else paragraph.append(document.createElement("br"));
          appendTextWithLinks(paragraph,content);
        }
      }
    }
  }
  const safeLocal=url=>{
    if(typeof url!=="string"||!url.startsWith("/")||url.startsWith("//"))return "";
    try{const u=new URL(url,location.origin);return u.origin===location.origin?u.pathname+u.search+u.hash:"";}catch{return "";}
  };
  function readLastInsights(){
    try{
      const data=JSON.parse(sessionStorage.getItem(INSIGHTS_KEY)||"null");
      return data&&typeof data==="object"&&Array.isArray(data.services)&&Array.isArray(data.projects)?data:null;
    }catch{return null;}
  }
  function persistLastInsights(){
    try{
      if(lastInsights)sessionStorage.setItem(INSIGHTS_KEY,JSON.stringify(lastInsights));
      else sessionStorage.removeItem(INSIGHTS_KEY);
    }catch{}
  }
  function renderGroundedCards(bubble,data){
    if(!data||!bubble||bubble.querySelector(".md-ai-grounded"))return;
    const services=Array.isArray(data.services)?data.services.slice(0,2):[];
    const projects=Array.isArray(data.projects)?data.projects.slice(0,2):[];
    const sections=[["Relevant services",services,"name"],["Published portfolio",projects,"title"]];
    const cardWrap=document.createElement("div");cardWrap.className="md-ai-grounded";
    for(const [heading,items,titleKey] of sections){
      const approved=items.filter(item=>safeLocal(item?.url)&&typeof item?.[titleKey]==="string");
      if(!approved.length)continue;
      const section=document.createElement("section");section.className="md-ai-grounded-section";
      const label=document.createElement("strong");label.className="md-ai-grounded-heading";label.textContent=heading;section.append(label);
      for(const item of approved){
        const a=document.createElement("a");a.className="md-ai-grounded-card";a.href=safeLocal(item.url);
        const content=document.createElement("span");content.className="md-ai-grounded-card-text";
        const title=document.createElement("b");title.textContent=String(item[titleKey]).slice(0,120);
        const summary=document.createElement("small");summary.textContent=String(item.summary||"").slice(0,165);
        content.append(title,summary);
        const arrow=document.createElement("span");arrow.className="md-ai-grounded-arrow";arrow.textContent="↗";arrow.setAttribute("aria-hidden","true");
        a.append(content,arrow);section.append(a);
      }
      cardWrap.append(section);
    }
    if(cardWrap.childElementCount)bubble.append(cardWrap);
  }
  const briefChoices=[
    "Website Design & Development","Shopify & Ecommerce","Email Marketing & Automation",
    "Branding & Graphic Design","Social Media & Content","SEO & Digital Marketing",
    "Integrations & Custom Systems","Not sure yet / Something else"
  ];
  function updateHandoverButton(){
    const bar=$("#md-ai-handover",dialog);
    if(!bar)return;
    const shown=Boolean(config?.intelligence?.handover)&&history.some(item=>item.role==="user");
    bar.hidden=!shown;
    const button=$("#md-ai-prepare-brief",bar);
    if(button)button.disabled=busy;
  }
  function suggestedChoices(){
    const text=history.filter(x=>x.role==="user").slice(-5).map(x=>x.content).join(" ").toLowerCase();
    const names=(lastInsights?.services||[]).map(s=>String(s.name||"").toLowerCase()).join(" ");
    const source=text+" "+names,selected=[];
    const rules=[
      [/web(site|sites)?|wordpress|wix|landing page|webflow|redesign/,0],
      [/shopify|ecommerce|e-commerce|etsy|online store|storefront|checkout/,1],
      [/klaviyo|email|newsletter|abandoned cart|customer retention/,2],
      [/brand|graphic|logo|visual identity/,3],
      [/social|tiktok|instagram|video|content creation|reels/,4],
      [/seo|search engine|advertising|google ads|rankings|paid ads/,5],
      [/integrat|custom system|app development|api|automation workflow/,6]
    ];
    for(const [rx,index] of rules)if(rx.test(source))selected.push(briefChoices[index]);
    return selected.length?selected:[briefChoices[7]];
  }
  function buildBriefDialog(){
    if(briefDialog||!config?.intelligence?.handover)return;
    briefDialog=document.createElement("dialog");briefDialog.className="md-ai-brief-dialog";
    briefDialog.setAttribute("aria-labelledby","md-ai-brief-title");
    briefDialog.innerHTML=
      '<form id="md-ai-brief-review" class="md-ai-brief-review">'+
      '<div class="md-ai-brief-head"><span>PROJECT HANDOVER</span><button type="button" id="md-ai-brief-close" aria-label="Close project brief">×</button></div>'+
      '<h2 id="md-ai-brief-title">Review your project notes.</h2>'+
      '<p id="md-ai-brief-intro"></p>'+
      '<fieldset class="md-ai-brief-services"><legend>What would you like help with?</legend><div id="md-ai-brief-service-list"></div></fieldset>'+
      '<label class="md-ai-brief-field">Your goals or project idea<textarea name="goals" rows="4" maxlength="1800" placeholder="Describe the result you want, the current situation, and any important features."></textarea></label>'+
      '<div class="md-ai-brief-two">'+
      '<label class="md-ai-brief-field">Project stage<select name="projectType"><option value="">Choose on the next page</option><option>A completely new project</option><option>Redesign or improvement of something existing</option><option>Ongoing support or management</option><option>Not sure yet</option></select></label>'+
      '<label class="md-ai-brief-field">Ideal timeline<select name="timeline"><option value="">Choose on the next page</option><option>As soon as reasonably possible</option><option>Within 2–4 weeks</option><option>Within 1–3 months</option><option>Flexible / exploring options</option></select></label>'+
      '</div>'+
      '<label class="md-ai-brief-field">Estimated budget<select name="budget"><option value="">Choose on the next page</option><option>Under $250</option><option>$250–$500</option><option>$500–$1,000</option><option>$1,000–$2,500</option><option>$2,500–$5,000</option><option>$5,000+</option><option>Not sure yet</option></select></label>'+
      '<p class="md-ai-brief-notice">Only the fields you choose below are transferred within this browser tab. Your chat is not submitted as an enquiry. You can edit everything on the next page before agreeing to be contacted.</p>'+
      '<div class="md-ai-brief-actions"><button type="button" class="md-ai-brief-cancel" id="md-ai-brief-cancel">Keep chatting</button><button type="submit" class="md-ai-brief-continue">Review in project form ↗</button></div>'+
      '</form>';
    document.body.append(briefDialog);
    const serviceList=$("#md-ai-brief-service-list",briefDialog);
    briefChoices.forEach((name,index)=>{
      const label=document.createElement("label");label.className="md-ai-brief-choice";
      const input=document.createElement("input");input.type="checkbox";input.name="service";input.value=name;input.id="md-ai-v2-service-"+index;
      const span=document.createElement("span");span.textContent=name;label.append(input,span);serviceList.append(label);
    });
    const shut=()=>briefDialog.close();
    $("#md-ai-brief-close",briefDialog).addEventListener("click",shut);
    $("#md-ai-brief-cancel",briefDialog).addEventListener("click",shut);
    briefDialog.addEventListener("click",event=>{if(event.target===briefDialog)shut();});
    $("#md-ai-brief-review",briefDialog).addEventListener("submit",event=>{
      event.preventDefault();
      const form=event.currentTarget;
      const services=[...form.querySelectorAll('input[name="service"]:checked')].map(x=>x.value);
      if(!services.length){form.querySelector('input[name="service"]')?.focus();return;}
      const value=name=>String(form.elements[name]?.value||"").trim();
      const approved={
        version:2,source:"mubest-ai-v2",approved:true,createdAt:Date.now(),
        services,goals:value("goals").slice(0,1800),
        projectType:value("projectType"),timeline:value("timeline"),budget:value("budget")
      };
      try{sessionStorage.setItem(BRIEF_KEY,JSON.stringify(approved));}
      catch{alert("This browser could not save the draft. Please open the project form and fill it out manually.");return;}
      location.assign("/start-project/?from=ai");
    });
  }
  function openBriefReview(){
    if(!config?.intelligence?.handover)return;
    buildBriefDialog();
    if(!briefDialog?.showModal)return;
    $("#md-ai-brief-intro",briefDialog).textContent=config.intelligence.handoverIntro||"Review and edit your notes before continuing.";
    const choices=new Set(suggestedChoices());
    briefDialog.querySelectorAll('input[name="service"]').forEach(input=>{input.checked=choices.has(input.value);});
    // Use only messages the VISITOR actually typed. No guessed budget,
    // contact details, or assistant-generated claims are transferred.
    const texts=history.filter(x=>x.role==="user").slice(-5).map(x=>x.content.trim())
      .filter(x=>x.length>14&&!/^(what services|who is behind|can you show|how can i start|hi[!. ]*$)/i.test(x));
    const form=$("#md-ai-brief-review",briefDialog);
    form.elements.goals.value=texts.join("\n\n").slice(0,1800);
    form.elements.projectType.value="";
    form.elements.timeline.value="";
    form.elements.budget.value="";
    briefDialog.showModal();
  }

  function scrollToBottom(){const area=$("#md-ai-messages",dialog);if(area)area.scrollTop=area.scrollHeight;}
  function messageBubble(role,content,options={}){
    const wrap=document.createElement("div");wrap.className="md-ai-message md-ai-"+role;
    const meta=document.createElement("div");meta.className="md-ai-message-meta";
    meta.textContent=role==="assistant"?(config?.name||"Mubest AI"):"You";
    const text=document.createElement("div");text.className="md-ai-text";
    if(role==="assistant")renderAssistantText(text,content);else text.textContent=content;
    wrap.append(meta,text);
    if(role==="assistant"&&!options.pending){
      const copy=document.createElement("button");copy.type="button";copy.className="md-ai-copy";
      copy.setAttribute("aria-label","Copy assistant reply");copy.title="Copy reply";copy.innerHTML=icons.copy;
      copy.addEventListener("click",async()=>{
        try{await navigator.clipboard.writeText(text.innerText||content);copy.title="Copied";setTimeout(()=>copy.title="Copy reply",1500);}catch{}
      });
      wrap.append(copy);
    }
    $("#md-ai-messages",dialog)?.append(wrap);
    scrollToBottom();return {wrap,text};
  }
  function setBusy(on){
    busy=on;updateHandoverButton();
    const field=$("#md-ai-input",dialog),send=$("#md-ai-send",dialog);
    if(send)send.disabled=on||!field?.value.trim();
    if(field)field.disabled=on;
    if(on)dialog.classList.add("md-ai-thinking");else dialog.classList.remove("md-ai-thinking");
  }
  function updateInputHeight(){
    const input=$("#md-ai-input",dialog);if(!input)return;
    input.style.height="auto";
    input.style.height=Math.min(input.scrollHeight,126)+"px";
    $("#md-ai-send",dialog).disabled=busy||!input.value.trim();
  }
  function setSuggestions(visible){
    const el=$("#md-ai-suggestions",dialog);
    if(el)el.hidden=!visible;
  }
  function replay(){
    const area=$("#md-ai-messages",dialog);
    if(!area)return;
    area.replaceChildren();
    const welcome=document.createElement("div");welcome.className="md-ai-welcome";
    welcome.innerHTML='<div class="md-ai-welcome-mark">'+icons.spark+'</div><strong>Welcome to '+escape(config.name)+'</strong><p></p>';
    $("p",welcome).textContent=config.welcome;
    area.append(welcome);
    history.forEach(item=>messageBubble(item.role,item.content));
    const lastMessage=history.at(-1);
    if(lastMessage?.role==="assistant"&&lastInsights)
      renderGroundedCards(area.lastElementChild,lastInsights);
    setSuggestions(history.length===0);
    updateHandoverButton();
    scrollToBottom();
  }
  function open(){
    if(!dialog)return;
    previousFocus=document.activeElement;
    dialog.hidden=false;
    launcher.setAttribute("aria-expanded","true");
    document.body.classList.add("md-ai-open");
    $("#md-ai-input",dialog)?.focus({preventScroll:true});
    scrollToBottom();
  }
  function close(){
    if(!dialog)return;
    dialog.hidden=true;
    document.body.classList.remove("md-ai-open");
    launcher?.setAttribute("aria-expanded","false");
    if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
    else launcher?.focus({preventScroll:true});
  }
  function reset(){
    if(busy&&abort)abort.abort();
    history=[];saveSession();lastInsights=null;persistLastInsights();
    setBusy(false);
    if(dialog)replay();
    $("#md-ai-input",dialog).value="";
    updateInputHeight();
  }
  async function sendMessage(question){
    if(busy||!question?.trim())return;
    const prompt=question.trim().slice(0,1800);
    const input=$("#md-ai-input",dialog);
    input.value="";updateInputHeight();
    setSuggestions(false);
    messageBubble("user",prompt);
    history.push({role:"user",content:prompt});history=history.slice(-14);saveSession();
    const bubble=messageBubble("assistant","",{pending:true});
    bubble.wrap.classList.add("md-ai-pending");
    bubble.text.innerHTML='<span class="md-ai-typing" aria-label="Thinking"><i></i><i></i><i></i></span>';
    setBusy(true);
    abort=new AbortController();
    let answer="",finished=false,seenEvent=false,receivedInsights=null;
    try{
      const response=await fetch(ENDPOINT,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        cache:"no-store",
        body:JSON.stringify({messages:history}),
        signal:abort.signal
      });
      if(!response.ok){
        const payload=await response.json().catch(()=>({}));
        throw new Error(payload.error||"Sorry, the assistant couldn't connect. Please try again.");
      }
      if(!response.body)throw new Error("The chat connection didn't start correctly.");
      const reader=response.body.getReader();
      const decoder=new TextDecoder();
      let buffer="";
      while(true){
        const {done,value}=await reader.read();
        if(done)break;
        buffer+=decoder.decode(value,{stream:true});
        const blocks=buffer.split(/\r?\n\r?\n/);
        buffer=blocks.pop()||"";
        for(const block of blocks){
          const eventName=block.split(/\r?\n/).find(x=>x.startsWith("event:"))?.slice(6).trim()||"";
          const data=block.split(/\r?\n/).filter(x=>x.startsWith("data:")).map(x=>x.slice(5).trim()).join("\n");
          let event;try{event=JSON.parse(data||"{}");}catch{continue;}
          if(eventName==="delta"&&typeof event.text==="string"){
            seenEvent=true;answer+=event.text;bubble.wrap.classList.remove("md-ai-pending");
            renderAssistantText(bubble.text,answer);
            scrollToBottom();
          }else if(eventName==="insights"&&event&&typeof event==="object"){
            receivedInsights={
              services:Array.isArray(event.services)?event.services.slice(0,3):[],
              projects:Array.isArray(event.projects)?event.projects.slice(0,2):[]
            };
          }else if(eventName==="done"){finished=true;}
          else if(eventName==="error")throw new Error(event.message||"The chat was interrupted.");
        }
      }
      if(!answer.trim())throw new Error("The assistant didn't generate a reply. Please try again.");
      history.push({role:"assistant",content:answer.slice(0,3500)});
      history=history.slice(-14);saveSession();
      lastInsights=receivedInsights;persistLastInsights();
      if(finished&&lastInsights)renderGroundedCards(bubble.wrap,lastInsights);
      if(!finished)bubble.wrap.classList.add("md-ai-incomplete");
      const copy=document.createElement("button");copy.type="button";copy.className="md-ai-copy";copy.setAttribute("aria-label","Copy assistant reply");
      copy.innerHTML=icons.copy;
      copy.addEventListener("click",()=>navigator.clipboard?.writeText(answer).catch(()=>{}));
      bubble.wrap.append(copy);
    }catch(error){
      bubble.wrap.classList.remove("md-ai-pending");
      bubble.wrap.classList.add("md-ai-error-message");
      bubble.text.textContent=error.name==="AbortError"?"Response stopped.":error.message||"The assistant is temporarily unavailable.";
      if(error.name!=="AbortError"){
        const link=document.createElement("a");link.href="/contact/";link.textContent="Contact Mubest Digital instead ↗";
        bubble.text.append(document.createElement("br"),link);
      }
      if(!seenEvent){history=history.filter((_,i)=>i!==history.length-1);saveSession();}
    }finally{
      abort=null;setBusy(false);updateInputHeight();updateHandoverButton();scrollToBottom();
    }
  }
  function buildWidget(){
    const style=document.createElement("link");style.rel="stylesheet";style.href="/assets/ai-widget.css?v=logo2";style.dataset.mubestAiStyle="";document.head.append(style);
    history=readSession();lastInsights=readLastInsights();
    launcher=document.createElement("button");launcher.type="button";launcher.id="md-ai-launcher";launcher.className="md-ai-launcher";
    launcher.setAttribute("aria-haspopup","dialog");launcher.setAttribute("aria-controls","md-ai-panel");launcher.setAttribute("aria-expanded","false");
    launcher.setAttribute("aria-label","Chat with "+config.name);
    // Icon-only by default. Reveal the full assistant name on pointer hover
    // or keyboard focus; screen readers always have the accessible label.
    launcher.innerHTML='<span class="md-ai-launcher-icon" aria-hidden="true">'+icons.spark+'</span><span class="md-ai-launcher-text" aria-hidden="true">'+escape(config.name)+'</span><span class="md-ai-online-pip" aria-hidden="true"></span>';
    document.body.append(launcher);
    dialog=document.createElement("section");
    dialog.id="md-ai-panel";dialog.className="md-ai-panel";dialog.setAttribute("role","dialog");dialog.setAttribute("aria-modal","false");dialog.setAttribute("aria-label",config.name+" chat");dialog.hidden=true;
    dialog.innerHTML=
      '<header class="md-ai-header"><div class="md-ai-identity"><span class="md-ai-identity-icon">'+icons.spark+'</span><span><strong>'+escape(config.name)+'</strong><small><i></i> AI-powered · Here to help</small></span></div><div class="md-ai-header-actions"><button type="button" id="md-ai-clear" aria-label="Start a new conversation" title="New conversation">'+icons.reset+'</button><button type="button" id="md-ai-close" aria-label="Close assistant" title="Close">'+icons.close+'</button></div></header>'+
      '<div class="md-ai-messages" id="md-ai-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>'+
      '<div class="md-ai-suggestions" id="md-ai-suggestions"><span>TRY ASKING</span><div class="md-ai-suggestion-list"></div></div>'+
      '<div class="md-ai-handover" id="md-ai-handover" hidden><button type="button" id="md-ai-prepare-brief">Prepare a project brief ↗</button><span>Review before sharing</span></div>'+
      '<form class="md-ai-composer" id="md-ai-form"><label class="md-ai-sr-only" for="md-ai-input">Your message</label><div class="md-ai-entry"><textarea id="md-ai-input" placeholder="Ask about services, projects, or an idea…" rows="1" maxlength="1800"></textarea><button type="submit" id="md-ai-send" aria-label="Send message" disabled>'+icons.send+'</button></div><p>Powered by GroqCloud. AI can make mistakes. Avoid private or confidential details. <a href="/start-project/">Start a project ↗</a></p></form>';
    document.body.append(dialog);
    launcher.addEventListener("click",()=>dialog.hidden?open():close());
    $("#md-ai-close",dialog).addEventListener("click",close);
    $("#md-ai-clear",dialog).addEventListener("click",reset);
    $("#md-ai-prepare-brief",dialog).addEventListener("click",openBriefReview);
    const suggestions=$(".md-ai-suggestion-list",dialog);
    (config.suggestions||[]).slice(0,4).forEach(label=>{
      const button=document.createElement("button");button.type="button";button.textContent=label;
      button.addEventListener("click",()=>sendMessage(label));suggestions.append(button);
    });
    const input=$("#md-ai-input",dialog);
    input.addEventListener("input",updateInputHeight);
    input.addEventListener("keydown",event=>{
      if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();if(!busy)sendMessage(input.value);}
    });
    $("#md-ai-form",dialog).addEventListener("submit",event=>{event.preventDefault();sendMessage(input.value);});
    dialog.addEventListener("keydown",event=>{if(event.key==="Escape"){event.stopPropagation();close();}});
    replay();
  }
  async function init(){
    try{
      const response=await fetch(ENDPOINT,{cache:"no-store"});
      if(!response.ok)return;
      const body=await response.json();
      if(!body.available)return;
      config={
        name:String(body.name||"Mubest AI").slice(0,48),
        welcome:String(body.welcome||"Hi! How can I help?").slice(0,280),
        suggestions:Array.isArray(body.suggestions)?body.suggestions:[],
        intelligence:body.intelligence&&typeof body.intelligence==="object"?body.intelligence:{}
      };
      buildWidget();
    }catch(error){console.warn("Mubest AI widget unavailable:",error?.name||"network");}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
