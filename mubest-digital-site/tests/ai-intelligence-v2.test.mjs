import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendPublishedContent } from '../lib/ai-intelligence.js';

const services=[
  {slug:'shopify',title:'Shopify & Ecommerce',summary:'Online storefronts',description:'Product pages and checkout',tag:'Ecommerce'},
  {slug:'email',title:'Klaviyo Email Marketing',summary:'Automated customer email',description:'Welcome and retention flows',tag:'Email'},
  {slug:'website',title:'Website Design',summary:'Business websites',description:'Landing pages and website redesign',tag:'Web'}
];
const projects=[
  {slug:'skincare-store',title:'Skincare Shopify Store',category:'Ecommerce',excerpt:'Shopify ecommerce storefront',description:'A skincare brand product journey',details:{service_categories:['Shopify & Ecommerce']}},
  {slug:'email-series',title:'Klaviyo Welcome Emails',category:'Email',excerpt:'Customer welcome automation',description:'Campaign for wellness clients',details:{service_categories:['Email Marketing']}}
];
const chat=text=>[{role:'user',content:text}];

test('matches a visitor Shopify need to the published service and project only',()=>{
  const result=recommendPublishedContent(chat('I need a Shopify store for skincare'),services,projects,{});
  assert.equal(result.services[0]?.name,'Shopify & Ecommerce');
  assert.equal(result.projects[0]?.title,'Skincare Shopify Store');
  assert.equal(result.projects[0]?.url,'/portfolio/project/?slug=skincare-store');
  assert.equal(result.projects[0]?.matched,true);
});
test('does not invent portfolio examples for a published project list',()=>{
  const result=recommendPublishedContent(chat('Show me some portfolio projects'),services,projects,{});
  assert.equal(result.projects.length,2);
  assert.ok(result.projects.every(item=>item.matched===false));
  assert.ok(result.projects.every(item=>projects.some(p=>item.url.endsWith('='+p.slug))));
});
test('general service list request does not spam project cards',()=>{
  const result=recommendPublishedContent(chat('What services does Mubest Digital offer?'),services,projects,{});
  assert.equal(result.projects.length,0);
  assert.equal(result.services.length,0);
});
test('client discussion does not recommend an unrelated or unpublished project',()=>{
  const result=recommendPublishedContent(chat('I need Klaviyo email automation'),services,projects.slice(0,1),{});
  assert.equal(result.services[0]?.name,'Klaviyo Email Marketing');
  assert.equal(result.projects.length,0);
});
test('published project links cannot use untrusted slugs as arbitrary URLs',()=>{
  const malicious=[{...projects[0],slug:'../../https://example.net/'}];
  const result=recommendPublishedContent(chat('Show me my Shopify portfolio'),services,malicious,{});
  assert.ok(result.projects.every(item=>item.url.startsWith('/portfolio/project/?slug=')));
  assert.ok(result.projects.every(item=>!item.url.includes('example.net')));
});
test('admin switches can disable all V2 suggestions without disabling chat itself',()=>{
  const result=recommendPublishedContent(chat('I need Shopify ecommerce'),services,projects,{ai_v2_enabled:false});
  assert.deepEqual(result.services,[]);
  assert.deepEqual(result.projects,[]);
});
test('portfolio cards can be disabled independently',()=>{
  const result=recommendPublishedContent(chat('I need a Shopify store'),services,projects,{ai_v2_portfolio_recommendations:false});
  assert.equal(result.projects.length,0);
  assert.ok(result.services.length>0);
});
test('a general greeting does not trigger sales recommendations',()=>{
  const result=recommendPublishedContent(chat('Hello, how are you?'),services,projects,{});
  assert.equal(result.projects.length,0);
  assert.equal(result.services.length,0);
});

test('an email template project does not count as a completed website redesign',()=>{
  const emailOnly=[{
    slug:'klaviyo-health-shopify',
    title:'Klaviyo Email Template Design for Health & Wellness Shopify Brand',
    category:'Health & Wellness / Shopify / Klaviyo',
    excerpt:'Mobile-friendly email templates for a Shopify health brand.',
    description:'Customer retention emails, no storefront design.',
    details:{service_categories:['Email Marketing & Automation']}
  }];
  const website=recommendPublishedContent(chat('I need a premium website design'),services,emailOnly,{});
  assert.equal(website.projects.length,0);
  const store=recommendPublishedContent(chat('I want to build a Shopify store'),services,emailOnly,{});
  assert.equal(store.projects.length,0);
  const email=recommendPublishedContent(chat('I need Klaviyo email templates for a Shopify brand'),services,emailOnly,{});
  assert.equal(email.projects.length,1);
});
test('a specific portfolio topic does not fall back to unrelated projects',()=>{
  const onlyEmail=[{slug:'email-only',title:'Klaviyo Welcome Emails',category:'Email marketing',excerpt:'Automated email campaigns'}];
  const result=recommendPublishedContent(chat('Show me website design case studies'),services,onlyEmail,{});
  assert.equal(result.projects.length,0);
});
