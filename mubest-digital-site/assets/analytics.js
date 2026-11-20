(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let range = '24h';
  let scriptPath = '';
  function toast(message) { const el=$('#anToast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),3200); }
  async function request(url,options={}) { const res=await fetch(url,{cache:'no-store',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});const body=await res.json().catch(()=>({}));if(!res.ok)throw new Error(body.error||`Request failed (${res.status}).`);return body; }
  async function checkAuth(){try{const s=await request('/api/auth?action=status');if(!s.authenticated)location.replace('/admin/');}catch{location.replace('/admin/');}}
  function number(value){return new Intl.NumberFormat().format(Number(value||0));}
  function countryName(code){if(!code)return 'Unknown';try{return new Intl.DisplayNames([navigator.language||'en'],{type:'region'}).of(code)||code;}catch{return code;}}
  function showSetup(missing=[]){$('#anSetup').hidden=false;$('#anDashboard').hidden=true;$('#anError').hidden=false;$('#anError').textContent=missing.length?`Add the following Production environment variables in Vercel, then redeploy: ${missing.join(', ')}.`:'Complete the Vercel Web Analytics connection below.';}
  function rows(target,items,nameKey,metricKey='visitors',secondaryKey='pageviews',formatter=x=>x){
    const el=$(target);if(!items?.length){el.innerHTML='<div class="an-chart-empty">No data for this period yet.</div>';return;}
    const max=Math.max(1,...items.map(x=>Number(x[metricKey]||x[secondaryKey]||0)));
    el.innerHTML=items.map(item=>{const label=formatter(item[nameKey]||'Unknown');const metric=Number(item[metricKey]||0),secondary=Number(item[secondaryKey]||0);return `<div class="an-list-row"><i class="an-country-dot"></i><span class="an-row-name" title="${esc(label)}">${esc(label)}</span><span class="an-row-metric">${number(metric||secondary)}<small>${metricKey==='visitors'?'visitors':'views'} · ${number(secondary)} views</small></span></div>`;}).join('');
  }
  function renderChart(items){
    const el=$('#anChart');if(!items?.length){el.innerHTML='<div class="an-chart-empty">Traffic activity will appear after Vercel starts receiving visits.</div>';return;}
    const max=Math.max(1,...items.map(x=>Math.max(Number(x.visitors||0),Number(x.pageviews||0))));
    const compact=items.length>18?items.filter((_,i)=>i%2===0):items;
    el.innerHTML=compact.map(item=>{const v=Number(item.visitors||0),p=Number(item.pageviews||0);const vh=Math.max(v?3:0,v/max*138),ph=Math.max(p?3:0,p/max*138);const date=new Date(item.timestamp||item.date||Date.now());const label=range==='24h'?date.toLocaleTimeString([], {hour:'numeric'}):date.toLocaleDateString([], {month:'short',day:'numeric'});return `<div class="an-chart-column" title="${esc(label)} · ${number(v)} visitors · ${number(p)} page views"><div class="an-bars"><i class="an-bar" style="height:${vh}px" title="${number(v)} visitors"></i><i class="an-bar views" style="height:${ph}px" title="${number(p)} page views"></i></div><small>${esc(label)}</small></div>`;}).join('')+`<div class="an-legend"><span><i></i> Visitors</span><span><i class="views"></i> Page views</span></div>`;
  }
  function render(data){
    $('#anSetup').hidden=true;$('#anError').hidden=true;$('#anDashboard').hidden=false;
    const visitors=Number(data.visitors||0),leads=Number(data.enquiries||0);
    $('#anVisitors').textContent=number(visitors);$('#anPageviews').textContent=number(data.pageviews);$('#anLeads').textContent=number(leads);$('#anRate').textContent=visitors?`${(leads/visitors*100).toFixed(1)}%`:'—';
    $('#anUpdated').textContent=`Updated ${new Date(data.generatedAt||Date.now()).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`;
    renderChart(data.hourly||[]);
    rows('#anCountries',data.countries||[],'country','visitors','pageviews',countryName);
    rows('#anPages',data.pages||[],'requestPath','pageviews','visitors',x=>x||'/');
    rows('#anReferrers',data.referrers||[],'referrerHostname','visitors','pageviews',x=>x==='(direct)'?'Direct / none':x);
    rows('#anDevices',data.devices||[],'deviceType','visitors','pageviews',x=>String(x).replace(/^./,c=>c.toUpperCase()));
    $('#anTrackingNotice').hidden=Boolean(data.trackingConfigured) && !data.partial;
    $('#anTrackingNotice').textContent=!data.trackingConfigured ? 'The analytics API is connected, but the website tracking script path has not been saved yet. Save the Vercel static script path in the connection panel above to start collecting new visits.' : 'Some analytics breakdowns could not be loaded. Your headline totals are still available; refresh later to retry the missing panels.';
  }
  async function load(){
    $('#anError').hidden=true;$('#anDashboard').hidden=true;$('#anSetup').hidden=true;
    try{
      const result=await request(`/api/analytics?range=${range}`);
      if(result.data?.setupRequired){showSetup(result.data.missing||[]);return;}
      render(result.data);
      if(!result.data.trackingConfigured){$('#anSetup').hidden=false;$('#anSetup').querySelector('.an-kicker').textContent='TRACKING SCRIPT NOT SAVED';$('#anSetup').querySelector('h2').textContent='Finish connecting website tracking';$('#anSetup').querySelector('.an-steps').hidden=true;$('#anSetup').querySelector('.an-setup-icon').textContent='!';}
    }catch(error){$('#anError').hidden=false;$('#anError').textContent=error.message;$('#anSetup').hidden=false;$('#anDashboard').hidden=true;}
  }
  async function loadConfig(){try{const result=await request('/api/analytics-config');scriptPath=result.data?.scriptUrl||'';$('#anScriptPath').value=scriptPath;}catch(error){$('#anSetupMessage').textContent=error.message;}}
  $('#anScriptForm').addEventListener('submit',async e=>{e.preventDefault();const button=e.currentTarget.querySelector('button');button.disabled=true;try{const result=await request('/api/analytics-config',{method:'POST',body:JSON.stringify({scriptUrl:$('#anScriptPath').value.trim()})});scriptPath=result.data.scriptUrl;toast('Tracking script path saved.');await load();}catch(error){$('#anSetupMessage').textContent=error.message;}finally{button.disabled=false;}});
  $$('[data-range]').forEach(button=>button.addEventListener('click',()=>{range=button.dataset.range;$$('[data-range]').forEach(b=>b.classList.toggle('active',b===button));load();}));
  $('#anRefresh').addEventListener('click',load);
  checkAuth().then(async()=>{await loadConfig();await load();});
})();
