(()=>{'use strict';
 if(new URLSearchParams(location.search).has('editorPreview')||navigator.doNotTrack==='1'||navigator.globalPrivacyControl)return;
 const uuid=()=>crypto.randomUUID();let visitor,source='direct';try{visitor=localStorage.getItem('md-portfolio-visitor');if(!visitor){visitor=uuid();localStorage.setItem('md-portfolio-visitor',visitor);}if(document.referrer){const host=new URL(document.referrer).hostname;if(host!==location.hostname){source=host;sessionStorage.setItem('md-portfolio-source',source);}else source=sessionStorage.getItem('md-portfolio-source')||'direct';}else{sessionStorage.setItem('md-portfolio-source','direct');}}catch{try{visitor=uuid();}catch{return;}}
 const slugFrom=a=>{try{const u=new URL(a.href,location.href);return u.origin===location.origin&&/^\/portfolio\/project\/?$/.test(u.pathname)?u.searchParams.get('slug'):null;}catch{return null;}};
 function send(slug,type,seconds=0){if(!slug)return;const body=JSON.stringify({event_id:uuid(),visitor_id:visitor,slug,event_type:type,seconds,source});try{if(navigator.sendBeacon&&navigator.sendBeacon('/api/portfolio-engagement',new Blob([body],{type:'application/json'})))return;}catch{}fetch('/api/portfolio-engagement',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});}
 const seen=new Set(),observed=new WeakSet();const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;const slug=slugFrom(e.target);if(slug&&!seen.has(slug)){seen.add(slug);send(slug,'impression');}observer.unobserve(e.target);}}, {threshold:0.3}):null;
 function scan(){document.querySelectorAll('.work-card a[href],.case-related-card[href]').forEach(a=>{const slug=slugFrom(a);if(!slug||observed.has(a))return;observed.add(a);if(observer)observer.observe(a);else if(!seen.has(slug)){seen.add(slug);send(slug,'impression');}});}
 document.addEventListener('click',e=>{const a=e.target.closest?.('a[href]');if(!a)return;const slug=slugFrom(a);if(slug){send(slug,'click');return;}if(activeSlug){try{const u=new URL(a.href,location.href);if(/^\/contact\/?$/.test(u.pathname)||/^(tel:|mailto:)/.test(a.href)||u.hostname==='wa.me')send(activeSlug,'contact');}catch{}}},true);
 document.addEventListener('auxclick',e=>{if(e.button===1){const a=e.target.closest?.('a[href]');if(a)send(slugFrom(a),'click');}},true);
 let activeSlug=null,visibleStart=0,elapsed=0,sent=false;
 function pause(){if(visibleStart){elapsed+=performance.now()-visibleStart;visibleStart=0;}}
 function resume(){if(activeSlug&&!document.hidden&&!visibleStart)visibleStart=performance.now();}
 function finish(){pause();if(!sent&&activeSlug&&elapsed>=1000){sent=true;send(activeSlug,'engagement',Math.round(elapsed/1000));}}
 window.addEventListener('mubest:case-ready',e=>{if(activeSlug)return;activeSlug=e.detail?.project?.slug;if(!activeSlug)return;send(activeSlug,'view');resume();scan();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();else resume();});
 window.addEventListener('pagehide',finish);
 const videos=new WeakSet();function bindVideos(){if(!activeSlug)return;document.querySelectorAll('#v5Walkthrough video').forEach(v=>{if(videos.has(v))return;videos.add(v);let played=false;v.addEventListener('play',()=>{if(!played){played=true;send(activeSlug,'video_play');}});v.addEventListener('ended',()=>{if(played){send(activeSlug,'video_complete');played=false;}});});}
 let queued=false;function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;scan();bindVideos();});}
 new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});refresh();
})();