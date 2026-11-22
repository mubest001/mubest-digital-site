(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.has('mubest-editor') || location.pathname.startsWith('/admin/')) return;
  const pagePath = location.pathname;
  const page = pagePath.startsWith('/about') ? 'about' : pagePath.startsWith('/services') ? 'services' : pagePath.startsWith('/portfolio') ? 'portfolio' : pagePath.startsWith('/contact') ? 'contact' : 'home';
  async function load() {
    try {
      const [content, layoutResponse] = await Promise.all([
        (window.MubestPublicContentPromise ||= fetch('/api/public-content',{cache:'no-store'}).then(async response=>response.ok?response.json():{})).catch(()=>({})),
        fetch(`/api/visual-layout?page=${page}`,{cache:'no-store'}).catch(()=>null)
      ]);
      const layout = layoutResponse?.ok ? (await layoutResponse.json().catch(() => ({}))).data?.layout : null;
      const scriptPath = String(content.settings?.analytics_script_url || '').trim();
      if (scriptPath.startsWith('/') && !scriptPath.startsWith('//') && !document.querySelector('[data-mubest-analytics]')) {
        window.va = window.va || function(){ (window.vaq = window.vaq || []).push(arguments); };
        window.va('beforeSend', event => {
          try { const u = new URL(event.url, location.origin); if (u.pathname.startsWith('/admin/') || u.searchParams.has('mubest-editor')) return null; } catch {}
          return event;
        });
        const analytics = document.createElement('script'); analytics.defer = true; analytics.src = scriptPath; analytics.dataset.mubestAnalytics = 'true'; document.head.appendChild(analytics);
      }
      if (layout && window.MubestVisualLayout) {
        const apply = () => window.MubestVisualLayout.apply(layout);
        setTimeout(apply, 250); setTimeout(apply, 1100); setTimeout(apply, 2600);
        const observer = new MutationObserver(() => apply());
        observer.observe(document.body, { childList:true, subtree:true });
        setTimeout(() => observer.disconnect(), 10000);
      }
    } catch (error) { console.warn('Mubest Studio 4.0 runtime could not load:', error); }
  }
  const layoutScript = document.createElement('script');
  layoutScript.src = '/assets/visual-layout-runtime.js?v=2-device';
  layoutScript.onload = load;
  document.body.appendChild(layoutScript);
})();
