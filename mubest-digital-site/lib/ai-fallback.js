// Deterministic answers from published website content only; no model requests.
const clean=(v,n=300)=>String(v??'').trim().slice(0,n);
const link=(title,path)=>'['+clean(title,150).replace(/[\[\]\r\n]/g,'')+']('+path+')';
const words=s=>new Set((String(s).toLowerCase().match(/[a-z0-9]{3,}/g)||[]).filter(t=>!['what','does','can','you','your','the','and','for','with','have','help','mubest','digital','would','could','please','tell','about','need','want','offer','services','service','project','projects','work','show','some'].includes(t)));
const safeSlug=s=>/^[a-z0-9_-]{1,180}$/i.test(String(s||''));
export function isServiceList(question){return /\b(?:what (?:services? (?:do|does|can)|(?:do|can) you (?:do|offer)|does mubest(?: digital)? (?:do|offer))|(?:list|show|all|your|available|our) (?:all )?services|services (?:offered|available)|services does mubest)\b/i.test(question)||/^(?:services|what services|service list)[?.!\s]*$/i.test(question);}
export function fallbackAnswer({messages=[],services=[],projects=[],faqs=[],settings={},insights={},directOnly=false}){
 const q=clean(messages.filter(m=>m.role==='user').at(-1)?.content,1800),brand=clean(settings.site_name||'Mubest Digital',100);
 if(isServiceList(q)&&services.length){return brand+' offers the following service categories:\n\n'+services.map(s=>clean(s.title,160)).join('\n')+'\n\n'+link('Explore all services','/services/')+' or tell me which service you need help with.';}
 if(directOnly)return null;
 const prefix='I can help with published website information while the live AI connection is temporarily busy.\n\n';
 if(/\b(price|prices|cost|budget|quote|quotation|pricing|charge|rate|rates)\b/i.test(q))return prefix+'Pricing depends on the scope and requirements of your project. '+link('Request a tailored quote','/start-project/')+'. What are you looking to create or improve?';
 if(/\b(contact|email|whatsapp|phone|call|book|consultation|start a project|hire)\b/i.test(q))return prefix+'You can '+link('start a project brief','/start-project/')+' or '+link('contact Mubest Digital','/contact/')+'. Consultations are subject to confirmation.';
 if(/\b(who is behind|who are you|about mubest|owner|founder|biography)\b/i.test(q)){const bio=clean(settings.ai_assistant_public_bio,1200);return prefix+(bio||'You can read the published information about Mubest Digital on the About page.')+'\n\n'+link('About Mubest Digital','/about/');}
 if(/\b(portfolio|case stud(?:y|ies)|examples of (?:your|the) work|show me (?:your|some) work)\b/i.test(q)){
  const rec=(insights.projects||[]).filter(p=>/^\/portfolio\/project\/\?slug=[a-z0-9_-]+$/i.test(p.url||''));
  if(rec.length)return prefix+'Here are published portfolio projects you can explore:\n\n'+rec.map(p=>link(p.title,p.url)+' — '+clean(p.summary,180)).join('\n')+'\n\n'+link('View the portfolio','/portfolio/');
  return prefix+'Explore the '+link('published portfolio','/portfolio/')+'. Tell me what kind of work you are looking for.';
 }
 const terms=words(q);
 const ranked=services.map(s=>{const hay=String(s.title+' '+s.tag+' '+(s.deliverables||[]).join(' ')).toLowerCase();return {s,score:[...terms].reduce((n,t)=>n+(new RegExp('\\b'+t+'\\b').test(hay)?1:0),0)};}).filter(x=>x.score>0&&safeSlug(x.s.slug)).sort((a,b)=>b.score-a.score).slice(0,2);
 if(ranked.length)return prefix+'These published services may fit your request:\n\n'+ranked.map(({s})=>link(s.title,'/services/#'+encodeURIComponent(s.slug))+' — '+clean(s.summary,230)).join('\n\n')+'\n\nWhat outcome would you like to achieve?';
 const faq=faqs.find(f=>{const fw=words(f.question);return fw.size>=2&&[...fw].every(w=>terms.has(w));});if(faq)return prefix+clean(faq.answer,500);
 return prefix+'I can show you our '+link('services','/services/')+', '+link('portfolio','/portfolio/')+' or help you '+link('start a project','/start-project/')+'. For other questions, please try again when live AI is available.';
}
