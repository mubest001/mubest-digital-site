/* Mubest AI Intelligence V2: deterministic, published-only recommendation ranking.
 * This module never calls Groq, handles contacts or persists conversations.
 */
const categories={
  website:["website","websites","web design","landing page","wordpress","wix","webflow","frontend","redesign","user experience","ux","ui"],
  commerce:["shopify","ecommerce","e-commerce","online store","storefront","shopping","checkout","etsy","product page","online shop","retail"],
  email:["klaviyo","email","emails","newsletter","customer retention","welcome flow","abandoned cart","email automation","campaign flows"],
  brand:["branding","brand identity","logo","graphic design","visual identity","packaging","brand assets"],
  social:["social media","instagram","tiktok","reels","video editing","content creation","social content","youtube"],
  search:["seo","search engine","google ranking","organic traffic","google ads","paid ads","advertising","search visibility"],
  systems:["integration","integrations","custom system","workflow","api integration","automation","app development","software"]
};
const stop=new Set(["what","when","where","will","with","that","this","them","have","your","please","would","could","should","mubest","digital","help","like","want","need","about","from","into","work","more","does","some","make","show","business","project","projects","looking","there","these","which","their","offer","offers","give","using","currently","that"]);
const limit=(s,n=180)=>String(s??"").trim().slice(0,n);
const text=(value)=>String(value??"").toLowerCase().replace(/[^a-z0-9&+ -]/g," ");
const slug=val=>limit(val,110).replace(/[^a-zA-Z0-9_-]/g,"");
const tokens=s=>(text(s).match(/[a-z0-9]{3,}/g)||[]).filter(x=>!stop.has(x)).slice(0,65);
const containsPhrase=(hay,phrase)=>(" "+text(hay).replace(/\s+/g," ").trim()+" ").includes(" "+text(phrase).replace(/\s+/g," ").trim()+" ");
const groupsFor=source=>Object.entries(categories).filter(([,values])=>values.some(phrase=>containsPhrase(source,phrase))).map(([group])=>group);
const listedTerms=history=>(Array.isArray(history)?history:[]).filter(x=>x?.role==="user").slice(-5).map(x=>limit(x.content,1800)).join(" ");
const relevant=(row,phrases,groupHints,keys)=>{
  const title=text(row[keys[0]]||""),detail=text(keys.slice(1).map(key=>{
    const v=row[key];return typeof v==="string"?v:Array.isArray(v)?v.join(" "):"";
  }).join(" "));
  let score=0,matched=[];
  for(const term of phrases){
    if(containsPhrase(title,term)){score+=5;matched.push(term);}
    else if(containsPhrase(detail,term)){score+=2;matched.push(term);}
  }
  const recordGroups=groupsFor(title+" "+detail);
  for(const group of groupHints)if(recordGroups.includes(group))score+=5;
  return {score,matched,recordGroups};
};
export function recommendPublishedContent(messages,services=[],projects=[],settings={}){
  const conversation=listedTerms(messages);
  const latest=text((Array.isArray(messages)?messages:[]).filter(x=>x?.role==="user").at(-1)?.content||"");
  const intent=text(conversation);
  const words=[...new Set(tokens(conversation))];
  const userGroups=groupsFor(intent);
  const asksServices=/\b(services|what do you (do|offer)|what can you (do|offer)|help with)\b/.test(latest);
  const asksPortfolio=/\b(portfolio|examples|case stud(?:y|ies)|previous projects|past projects|work samples|show me (your |some )?work|projects have you)\b/.test(latest);
  const discussesProject=/\b(i (need|want|am|would|have|run)|we (need|want|are|have)|my (business|brand|store|website|company)|our (business|brand|website)|looking for|planning to|help me|create|build|redesign|set up|launch|improve)\b/.test(intent);
  const ranks=(rows,fields)=>rows.map((row,index)=>({row,index,...relevant(row,words,userGroups,fields)}))
    .sort((a,b)=>b.score-a.score||a.index-b.index);
  const svc=ranks(services,["title","summary","description","tag"]);
  const projectInputs=projects.map(project=>{
    const info=project?.details&&typeof project.details==="object"&&!Array.isArray(project.details)?project.details:{};
    return {...project,serviceTags:Array.isArray(info.service_categories)?info.service_categories.join(" "):"",publishedHighlights:limit(info.project_highlight,240)};
  });
  const prj=ranks(projectInputs,["title","category","excerpt","description","serviceTags","publishedHighlights"]);
  const active= settings.ai_v2_enabled!==false;
  const recommendServices=active&&settings.ai_v2_service_recommendations!==false&&
    (discussesProject||userGroups.length>0)&&!asksServices;
  const recommendProjects=active&&settings.ai_v2_portfolio_recommendations!==false&&
    (asksPortfolio||(discussesProject&&userGroups.length>0));
  const selectedServices=recommendServices?svc.filter(x=>x.score>=5).slice(0,3):[];
  const eligibleProjects=recommendProjects?prj.filter(x=>x.score>=5).slice(0,2):[];
  const chosenProjects=eligibleProjects.length?eligibleProjects:asksPortfolio?prj.slice(0,2):[];
  const matchedProjects=eligibleProjects.length>0;
  const output={
    services:selectedServices.filter(x=>slug(x.row.slug)).map(x=>({
      name:limit(x.row.title,110),
      summary:limit(x.row.summary||x.row.description,150),
      url:"/services/#"+encodeURIComponent(slug(x.row.slug))
    })),
    projects:chosenProjects.filter(x=>slug(x.row.slug)).map(x=>({
      title:limit(x.row.title,120),summary:limit(x.row.excerpt||x.row.description,175),
      url:"/portfolio/project/?slug="+encodeURIComponent(slug(x.row.slug)),
      matched:matchedProjects&&x.score>=5
    })),
    projectDiscussion:discussesProject,
    portfolioRequested:asksPortfolio
  };
  return output;
}
