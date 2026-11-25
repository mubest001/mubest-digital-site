import {createSign} from 'node:crypto';
import {ensureSchema,query} from '../lib/db.js';
import {requireAdmin} from '../lib/auth.js';
const SITE='https://mubestdigital.vercel.app';
const paths=['/','/about/','/services/','/portfolio/','/contact/','/start-project/'];
const json=(res,status,data)=>{res.setHeader('Cache-Control','private, no-store');return res.status(status).json(data);};
const fetchSafe=(url,options={})=>fetch(url,{...options,redirect:'manual',signal:AbortSignal.timeout(8500)});
const date=d=>d.toISOString().slice(0,10);
let cachedToken;
async function token(){
 if(cachedToken&&cachedToken.expires>Date.now())return cachedToken.value;
 const email=process.env.GSC_CLIENT_EMAIL,key=(process.env.GSC_PRIVATE_KEY||'').replace(/\\n/g,'\n');
 if(!email||!key)throw Error('Google Search Console credentials are not configured.');
 const now=Math.floor(Date.now()/1000),enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
 const unsigned=enc({alg:'RS256',typ:'JWT'})+'.'+enc({iss:email,scope:'https://www.googleapis.com/auth/webmasters.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 const assertion=unsigned+'.'+createSign('RSA-SHA256').update(unsigned).end().sign(key,'base64url');
 const r=await fetchSafe('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion})});
 const d=await r.json();if(!r.ok||!d.access_token)throw Error('Google authorization failed. Verify the service account and key.');
 cachedToken={value:d.access_token,expires:Date.now()+(Math.max(60,Number(d.expires_in)||3600)-30)*1000};return cachedToken.value;
}
function attrs(tag){const o={};for(const m of tag.matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))o[m[1].toLowerCase()]=m[2]??m[3]??m[4];return o;}
function clean(s){return String(s||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();}
async function inspectPage(path){
 const url=SITE+path;try{const r=await fetchSafe(url);if(!r.ok)return {path,status:r.status,checks:[],issues:['HTTP '+r.status],score:0};const html=await r.text();
 const meta=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0])),links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0]));
 const title=clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]),description=meta.find(x=>(x.name||'').toLowerCase()==='description')?.content||'',canonical=links.find(x=>(x.rel||'').toLowerCase().split(/\s+/).includes('canonical'))?.href||'';
 const h1=[...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m=>clean(m[1])),images=[...html.matchAll(/<img\b[^>]*>/gi)].map(m=>attrs(m[0])),missingAlt=images.filter(x=>!Object.hasOwn(x,'alt')).length;
 const noindex=meta.some(x=>/^(robots|googlebot)$/i.test(x.name||'')&&/noindex/i.test(x.content||''))||/noindex/i.test(r.headers.get('x-robots-tag')||'');
 const checks=[['Title present',!!title],['Meta description present',!!description],['Exactly one H1',h1.length===1],['Canonical points to this URL',canonical===url],['Mobile viewport',meta.some(x=>x.name==='viewport')],['No noindex directive',!noindex],['Image alt attributes',missingAlt===0],['Open Graph title',meta.some(x=>x.property==='og:title'&&x.content)],['Open Graph description',meta.some(x=>x.property==='og:description'&&x.content)]];
 return {path,status:r.status,title,description,canonical,h1,images:images.length,missingAlt,checks,issues:checks.filter(x=>!x[1]).map(x=>x[0]),score:Math.round(100*checks.filter(x=>x[1]).length/checks.length)};
 }catch{return {path,status:0,checks:[],issues:['Page could not be fetched'],score:0};}
}
async function google(path,access,body){const r=await fetchSafe(path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+access,Accept:'application/json',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok)throw Error('Google API returned HTTP '+r.status+'. Check property permissions and API enablement.');return d;}
export default async function handler(req,res){try{
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 await ensureSchema();if(!await requireAdmin(req))return json(res,401,{error:'Sign in required.'});
 const u=new URL(req.url,'https://local.invalid'),action=u.searchParams.get('action')||'audit';
 const configured=Boolean(process.env.GSC_CLIENT_EMAIL&&process.env.GSC_PRIVATE_KEY&&process.env.GSC_SITE_URL);
 if(action==='audit'){
  const [pages,robots,sitemap,counts]=await Promise.all([
   Promise.all(paths.map(inspectPage)),
   fetchSafe(SITE+'/robots.txt').then(async r=>({status:r.status,body:r.ok?(await r.text()).slice(0,5000):''})).catch(()=>({status:0,body:''})),
   fetchSafe(SITE+'/sitemap.xml').then(async r=>({status:r.status,body:r.ok?(await r.text()).slice(0,100000):''})).catch(()=>({status:0,body:''})),
   query("SELECT (SELECT COUNT(*)::int FROM services WHERE status='published') AS categories,(SELECT COALESCE(SUM(jsonb_array_length(deliverables)),0)::int FROM services WHERE status='published') AS subservices,(SELECT COUNT(*)::int FROM portfolio_projects WHERE status='published') AS projects")
  ]);
  const sitemapUrls=[...sitemap.body.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)].map(m=>m[1].trim());
  return json(res,200,{configured,site:SITE,pages,robots:{status:robots.status,hasSitemap:/^sitemap:/im.test(robots.body),adminDisallowed:/Disallow:\s*\/admin\//i.test(robots.body)},sitemap:{status:sitemap.status,urls:sitemapUrls,missing:paths.filter(p=>!sitemapUrls.includes(SITE+p))},counts:counts[0],generatedAt:new Date().toISOString()});
 }
 if(!configured)return json(res,200,{configured:false,reason:'Connect a read-only Google Search Console service account.'});
 const access=await token(),property=process.env.GSC_SITE_URL;
 const api='https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(property);
 if(action==='inspect'){
  const path=u.searchParams.get('path');if(!paths.includes(path))return json(res,400,{error:'Choose one of the audited pages.'});
  const d=await google('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',access,{inspectionUrl:SITE+path,siteUrl:property,languageCode:'en-US'});
  const x=d.inspectionResult?.indexStatusResult||{};return json(res,200,{configured:true,index:{verdict:x.verdict,coverageState:x.coverageState,indexingState:x.indexingState,robotsTxtState:x.robotsTxtState,lastCrawlTime:x.lastCrawlTime,googleCanonical:x.googleCanonical,userCanonical:x.userCanonical}});
 }
 if(action!=='performance')return json(res,400,{error:'Unknown action'});
 const days=[7,28,90].includes(Number(u.searchParams.get('days')))?Number(u.searchParams.get('days')):28;
 const end=new Date(Date.now()-3*86400000),start=new Date(+end-(days-1)*86400000),previousEnd=new Date(+start-86400000),previousStart=new Date(+previousEnd-(days-1)*86400000);
 const request=(dimensions=[],range={startDate:date(start),endDate:date(end)})=>google(api+'/searchAnalytics/query',access,{...range,dimensions,type:'web',dataState:'final',rowLimit:dimensions.length?100:1}).then(d=>d.rows||[]);
 const [total,previous,daily,queries,pages,countries,devices,sitemaps]=await Promise.all([request(),request([],{startDate:date(previousStart),endDate:date(previousEnd)}),request(['date']),request(['query']),request(['page']),request(['country']),request(['device']),google(api+'/sitemaps',access).catch(()=>null)]);
 return json(res,200,{configured:true,property,start:date(start),end:date(end),total:total[0]||null,previous:previous[0]||null,daily,queries,pages,countries,devices,sitemaps:sitemaps?.sitemap||[],opportunities:queries.filter(x=>x.impressions>=20&&x.position>=4&&x.position<=20).sort((a,b)=>b.impressions-a.impressions).slice(0,20)});
 }catch(e){console.error('SEO Intelligence:',e.message);return json(res,503,{error:'SEO report could not be loaded. '+(String(e.message).startsWith('Google')?e.message:'Check deployment configuration and try again.')});}}
