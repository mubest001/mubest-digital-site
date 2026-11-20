(() => {
  'use strict';
  if (window.parent === window || !new URLSearchParams(location.search).has('mubest-editor')) return;
  const send = data => window.parent.postMessage(data, location.origin);
  const root = document.querySelector('main') || document.body;
  let selected = null;
  let dragged = null;
  let overlay;
  let moveHandle;
  const style = document.createElement('style');
  style.textContent = `
    html.vb-editing{cursor:crosshair!important}html.vb-editing body{scroll-behavior:auto!important}
    .vb-hover{outline:1px dashed #4563f5!important;outline-offset:2px!important;cursor:crosshair!important}
    #vb-selection-overlay{position:fixed;z-index:2147483646;border:2px solid #4563f5;pointer-events:none;box-sizing:border-box;display:none;box-shadow:0 0 0 99999px rgba(69,99,245,.015)}
    #vb-selection-overlay button{position:absolute;left:-2px;top:-29px;pointer-events:auto;border:0;border-radius:5px 5px 0 0;background:#4563f5;color:white;padding:6px 10px;font:700 11px Arial,sans-serif;cursor:grab;white-space:nowrap}
    #vb-selection-overlay button:active{cursor:grabbing}
    [data-vb-added-id]{outline:1px dashed #b9e769!important;outline-offset:2px!important}
    .vb-hidden-preview{opacity:.28!important;filter:grayscale(1)!important;outline:2px dashed #4563f5!important;outline-offset:2px!important}
    [contenteditable="true"]{outline:2px solid #b9e769!important;outline-offset:2px!important;cursor:text!important}
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add('vb-editing');
  overlay = document.createElement('div'); overlay.id = 'vb-selection-overlay';
  moveHandle = document.createElement('button'); moveHandle.type = 'button'; moveHandle.textContent = '↕ Drag to move'; moveHandle.draggable = true;
  overlay.appendChild(moveHandle); document.body.appendChild(overlay);
  const cssEscape = value => window.CSS?.escape ? CSS.escape(value) : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  function selectorFor(el) {
    if (!el || el === document.body) return 'body';
    if (el.dataset.vbAddedId) return `[data-vb-added-id="${el.dataset.vbAddedId}"]`;
    if (el.dataset.vbOriginSelector) return el.dataset.vbOriginSelector;
    if (el.id) return `#${cssEscape(el.id)}`;
    const parts = []; let node = el;
    while (node && node !== document.body && node.nodeType === 1) {
      if (node.dataset.vbOriginSelector) return node.dataset.vbOriginSelector + (parts.length ? ' > ' + parts.reverse().join(' > ') : '');
      let part = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (!parent) break;
      const siblings = [...parent.children].filter(x => x.tagName === node.tagName);
      part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      parts.unshift(part); node = parent;
    }
    return 'body > ' + parts.join(' > ');
  }
  function findSelector(selector) {
    if (!selector) return null;
    const aliases = [...document.querySelectorAll('[data-vb-origin-selector]')];
    const aliased = aliases.find(el => el.dataset.vbOriginSelector === selector);
    if (aliased) return aliased;
    for (const parent of aliases) {
      const prefix = parent.dataset.vbOriginSelector + ' > ';
      if (selector.startsWith(prefix)) { try { const child = parent.querySelector(selector.slice(prefix.length)); if (child) return child; } catch {} }
    }
    try { return document.querySelector(selector); } catch { return null; }
  }
  function editableTarget(node) {
    const el = node?.nodeType === 1 ? node : node?.parentElement;
    if (!el || !root.contains(el) || el.closest('script,style,svg,nav,.site-header,.site-footer,#vb-selection-overlay')) return null;
    return el.closest('h1,h2,h3,h4,h5,p,li,a,button,img,video,blockquote,article,section,div') || el;
  }
  function textEditable(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return ['h1','h2','h3','h4','h5','p','li','blockquote','button','a','span'].includes(tag) || el.children.length === 0;
  }
  function metadata(el) {
    const anchor = el.closest('a');
    return {
      selector: selectorFor(el), tag:el.tagName.toLowerCase(),
      text:textEditable(el) ? (el.innerText || el.textContent || '').trim().slice(0,3000) : '',
      editableText:textEditable(el), href:anchor?.getAttribute('href') || (el.tagName.toLowerCase()==='a' ? el.getAttribute('href') : ''),
      src:el.getAttribute('src') || '', alt:el.getAttribute('alt') || '',
      styles:{ color:getComputedStyle(el).color, backgroundColor:getComputedStyle(el).backgroundColor, fontSize:getComputedStyle(el).fontSize, textAlign:getComputedStyle(el).textAlign, width:getComputedStyle(el).width, padding:getComputedStyle(el).padding, margin:getComputedStyle(el).margin, borderRadius:getComputedStyle(el).borderRadius },
      addedId:el.dataset.vbAddedId || ''
    };
  }
  function positionOverlay() {
    if (!selected || !selected.isConnected) { overlay.style.display='none'; return; }
    const r = selected.getBoundingClientRect();
    overlay.style.display = 'block'; overlay.style.left = `${Math.max(0,r.left-2)}px`; overlay.style.top = `${Math.max(0,r.top-2)}px`;
    overlay.style.width = `${Math.max(8,r.width+4)}px`; overlay.style.height = `${Math.max(8,r.height+4)}px`;
  }
  function select(el) {
    if (!el) return;
    selected = el; positionOverlay(); send({type:'vb:selected',element:metadata(el)});
  }
  document.addEventListener('mouseover', event => {
    const el = editableTarget(event.target);
    if (el && el !== selected) el.classList.add('vb-hover');
  }, true);
  document.addEventListener('mouseout', event => {
    const el = editableTarget(event.target); if (el) el.classList.remove('vb-hover');
  }, true);
  document.addEventListener('click', event => {
    const el = editableTarget(event.target); if (!el) return;
    event.preventDefault(); event.stopPropagation();
    document.querySelectorAll('.vb-hover').forEach(x => x.classList.remove('vb-hover'));
    select(el);
  }, true);
  document.addEventListener('dblclick', event => {
    const el = editableTarget(event.target);
    if (!el || !textEditable(el)) return;
    event.preventDefault(); event.stopPropagation();
    el.setAttribute('contenteditable','true'); el.focus();
  }, true);
  document.addEventListener('input', event => {
    const el = event.target;
    if (!el?.isContentEditable) return;
    send({type:'vb:inline-edit',element:metadata(el),text:el.innerText}); positionOverlay();
  }, true);
  document.addEventListener('focusout', event => { if (event.target?.isContentEditable) event.target.removeAttribute('contenteditable'); }, true);
  moveHandle.addEventListener('dragstart', event => {
    if (!selected) { event.preventDefault(); return; }
    dragged = selected; event.dataTransfer.setData('text/plain', selectorFor(dragged)); event.dataTransfer.effectAllowed='move';
  });
  document.addEventListener('dragover', event => {
    if (!dragged) return;
    const target = editableTarget(event.target);
    if (target && target !== dragged && !dragged.contains(target)) { event.preventDefault(); event.dataTransfer.dropEffect='move'; }
  }, true);
  document.addEventListener('drop', event => {
    if (!dragged) return;
    const target = editableTarget(event.target); if (!target || target === dragged || dragged.contains(target)) { dragged=null; return; }
    event.preventDefault(); event.stopPropagation();
    let parent, before;
    if (['main','section'].includes(target.tagName.toLowerCase()) || target.classList.contains('container') || target.classList.contains('hero-content')) { parent=target; before=null; }
    else { parent=target.parentElement; before=target; }
    if (!parent || !root.contains(parent)) { dragged=null; return; }
    const moved = dragged; const movedSelector = selectorFor(moved);
    if (!moved.dataset.vbOriginSelector) moved.dataset.vbOriginSelector = movedSelector;
    parent.insertBefore(moved,before);
    const move = { selector:movedSelector, parentSelector:selectorFor(parent), beforeSelector:before ? selectorFor(before) : '' };
    dragged=null; select(moved); send({type:'vb:moved',move});
  }, true);
  function setText(el, value) {
    if (!el) return;
    if (el.tagName.toLowerCase()==='a' || el.tagName.toLowerCase()==='button') {
      const node=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE);
      if (node) node.textContent=value; else el.insertBefore(document.createTextNode(value),el.firstChild);
    } else if (el.textContent !== value) el.textContent=value;
  }
  function applyStyles(el, styles) { if (!el || !styles) return; Object.entries(styles).forEach(([k,v]) => { if (v !== '') el.style[k]=v; }); }
  function createBlock(item) {
    let el;
    if (item.type==='heading') { el=document.createElement('h2'); el.textContent=item.text||'Your new heading'; }
    else if (item.type==='text') { el=document.createElement('p'); el.textContent=item.text||'Add your text here.'; }
    else if (item.type==='image') { el=document.createElement('img'); el.src=item.src||'https://placehold.co/900x560/e9edf2/354052?text=Add+your+image'; el.alt=item.alt||'New image'; el.style.maxWidth='100%'; }
    else if (item.type==='button') { el=document.createElement('a'); el.href=item.href||'/contact/'; el.textContent=item.text||'Learn more'; el.className='button button-primary'; }
    else if (item.type==='video') { el=document.createElement('video'); el.src=item.src||''; el.controls=true; el.playsInline=true; el.style.maxWidth='100%'; }
    else if (item.type==='review') { el=document.createElement('blockquote'); el.textContent=item.text||'Add a client review here.'; }
    else if (item.type==='divider') { el=document.createElement('hr'); }
    else { el=document.createElement('section'); el.className='vb-added-section'; const wrap=document.createElement('div'); wrap.className='container'; const h=document.createElement('h2'); h.textContent=item.text||'Your new section'; const p=document.createElement('p'); p.textContent=item.body||'Add supporting text for this section.'; wrap.append(h,p); el.appendChild(wrap); }
    el.dataset.vbAddedId=item.id; el.classList.add('vb-added-element'); applyStyles(el,item.styles); if(item.hidden)el.classList.add('vb-hidden-preview'); return el;
  }
  let currentLayout = { patches:[], added:[], moves:[] };
  let applyingLayout = false;
  function applyLayout(value) {
    currentLayout = value || { patches:[], added:[], moves:[] };
    const state = currentLayout;
    const keep = new Set((state.added || []).map(x => x.id));
    document.querySelectorAll('[data-vb-added-id]').forEach(el => { if (!keep.has(el.dataset.vbAddedId)) el.remove(); });
    (state.patches || []).forEach(p => {
      const el = findSelector(p.selector); if (!el) return;
      if (p.text !== undefined) setText(el, p.text);
      if (p.href !== undefined) { const a = el.tagName.toLowerCase() === 'a' ? el : el.closest('a'); if (a) a.setAttribute('href', p.href); }
      if (p.src !== undefined && ['img','video'].includes(el.tagName.toLowerCase())) el.setAttribute('src', p.src);
      if (p.alt !== undefined && el.tagName.toLowerCase() === 'img') el.setAttribute('alt', p.alt);
      el.classList.toggle('vb-hidden-preview', p.hidden === true);
      applyStyles(el, p.styles);
    });
    (state.moves || []).forEach(move => {
      const el = findSelector(move.selector), parent = findSelector(move.parentSelector), before = move.beforeSelector ? findSelector(move.beforeSelector) : null;
      if (!el || !parent) return;
      if (!el.dataset.vbOriginSelector) el.dataset.vbOriginSelector = move.selector;
      if (before && before.parentElement === parent) { if (el.nextElementSibling !== before) parent.insertBefore(el, before); }
      else if (el.parentElement !== parent || el !== parent.lastElementChild) parent.appendChild(el);
    });
    (state.added || []).forEach(item => {
      let el = document.querySelector(`[data-vb-added-id="${item.id}"]`);
      if (!el) {
        const parent = findSelector(item.parentSelector), before = item.beforeSelector ? findSelector(item.beforeSelector) : null;
        if (!parent) return;
        el = createBlock(item); parent.insertBefore(el, before && before.parentElement === parent ? before : null);
      }
      if (item.text !== undefined) { if (item.type === 'section') { const h = el.querySelector('h2'); if (h && h.textContent !== item.text) h.textContent = item.text; } else setText(el, item.text); }
      if (item.body !== undefined && item.type === 'section') { const p = el.querySelector('p'); if (p && p.textContent !== item.body) p.textContent = item.body; }
      if (item.href && el.tagName.toLowerCase() === 'a') el.href = item.href;
      if (item.src && ['img','video'].includes(el.tagName.toLowerCase())) el.src = item.src;
      if (item.alt && el.tagName.toLowerCase() === 'img') el.alt = item.alt;
      applyStyles(el, item.styles); if (item.hidden) el.style.display = 'none'; else if (item.hidden === false) el.style.removeProperty('display');
    });
    if (selected && selected.isConnected) positionOverlay();
  }
  const layoutObserver = new MutationObserver(() => {
    if (applyingLayout || !currentLayout) return;
    applyingLayout = true; applyLayout(currentLayout); applyingLayout = false;
  });
  layoutObserver.observe(root, { childList:true, subtree:true });
  setTimeout(() => layoutObserver.disconnect(), 15000);
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    const data=event.data||{};
    if(data.type==='vb:apply-layout') applyLayout(data.layout);
    if(data.type==='vb:add'){
      const type=data.blockType; const id=`vb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`;
      let parent,before;
      if(selected && ['main','section'].includes(selected.tagName.toLowerCase())){parent=selected;before=null;}
      else if(selected){parent=selected.parentElement;before=selected.nextElementSibling;}
      else {parent=root;before=null;}
      if(type==='section' && selected){const section=selected.closest('section');if(section?.parentElement){parent=section.parentElement;before=section.nextElementSibling;}}
      if(!parent || !root.contains(parent)) parent=root;
      const item={id,type,parentSelector:selectorFor(parent),beforeSelector:before?selectorFor(before):'',text:({heading:'Your new heading',text:'Add your text here.',button:'Learn more',review:'Add a client review here.',section:'Your new section'}[type]||''),body:type==='section'?'Add supporting text for this section.':'',href:'/contact/',src:'',alt:'',styles:{}};
      const el=createBlock(item);parent.insertBefore(el,before&&before.parentElement===parent?before:null);select(el);
      send({type:'vb:added',item,element:metadata(el)});
    }
  });
  window.addEventListener('scroll',positionOverlay,{passive:true}); window.addEventListener('resize',positionOverlay);
  send({type:'vb:ready'});
})();
