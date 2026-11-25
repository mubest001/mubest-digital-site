import { ensureSchema, query } from "../lib/db.js";
import { requireAdmin } from "../lib/auth.js";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const types=new Set(['impression','click','view','video_play','video_complete','contact','engagement']);
const json=(res,status,data)=>{res.setHeader('Cache-Control','private, no-store');return res.status(status).json(data);};
export default async function handler(req,res){
 try{
  if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Method not allowed'});
  await ensureSchema();
  if(req.method==='GET'){
   if(!await requireAdmin(req))return json(res,401,{error:'Sign in to view portfolio analytics.'});
   const u=new URL(req.url,'https://local.invalid'),now=new Date(),range=u.searchParams.get('range')||'30d';
   let until=now,since=new Date(+now-({ '24h':1,'7d':7,'30d':30,'90d':90 }[range]||30)*86400000);
   if(range==='custom'){const from=u.searchParams.get('from'),to=u.searchParams.get('to');if(!/^\d{4}-\d{2}-\d{2}$/.test(from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(to||''))return json(res,400,{error:'Choose valid dates.'});since=new Date(from+'T00:00:00Z');until=new Date(+new Date(to+'T00:00:00Z')+86400000);if(!Number.isFinite(+since)||!Number.isFinite(+until)||until<=since||until-since>366*86400000)return json(res,400,{error:'Choose a date range up to 366 days.'});}
   const args=[since.toISOString(),until.toISOString()];
   const [projects,totals,daily,breakdown]=await Promise.all([
    query("SELECT p.id,p.title,p.slug,p.category, p.details->'service_categories' AS categories, COUNT(e.event_id) FILTER(WHERE event_type='impression')::int AS impressions, COUNT(e.event_id) FILTER(WHERE event_type='click')::int AS clicks, COUNT(DISTINCT e.visitor_id) FILTER(WHERE event_type='click')::int AS unique_clickers, COUNT(e.event_id) FILTER(WHERE event_type='view')::int AS views, COUNT(DISTINCT e.visitor_id) FILTER(WHERE event_type='view')::int AS visitors, COUNT(e.event_id) FILTER(WHERE event_type='video_play')::int AS plays, COUNT(e.event_id) FILTER(WHERE event_type='video_complete')::int AS completions, COUNT(e.event_id) FILTER(WHERE event_type='contact')::int AS contacts, COALESCE(ROUND(AVG(e.seconds) FILTER(WHERE event_type='engagement')),0)::int AS avg_seconds FROM portfolio_projects p LEFT JOIN portfolio_engagement e ON p.id=e.project_id AND e.created_at >= $1 AND e.created_at < $2 WHERE p.status='published' GROUP BY p.id ORDER BY clicks DESC,views DESC,p.title",args),
    query("SELECT COUNT(*) FILTER(WHERE event_type='impression')::int AS impressions,COUNT(*) FILTER(WHERE event_type='click')::int AS clicks,COUNT(DISTINCT visitor_id) FILTER(WHERE event_type='click')::int AS unique_clickers,COUNT(*) FILTER(WHERE event_type='view')::int AS views,COUNT(DISTINCT visitor_id) FILTER(WHERE event_type='view')::int AS visitors,COUNT(*) FILTER(WHERE event_type='video_play')::int AS plays,COUNT(*) FILTER(WHERE event_type='video_complete')::int AS completions,COUNT(*) FILTER(WHERE event_type='contact')::int AS contacts,COALESCE(ROUND(AVG(seconds) FILTER(WHERE event_type='engagement')),0)::int AS avg_seconds FROM portfolio_engagement WHERE created_at >= $1 AND created_at < $2",args),
    query("SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS day,COUNT(*) FILTER(WHERE event_type='click')::int AS clicks,COUNT(*) FILTER(WHERE event_type='view')::int AS views FROM portfolio_engagement WHERE created_at >= $1 AND created_at < $2 GROUP BY 1 ORDER BY 1",args),
    query("SELECT source,country,device,COUNT(*)::int AS views FROM portfolio_engagement WHERE event_type='view' AND created_at >= $1 AND created_at < $2 GROUP BY 1,2,3 ORDER BY views DESC LIMIT 100",args)
   ]);
   return json(res,200,{projects,totals:totals[0],daily,breakdown,since:args[0],until:args[1]});
  }
  const ua=String(req.headers['user-agent']||'');if(!ua||/bot|crawl|spider|headless|preview|slurp/i.test(ua)||req.headers['sec-fetch-site']==='cross-site')return json(res,200,{ignored:true});
  if(await requireAdmin(req))return json(res,200,{ignored:true});
  let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body)}catch{return json(res,400,{error:'Invalid event'});}}
  const {event_id,visitor_id,slug,event_type}=body||{};
  if(!uuid.test(String(event_id))||!uuid.test(String(visitor_id))||!types.has(event_type)||typeof slug!=='string'||slug.length>180||!slug)return json(res,400,{error:'Invalid event'});
  const seconds=event_type==='engagement'?Math.max(0,Math.min(1800,Math.round(Number(body.seconds)||0))):0;
  const source=String(body.source||'direct').slice(0,120).replace(/[^a-zA-Z0-9._-]/g,'')||'direct';
  const country=String(req.headers['x-vercel-ip-country']||'').slice(0,2).toUpperCase();
  const device=/ipad|tablet/i.test(ua)?'tablet':/mobile|android|iphone/i.test(ua)?'mobile':'desktop';
  await query("INSERT INTO portfolio_engagement(event_id,project_id,visitor_id,event_type,seconds,source,country,device) SELECT $1,p.id,$2,$3,$4,$5,$6,$7 FROM portfolio_projects p WHERE p.slug=$8 AND p.status='published' AND (SELECT COUNT(*) FROM portfolio_engagement WHERE visitor_id=$2 AND created_at>NOW()-INTERVAL '1 hour')<300 ON CONFLICT(event_id) DO NOTHING",[event_id,visitor_id,event_type,seconds,source,country,device,slug]);
  return json(res,200,{ok:true});
 }catch(error){console.error('Portfolio engagement:',error.message);return json(res,503,{error:'Portfolio analytics temporarily unavailable.'});}
}