import {randomBytes} from 'node:crypto';
import {ensureSchema,query,db,audit} from './db.js';
import {hashPassword,verifyPassword,hashToken,parseCookies,requireAdmin} from './auth.js';
import {KEYWORDS} from './growth-keywords.js';
const SITE='https://mubestdigital.vercel.app',COOKIE='mubest_client';
const clean=(v,n=3000)=>String(v??'').trim().slice(0,n);
const id=v=>Number.isSafeInteger(Number(v))&&Number(v)>0?Number(v):null;
const token=()=>randomBytes(32).toString('base64url');
const tokenOk=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{43}$/.test(v);
const validPassword=v=>typeof v==='string'&&v.length>=12&&v.length<=128;
const active="(c.status='active' OR (c.status='suspended' AND c.suspended_until<=NOW()))";
const out=(res,s,b)=>{res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex');return res.status(s).json(b);};
const err=(res,s,error)=>out(res,s,{error});
function cookie(res,v,age){res.setHeader('Set-Cookie',COOKIE+'='+v+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age='+age);}
function origin(req){return req.headers?.origin===SITE&&req.headers?.['sec-fetch-site']!=='cross-site';}
function sessionToken(req){try{return parseCookies(req)[COOKIE]||'';}catch{return '';}}
async function session(req){const t=sessionToken(req);if(!tokenOk(t))return null;const [c]=await query("SELECT c.id,c.name,c.email,c.force_password,c.session_version FROM portal_sessions s JOIN portal_clients c ON c.id=s.client_id WHERE s.token_hash=$1 AND s.expires_at>NOW() AND s.version=c.session_version AND "+active,[hashToken(t)]);return c||null;}
async function rate(bucket,max){const [r]=await query("INSERT INTO portal_login_limits(bucket,attempts,expires_at) VALUES($1,1,NOW()+INTERVAL '15 minutes') ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN portal_login_limits.expires_at<=NOW() THEN 1 ELSE portal_login_limits.attempts+1 END,expires_at=CASE WHEN portal_login_limits.expires_at<=NOW() THEN NOW()+INTERVAL '15 minutes' ELSE portal_login_limits.expires_at END RETURNING attempts",[hashToken(bucket)]);return Number(r.attempts)<=max;}
async function issueLink(client,purpose){const t=token();await db().transaction([db().query("DELETE FROM portal_tokens WHERE client_id=$1",[client]),db().query("INSERT INTO portal_tokens(token_hash,client_id,purpose,expires_at) VALUES($1,$2,$3,NOW()+INTERVAL '48 hours')",[hashToken(t),client,purpose])]);return SITE+'/client-portal/#token='+t;}
async function projects(client){return query("SELECT p.*,EXISTS(SELECT 1 FROM feedback_submissions f WHERE f.portal_project_id=p.id) AS reviewed,COALESCE((SELECT jsonb_agg(jsonb_build_object('id',m.id,'sender',m.sender,'body',m.body,'created_at',m.created_at) ORDER BY m.id) FROM (SELECT * FROM portal_messages WHERE project_id=p.id ORDER BY id DESC LIMIT 200)m),'[]'::jsonb) AS messages FROM portal_projects p WHERE p.client_id=$1 ORDER BY p.updated_at DESC",[client]);}
const owner="p.client_id=$2 AND EXISTS(SELECT 1 FROM portal_clients c JOIN portal_sessions s ON s.client_id=c.id WHERE c.id=p.client_id AND "+active+" AND NOT c.force_password AND s.version=c.session_version AND s.expires_at>NOW() AND s.token_hash=$3)";
export default async function portal(req,res,mode){try{
 if(!['GET','POST'].includes(req.method))return err(res,405,'Method not allowed.');
 if(req.method==='POST'&&(!origin(req)||Number(req.headers?.['content-length']||0)>20000))return err(res,403,'Request not allowed.');
 await ensureSchema();
 const b=req.method==='POST'?(typeof req.body==='string'?JSON.parse(req.body):req.body||{}):{};
 if(mode==='login'&&req.method==='POST'){
  const email=clean(b.email,254).toLowerCase();const ip=clean(req.headers?.['x-vercel-forwarded-for']||req.headers?.['x-real-ip']||'unknown',100);
  if(!await rate('ip:'+ip,40)||!await rate('email:'+email,8))return err(res,429,'Too many attempts. Try again in 15 minutes.');
  if(typeof b.password!=='string'||b.password.length>128||!email)return err(res,401,'Unable to sign in. Check your details or contact Mubest Digital.');
  const [c]=await query("SELECT c.id,c.password_hash,c.session_version FROM portal_clients c WHERE c.email=$1 AND "+active,[email]);
  if(!c?.password_hash||!await verifyPassword(b.password,c.password_hash))return err(res,401,'Unable to sign in. Check your details or contact Mubest Digital.');
  const t=token();const rows=await query("INSERT INTO portal_sessions(token_hash,client_id,version,expires_at) SELECT $1,c.id,c.session_version,NOW()+INTERVAL '7 days' FROM portal_clients c WHERE c.id=$2 AND c.session_version=$3 AND "+active+" RETURNING client_id",[hashToken(t),c.id,c.session_version]);if(!rows.length)return err(res,401,'Account access has changed.');cookie(res,t,604800);return out(res,200,{ok:true});
 }
 if(mode==='activate'&&req.method==='POST'){
  if(!tokenOk(b.token)||!validPassword(b.password))return err(res,400,'Use a valid activation or reset link and a password of 12–128 characters.');
  const ip=clean(req.headers?.['x-vercel-forwarded-for']||req.headers?.['x-real-ip']||'unknown',100);if(!await rate('activation:'+ip,30))return err(res,429,'Too many attempts. Try later.');
  const key=hashToken(b.token);const [valid]=await query("SELECT 1 FROM portal_tokens t JOIN portal_clients c ON c.id=t.client_id WHERE t.token_hash=$1 AND t.expires_at>NOW() AND ((t.purpose='activate' AND c.status='pending') OR (t.purpose='reset' AND "+active+"))",[key]);if(!valid)return err(res,400,'Link expired or unavailable. Request a new link from Mubest Digital.');
  const pw=await hashPassword(b.password);
  const rows=await query("WITH claimed AS (DELETE FROM portal_tokens t USING portal_clients c WHERE t.token_hash=$1 AND t.expires_at>NOW() AND c.id=t.client_id AND ((t.purpose='activate' AND c.status='pending') OR (t.purpose='reset' AND "+active+")) RETURNING t.client_id,t.purpose) UPDATE portal_clients c SET password_hash=$2,status='active',suspended_until=NULL,force_password=FALSE,session_version=c.session_version+1 FROM claimed t WHERE c.id=t.client_id AND ((t.purpose='activate' AND c.status='pending') OR (t.purpose='reset' AND "+active+")) RETURNING c.id",[key,pw]);if(!rows.length)return err(res,409,'Link is no longer valid.');cookie(res,'',0);return out(res,200,{ok:true});
 }
 if(mode==='logout'&&req.method==='POST'){const t=sessionToken(req);if(tokenOk(t))await query("DELETE FROM portal_sessions WHERE token_hash=$1",[hashToken(t)]);cookie(res,'',0);return out(res,200,{ok:true});}
 if(mode==='admin'){
  const admin=await requireAdmin(req);if(!admin)return err(res,401,'Admin sign-in required.');
  if(req.method==='GET'){const client=id(req.query?.client||new URL(req.url,SITE).searchParams.get('client'));if(client){const [c]=await query("SELECT id,name,email,status,suspended_until,force_password,created_at,password_hash IS NOT NULL AS activated FROM portal_clients WHERE id=$1",[client]);if(!c)return err(res,404,'Client not found.');return out(res,200,{client:c,projects:await projects(client),read_only:true});}
   const [clients,leads,portfolio,services]=await Promise.all([query("SELECT c.id,c.name,c.email,c.status,c.suspended_until,c.force_password,c.created_at,c.password_hash IS NOT NULL AS activated,(SELECT COUNT(*)::int FROM portal_projects p WHERE p.client_id=c.id) AS projects FROM portal_clients c ORDER BY c.created_at DESC"),query("SELECT l.id,l.name,l.email,l.service,l.budget,l.message,l.status,l.created_at FROM leads l WHERE NOT EXISTS(SELECT 1 FROM portal_projects p WHERE p.lead_id=l.id) ORDER BY l.created_at DESC LIMIT 500"),query("SELECT slug,title FROM portfolio_projects WHERE status='published' ORDER BY title"),query("SELECT slug,title FROM services WHERE status='published' ORDER BY title")]);return out(res,200,{clients,leads,portfolio,services:[...new Map([...services,...KEYWORDS.map(k=>({slug:k.slug,title:k.title}))].map(s=>[s.slug,s])).values()]});}
  const action=b.action,cid=id(b.client_id),pid=id(b.project_id);let result={ok:true};
  if(action==='approve_enquiry'){
   const lid=id(b.lead_id);if(!lid)return err(res,400,'Select an enquiry.');const [lead]=await query("SELECT * FROM leads WHERE id=$1",[lid]);if(!lead)return err(res,404,'Enquiry not found.');
   const email=clean(lead.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return err(res,400,'Enquiry email invalid.');
   const [c]=await query("INSERT INTO portal_clients(lead_id,email,name) VALUES($1,$2,$3) ON CONFLICT(email) DO UPDATE SET email=EXCLUDED.email RETURNING id,status,password_hash IS NOT NULL AS activated",[lid,email,lead.name]);if(!['pending','active'].includes(c.status))return err(res,409,'Restore this client before adding a project.');
   const [p]=await query("INSERT INTO portal_projects(client_id,lead_id,title,service,description) VALUES($1,$2,$3,$4,$5) ON CONFLICT(lead_id) DO NOTHING RETURNING id",[c.id,lid,clean(b.title,200)||lead.service||'New project',lead.service||'',lead.message]);if(!p)return err(res,409,'This enquiry already has a project.');
   await query("UPDATE leads SET status='in_progress' WHERE id=$1",[lid]);if(!c.activated)result.url=await issueLink(c.id,'activate');result.client_id=c.id;
  }else if(action==='project_update'){
   if(!cid||!pid)return err(res,400,'Select a project.');const status=clean(b.status,30),progress=Number(b.progress),title=clean(b.title,200),due=clean(b.due_date,10)||null,url=clean(b.delivery_url,1500);if(!title||!['planning','in_progress','revision','delivered','on_hold'].includes(status)||!Number.isInteger(progress)||progress<0||progress>100||status==='delivered'&&progress!==100||due&&!/^\d{4}-\d{2}-\d{2}$/.test(due)||url&&!/^https:\/\/[^\s]+$/i.test(url))return err(res,400,'Check project details; delivered projects must be at 100%.');
   const service=clean(b.service_slug,180),portfolio=clean(b.portfolio_slug,180);if(service&&!KEYWORDS.some(k=>k.slug===service)&&!(await query("SELECT 1 FROM services WHERE slug=$1 AND status='published'",[service])).length)return err(res,400,'Unknown service.');if(portfolio&&!(await query("SELECT 1 FROM portfolio_projects WHERE slug=$1 AND status='published'",[portfolio])).length)return err(res,400,'Unknown portfolio project.');
   const rows=await query("UPDATE portal_projects SET title=$3,status=$4,progress=$5,due_date=$6,description=$7,milestones=$8,delivery_url=$9,service_slug=$10,portfolio_slug=$11,delivered_at=CASE WHEN $4='delivered' THEN COALESCE(delivered_at,NOW()) ELSE NULL END,updated_at=NOW() WHERE id=$1 AND client_id=$2 AND confirmed_at IS NULL RETURNING id",[pid,cid,title,status,progress,due,clean(b.description,5000),clean(b.milestones,5000),url,service,portfolio]);if(!rows.length)return err(res,409,'Project not found or already confirmed.');
  }else if(action==='message'){const body=clean(b.body);if(!cid||!pid||!body)return err(res,400,'Enter a message.');const r=await query("INSERT INTO portal_messages(project_id,sender,body) SELECT id,'admin',$3 FROM portal_projects WHERE id=$1 AND client_id=$2 RETURNING id",[pid,cid,body]);if(!r.length)return err(res,404,'Project not found.');
  }else{
   if(!cid)return err(res,400,'Select a client.');const [c]=await query("SELECT id,status,password_hash IS NOT NULL AS activated FROM portal_clients WHERE id=$1",[cid]);if(!c)return err(res,404,'Client not found.');
   if(action==='activation_link'){if(c.status!=='pending'||c.activated)return err(res,409,'Account is not awaiting activation.');result.url=await issueLink(cid,'activate');}
   else if(action==='reset_password'){if(c.status!=='active'||!c.activated)return err(res,409,'Restore or activate the account first.');await query("UPDATE portal_clients SET force_password=TRUE,session_version=session_version+1 WHERE id=$1",[cid]);result.url=await issueLink(cid,'reset');}
   else if(action==='logout_all'){await query("UPDATE portal_clients SET session_version=session_version+1 WHERE id=$1",[cid]);}
   else if(action==='suspend'||action==='permanent_suspend'){const hours=Number(b.hours);if(action==='suspend'&&(!Number.isInteger(hours)||hours<1||hours>8760))return err(res,400,'Choose a suspension of 1–8760 hours.');await db().transaction([db().query("UPDATE portal_clients SET status=$2,suspended_until=CASE WHEN $2='suspended' THEN NOW()+$3::int*INTERVAL '1 hour' ELSE NULL END,session_version=session_version+1 WHERE id=$1",[cid,action==='suspend'?'suspended':'permanent',action==='suspend'?hours:0]),db().query("DELETE FROM portal_tokens WHERE client_id=$1",[cid])]);}
   else if(action==='restore'){await query("UPDATE portal_clients SET status=CASE WHEN password_hash IS NULL THEN 'pending' ELSE 'active' END,suspended_until=NULL,session_version=session_version+1 WHERE id=$1",[cid]);}
   else if(action==='delete'){if(b.confirm!=='DELETE')return err(res,400,'Type DELETE to confirm.');await db().transaction([db().query("DELETE FROM testimonials WHERE id IN (SELECT f.testimonial_id FROM feedback_submissions f JOIN portal_projects p ON p.id=f.portal_project_id WHERE p.client_id=$1)",[cid]),db().query("DELETE FROM portal_clients WHERE id=$1",[cid])]);}
   else return err(res,400,'Unknown action.');
  }
  await audit(admin.user_id,action,'client_portal',cid||result.client_id||pid||'','Client portal administrative action');return out(res,200,result);
 }
 const c=await session(req);if(!c)return err(res,401,'Sign in to your client portal.');
 if(c.force_password)return err(res,403,'Password change required. Contact Mubest Digital for your reset link.');
 if(mode==='me'&&req.method==='GET')return out(res,200,{client:{id:c.id,name:c.name,email:c.email},projects:await projects(c.id)});
 if(req.method!=='POST')return err(res,405,'Method not allowed.');
 const pid=id(b.project_id),params=[pid,c.id,hashToken(sessionToken(req))];if(!pid)return err(res,400,'Select a project.');
 if(mode==='confirm'){const rows=await query("UPDATE portal_projects p SET status='completed',progress=100,confirmed_at=NOW(),updated_at=NOW() WHERE p.id=$1 AND "+owner+" AND p.status='delivered' AND p.confirmed_at IS NULL RETURNING id",params);if(!rows.length)return err(res,409,'Only your delivered project can be confirmed.');}
 else if(mode==='revision'){const body=clean(b.body);if(!body)return err(res,400,'Describe the changes needed.');const rows=await query("WITH changed AS (UPDATE portal_projects p SET status='revision',progress=90,updated_at=NOW() WHERE p.id=$1 AND "+owner+" AND p.status='delivered' AND p.confirmed_at IS NULL RETURNING id) INSERT INTO portal_messages(project_id,sender,body) SELECT id,'client',$4 FROM changed RETURNING id",[...params,body]);if(!rows.length)return err(res,409,'Project is not awaiting your approval.');}
 else if(mode==='message'){const body=clean(b.body);if(!body)return err(res,400,'Enter a message.');const rows=await query("INSERT INTO portal_messages(project_id,sender,body) SELECT p.id,'client',$4 FROM portal_projects p WHERE p.id=$1 AND "+owner+" RETURNING id",[...params,body]);if(!rows.length)return err(res,404,'Project not found.');}
 else if(mode==='review'){const quote=clean(b.quote),rating=Number(b.rating);if(quote.length<10||!Number.isInteger(rating)||rating<1||rating>5)return err(res,400,'Enter a rating and at least 10 characters.');const rows=await query("INSERT INTO feedback_submissions(name,email,service_slug,project_slug,quote,rating,consent,portal_project_id) SELECT c.name,c.email,p.service_slug,p.portfolio_slug,$4,$5,$6,p.id FROM portal_projects p JOIN portal_clients c ON c.id=p.client_id WHERE p.id=$1 AND "+owner+" AND p.status='completed' AND p.confirmed_at IS NOT NULL ON CONFLICT(portal_project_id) WHERE portal_project_id IS NOT NULL DO NOTHING RETURNING id",[...params,quote,rating,b.consent===true]);if(!rows.length)return err(res,409,'Confirm your project first. Only one review per project is allowed.');}
 else return err(res,404,'Unknown portal action.');
 return out(res,200,{ok:true});
 }catch(e){console.error('Portal API:',e?.code||e?.name||'Error');return err(res,503,'Unable to complete this request. Please try again.');}}
