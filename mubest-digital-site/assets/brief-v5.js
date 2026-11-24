/* Premium V5 guided project enquiry — stored by existing Neon leads API */
(function MubestProjectBriefV5(){
  'use strict';
  const form=document.querySelector('#v5ProjectBrief');
  if(!form)return;
  const $=(s,r=form)=>r.querySelector(s),$$=(s,r=form)=>[...r.querySelectorAll(s)];
  const steps=$$('.v5-brief-step'),stageIndicators=$$('[data-v5-stage]',document),progress=$('.v5-progress-track');
  const next=$('#v5BriefNext'),previous=$('#v5BriefBack'),submit=$('#v5BriefSubmit'),feedback=$('#v5BriefError');
  const contactMethod=$('#v5ContactMethod'),whatsappBox=$('#v5WhatsappField'),whatsappInput=$('#v5Whatsapp');
  const consent=$('[name="consent"]');
  let index=0,busy=false;
  const url=new URLSearchParams(location.search);
  const prefill=url.get('service')||'';
  const AI_DRAFT_KEY="mubest_ai_brief_v2";
  function readApprovedAiDraft(){
    if(url.get("from")!=="ai")return null;
    try{
      const x=JSON.parse(sessionStorage.getItem(AI_DRAFT_KEY)||"null");
      if(!x||x.version!==2||x.source!=="mubest-ai-v2"||x.approved!==true||Date.now()-Number(x.createdAt)>2*60*60*1000||Number(x.createdAt)>Date.now()+60000)return null;
      return {
        services:Array.isArray(x.services)?x.services.filter(v=>typeof v==="string").slice(0,8):[],
        goals:typeof x.goals==="string"?x.goals.slice(0,1800):"",
        projectType:typeof x.projectType==="string"?x.projectType:"",
        timeline:typeof x.timeline==="string"?x.timeline:"",
        budget:typeof x.budget==="string"?x.budget:""
      };
    }catch{return null;}
  }
  const approvedAiDraft=readApprovedAiDraft();
  function importApprovedAiDraft(draft){
    if(!draft)return;
    const options=$$('input[name="service_choice"]');
    const normalized=value=>String(value||"").trim().toLowerCase();
    options.forEach(input=>{input.checked=draft.services.some(item=>normalized(input.value)===normalized(item));});
    if(!options.some(input=>input.checked)){
      const unknown=options.find(input=>/not sure yet/i.test(input.value));
      if(unknown)unknown.checked=true;
    }
    const select=(name,value)=>{
      const element=form.elements[name];
      if(element&&[...element.options].some(option=>option.value===value))element.value=value;
    };
    const goals=form.elements.goals;
    if(goals)goals.value=draft.goals;
    select("project_type",draft.projectType);
    select("timeline",draft.timeline);
    select("budget",draft.budget);
    const note=document.createElement("section");
    note.className="v2-ai-handover-note";
    note.setAttribute("role","status");
    const title=document.createElement("strong");
    title.textContent="Your Mubest AI draft is ready for review.";
    const paragraph=document.createElement("p");
    paragraph.textContent="Only the services and notes you approved were brought into this form. Check every detail, complete any missing fields, then decide whether to submit. No enquiry has been sent.";
    const discard=document.createElement("button");
    discard.type="button";discard.textContent="Clear imported notes";
    discard.addEventListener("click",()=>{
      try{sessionStorage.removeItem(AI_DRAFT_KEY);}catch{}
      options.forEach(input=>{input.checked=false;});
      const unknown=options.find(input=>/not sure yet/i.test(input.value));
      if(unknown)unknown.checked=true;
      if(goals)goals.value="";
      ["project_type","timeline","budget"].forEach(name=>{const el=form.elements[name];if(el)el.value="";});
      note.remove();updateBriefReview();show(0,false);
    });
    note.append(title,paragraph,discard);
    const progress=form.querySelector(".v5-brief-progress");
    if(progress)progress.before(note);else form.prepend(note);
  }

  const callRequested=$('#v6CallRequested'),callFields=$('#v6CallFields');
  const callDate=$('#v6CallDate'),callWindow=$('#v6CallWindow'),callTimezone=$('#v6CallTimezone');
  if(callDate){
    const now=new Date();
    const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    callDate.min=today;
  }
  if(callTimezone && !callTimezone.value){
    try{callTimezone.value=Intl.DateTimeFormat().resolvedOptions().timeZone||'';}catch{}
  }
  function syncCallRequest(){
    if(!callRequested||!callFields)return;
    const active=callRequested.checked;
    callFields.hidden=!active;
    if(callWindow)callWindow.required=active;
    if(callTimezone)callTimezone.required=active;
  }
  callRequested?.addEventListener('change',syncCallRequest);
  if(callRequested && url.get('call')==='1')callRequested.checked=true;
  syncCallRequest();
  const normalized=v=>String(v||'').trim().toLowerCase();
  if(prefill){
    const key=normalized(prefill);
    const candidates=$$('input[name="service_choice"]');
    const exact=candidates.find(input=>normalized(input.value)===key);
    const fuzzy=candidates.find(input=>{
      const q=normalized(input.value);
      return (key.includes('klaviyo')||key.includes('email'))&&q.includes('email')||(key.includes('shopify')||key.includes('ecommerce')||key.includes('etsy'))&&q.includes('ecommerce')||(key.includes('web')||key.includes('landing page'))&&q.includes('website')||(key.includes('video')||key.includes('social'))&&q.includes('social media')||(key.includes('book')||key.includes('publishing'))&&q.includes('not sure')||(key.includes('ads')||key.includes('seo'))&&q.includes('seo')||(key.includes('brand')||key.includes('graphic'))&&q.includes('branding')||(key.includes('integration')||key.includes('automation'))&&q.includes('integrations');
    });
    if(exact||fuzzy)(exact||fuzzy).checked=true;
  }
  const selected=()=>$$('input[name="service_choice"]:checked').map(input=>input.value);
  function updateBriefReview(){
    const names=selected();
    const title=$('#v6SelectedServices'),scope=$('#v6SelectedScope');
    if(!title||!scope)return;
    title.textContent=names.length?names.join('  ·  '):'No services selected yet';
    const details=[form.elements.project_type?.value,form.elements.timeline?.value,form.elements.budget?.value].filter(Boolean);
    scope.textContent=details.length?details.join('  •  '):'You can review and change your scope before sending.';
  }
  function error(message){
    feedback.hidden=!message;
    feedback.textContent=message||'';
    if(message)feedback.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function show(step,moveFocus=true){
    index=Math.max(0,Math.min(steps.length-1,step));
    steps.forEach((el,n)=>el.hidden=n!==index);
    stageIndicators.forEach((el,n)=>{
      el.classList.toggle('active',n===index);
      el.classList.toggle('completed',n<index);
      el.setAttribute('aria-current',n===index?'step':'false');
    });
    const percent=Math.round((index+1)/steps.length*100);
    $('#v5ProgressLabel').textContent='STEP '+String(index+1).padStart(2,'0')+' OF 0'+steps.length;
    $('#v5ProgressPercent').textContent=percent+'% complete';
    $('#v5ProgressFill').style.width=percent+'%';
    progress?.setAttribute('aria-valuenow',String(index+1));
    previous.hidden=index===0;
    next.hidden=index===steps.length-1;
    submit.hidden=index!==steps.length-1;
    error('');
    if(index===3)updateBriefReview();
    if(moveFocus)steps[index].querySelector('h2')?.setAttribute('tabindex','-1');
    if(moveFocus)steps[index].querySelector('h2')?.focus({preventScroll:true});
  }
  function validate(step){
    if(step===0){
      if(!selected().length){error('Choose at least one service. You can select “Not sure yet”.');return false;}
      return true;
    }
    const required=$$('input,select,textarea',steps[step]).filter(el=>!el.disabled&&el.hasAttribute('required'));
    for(const input of required){
      if(input.type==='checkbox'?!input.checked:!input.checkValidity()){
        error(input.validationMessage||'Please complete the required field before continuing.');
        input.focus();return false;
      }
    }
    const urlInput=step===1?$('#v5CurrentSite'):null;
    if(urlInput?.value&&!urlInput.checkValidity()){error('Enter a valid website URL beginning with https://');urlInput.focus();return false;}
    if(step===3&&callRequested?.checked&&callDate?.value&&!callDate.checkValidity()){
      error('Choose a valid preferred call date in the future, or leave the date blank for flexibility.');
      callDate.focus();return false;
    }
    if(step===3&&contactMethod.value==='WhatsApp'&&whatsappInput.value.trim().length<8){
      error('Add your WhatsApp number or choose Email as the preferred reply method.');
      whatsappInput.focus();return false;
    }
    return true;
  }
  next.addEventListener('click',()=>{if(validate(index))show(index+1);});
  previous.addEventListener('click',()=>show(index-1));
  $('#v6EditServices')?.addEventListener('click',()=>show(0));
  form.addEventListener('change',updateBriefReview);
  contactMethod.addEventListener('change',()=>{
    whatsappBox.hidden=contactMethod.value!=='WhatsApp';
    whatsappInput.required=contactMethod.value==='WhatsApp';
    if(whatsappBox.hidden)whatsappInput.value='';
  });
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy)return;
    if(index<steps.length-1){if(validate(index))show(index+1);return;}
    for(let step=0;step<steps.length;step++)if(!validate(step)){show(step);validate(step);return;}
    if(!consent.checked){error('Please confirm that we may contact you about this project.');consent.focus();return;}
    const get=name=>String(form.elements[name]?.value||'').trim();
    const services=selected();
    const message=[
      'MUBEST DIGITAL — GUIDED PROJECT BRIEF',
      'Services requested: '+services.join('; '),
      'Project situation: '+get('project_type'),
      'Ideal timeline: '+get('timeline'),
      'Estimated budget: '+get('budget'),
      'Business or organization: '+(get('company')||'Not provided'),
      'Current website: '+(get('current_site')||'Not provided'),
      'Preferred reply: '+get('preferred_method'),
      'WhatsApp (if requested): '+(get('whatsapp_number')||'Not provided'),
      'Discovery call request: '+(callRequested?.checked?'Yes — please arrange a call':'No'),
      ...(callRequested?.checked?[
        'Preferred call date: '+(get('preferred_call_date')||'Flexible'),
        'Preferred call time window: '+(get('preferred_call_window')||'Not specified'),
        'Visitor timezone: '+(get('preferred_call_timezone')||'Not specified'),
        'Call status: Request only; date and time are not booked or confirmed'
      ]:[]),
      '',
      'GOALS AND REQUIREMENTS:',
      get('goals'),
      '',
      'ADDITIONAL NOTES:',
      get('extra')||'None'
    ].join('\n').slice(0,4900);
    const payload={
      name:get('name'),email:get('email'),service:services.join(', ').slice(0,180),
      budget:get('budget'),message,website:''
    };
    busy=true;submit.disabled=true;submit.textContent='Sending your brief…';error('');
    try{
      const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const body=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(body.error||'Something went wrong. Please try again.');
      document.querySelector('.v5-brief-section').hidden=true;
      document.querySelector('#v5BriefSuccess').hidden=false;
      form.reset();
      if(approvedAiDraft){try{sessionStorage.removeItem(AI_DRAFT_KEY);}catch{}}
      window.scrollTo({top:document.querySelector('#v5BriefSuccess').getBoundingClientRect().top+window.scrollY-95,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    }catch(e){
      error(e.message||'Your brief could not be sent. Please try again.');
      submit.disabled=false;submit.textContent='Send my project brief ↗';
    }finally{busy=false;}
  });
  if(approvedAiDraft)importApprovedAiDraft(approvedAiDraft);
  show(0,false);
})();
