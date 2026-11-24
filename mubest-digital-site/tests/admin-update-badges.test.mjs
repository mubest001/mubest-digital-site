import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const directory=path.dirname(fileURLToPath(import.meta.url));
const source=fs.readFileSync(path.join(directory,"../assets/admin-update-badges.js"),"utf8");
const releaseAnchor="const FEATURE_RELEASES = Object.freeze({});";
assert.ok(source.includes(releaseAnchor),"Release marker registry is present");

function runWithReleases(releases,storage=new Map()){
  const events=new Map(),winEvents=new Map();
  const navItems=[
    item({view:"overview"}),
    item({view:"aiassistant"}),
    item({view:"aiintelligence"}),
    item({updateSection:"visualbuilder"}),
    item({updateSection:"analytics"})
  ];
  function item(dataset){
    return {
      dataset,badge:null,append(el){this.badge=el;el.parent=this},
      querySelector(selector){return selector===".md-update-badge"?this.badge:null},
      closest(){return this}
    };
  }
  const nav={querySelectorAll(){return navItems}};
  const document={
    querySelector(selector){return selector===".sidebar-nav"?nav:null},
    addEventListener(type,callback){events.set(type,callback)},
    createElement(tag){
      assert.equal(tag,"span");
      return {className:"",textContent:"",parent:null,setAttribute(name,value){this[name]=value},remove(){if(this.parent)this.parent.badge=null}};
    }
  };
  const window={
    localStorage:{
      getItem(key){return storage.has(key)?storage.get(key):null},
      setItem(key,value){storage.set(key,String(value))}
    },
    addEventListener(name,callback){winEvents.set(name,callback)}
  };
  const code=source.replace(releaseAnchor,"const FEATURE_RELEASES = Object.freeze("+JSON.stringify(releases)+");");
  new Function("window","document",code)(window,document);
  return {
    storage,navItems,
    ready(email="admin@example.com"){winEvents.get("mubest-admin-ready")({detail:{email}})},
    click(key){
      const target=navItems.find(x=>(x.dataset.view||x.dataset.updateSection)===key);
      assert.ok(target,"Clicked a known navigation section");
      events.get("click")({target});
    },
    badge(key){return navItems.find(x=>(x.dataset.view||x.dataset.updateSection)===key)?.badge?.textContent||""},
    syncStorage(key){winEvents.get("storage")({key})}
  };
}

test("all existing static NEW labels are absent when no new features were registered",()=>{
  const x=runWithReleases({});
  x.ready();
  for(const item of x.navItems)assert.equal(item.badge,null);
});
test("a targeted future update adds NEW only to the updated sections",()=>{
  const x=runWithReleases({aiintelligence:"2026-12-01.1",visualbuilder:"2026-12-01.1"});
  x.ready();
  assert.equal(x.badge("aiintelligence"),"NEW");
  assert.equal(x.badge("visualbuilder"),"NEW");
  assert.equal(x.badge("aiassistant"),"");
  assert.equal(x.badge("analytics"),"");
});
test("clicking a section immediately dismisses only its NEW label",()=>{
  const x=runWithReleases({aiintelligence:"2026-12-01.1",visualbuilder:"2026-12-01.1"});
  x.ready();
  x.click("aiintelligence");
  assert.equal(x.badge("aiintelligence"),"");
  assert.equal(x.badge("visualbuilder"),"NEW");
});
test("dismissed NEW stays dismissed after refresh and relogin on the same browser",()=>{
  const storage=new Map(),releases={aiintelligence:"2026-12-01.1"};
  const first=runWithReleases(releases,storage);
  first.ready("owner@example.com");first.click("aiintelligence");
  const refreshed=runWithReleases(releases,storage);
  refreshed.ready("owner@example.com");
  assert.equal(refreshed.badge("aiintelligence"),"");
});
test("a later release of the same section restores NEW until opened",()=>{
  const storage=new Map();
  const earlier=runWithReleases({aiintelligence:"2026-12-01.1"},storage);
  earlier.ready();earlier.click("aiintelligence");
  const later=runWithReleases({aiintelligence:"2026-12-08.1"},storage);
  later.ready();
  assert.equal(later.badge("aiintelligence"),"NEW");
  later.click("aiintelligence");
  assert.equal(later.badge("aiintelligence"),"");
});
test("dismissals are scoped to the authenticated Content Studio account",()=>{
  const storage=new Map(),releases={visualbuilder:"2026-12-01.1"};
  const first=runWithReleases(releases,storage);first.ready("one@example.com");first.click("visualbuilder");
  const second=runWithReleases(releases,storage);second.ready("two@example.com");
  assert.equal(second.badge("visualbuilder"),"NEW");
});
test("new badges on external dashboard links dismiss before navigation",()=>{
  const x=runWithReleases({analytics:"2026-12-03.1"});
  x.ready();assert.equal(x.badge("analytics"),"NEW");
  x.click("analytics");assert.equal(x.badge("analytics"),"");
});
test("newly recorded updates in another tab synchronize when localStorage changes",()=>{
  const storage=new Map(),releases={visualbuilder:"2026-12-05.1"};
  const a=runWithReleases(releases,storage),b=runWithReleases(releases,storage);
  a.ready();b.ready();
  a.click("visualbuilder");
  const key=[...storage.keys()][0];
  b.syncStorage(key);
  assert.equal(b.badge("visualbuilder"),"");
});
