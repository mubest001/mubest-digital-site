/* Mubest Digital premium canvas — live on-page movement and resizing */
(function setupDirectCanvas(){
  'use strict';
  const api=window.MubestVisualBridge;
  if(!api)return;
  const doc=document, overlay=api.overlay;
  const moveButton=overlay.querySelector('button');
  moveButton.draggable=false;moveButton.removeAttribute('draggable');
  moveButton.textContent='✥ Move element';
  moveButton.title='Drag the selected element to reposition it';
  const css=doc.createElement('style');
  css.textContent=`
  html.vb-editing .vb-added-element,html.vb-editing .vb-hover{touch-action:pan-y}
  html.vb-editing.vb-dragging,html.vb-editing.vb-dragging *{user-select:none!important;cursor:grabbing!important}
  #vb-selection-overlay{outline-offset:0!important;box-shadow:0 0 0 3px rgba(69,99,245,.1)!important}
  #vb-selection-overlay .vb-resize-handle{position:absolute;display:block;width:12px;height:12px;padding:0;min-width:0;min-height:0;background:#fff;border:2px solid #4563f5;border-radius:3px;pointer-events:auto;box-shadow:0 2px 6px #16254433;transform:translate(-50%,-50%);z-index:3;touch-action:none}
  #vb-selection-overlay .vb-resize-handle[data-edge="nw"]{left:0;top:0;cursor:nwse-resize}
  #vb-selection-overlay .vb-resize-handle[data-edge="n"]{left:50%;top:0;cursor:ns-resize}
  #vb-selection-overlay .vb-resize-handle[data-edge="ne"]{left:100%;top:0;cursor:nesw-resize}
  #vb-selection-overlay .vb-resize-handle[data-edge="e"]{left:100%;top:50%;cursor:ew-resize}
  #vb-selection-overlay .vb-resize-handle[data-edge="se"]{left:100%;top:100%;cursor:nwse-resize}
  #vb-selection-overlay .vb-resize-handle[data-edge="s"]{left:50%;top:100%;cursor:ns-resize}
  #vb-selection-overlay .vb-resize-handle[data-edge="sw"]{left:0;top:100%;cursor:nesw-resize}
  #vb-selection-overlay .vb-resize-handle[data-edge="w"]{left:0;top:50%;cursor:ew-resize}
  #vb-selection-overlay .vb-size-label{position:absolute;bottom:-24px;right:0;pointer-events:none;background:#17243b;color:#fff;padding:3px 7px;border-radius:5px;font:700 10px Inter,Arial,sans-serif;white-space:nowrap}
  #vb-selection-overlay.vb-locked .vb-resize-handle{display:none}
  .vb-smart-guide{position:fixed;display:none;pointer-events:none;z-index:2147483645;background:#91e600}
  .vb-smart-guide[data-axis="x"]{width:1px;top:0;height:100vh}
  .vb-smart-guide[data-axis="y"]{height:1px;left:0;width:100vw}
  .vb-canvas-info{position:fixed;bottom:12px;left:12px;z-index:2147483645;background:#182234ea;color:#fff;border:1px solid #ffffff24;border-radius:8px;padding:7px 10px;font:600 11px Inter,Arial,sans-serif;max-width:min(320px,90vw);pointer-events:none}
  .vb-canvas-info[hidden]{display:none!important}
  .vb-overlap-alert{outline:2px solid #ef7947!important;outline-offset:2px!important}
  `;
  doc.head.appendChild(css);
  const handles=['nw','n','ne','e','se','s','sw','w'].map(edge=>{
    const b=doc.createElement('button');b.type='button';b.className='vb-resize-handle';b.dataset.edge=edge;b.title='Resize '+edge.toUpperCase();b.setAttribute('aria-label','Resize element '+edge);overlay.appendChild(b);return b;
  });
  const sizeLabel=doc.createElement('span');sizeLabel.className='vb-size-label';overlay.appendChild(sizeLabel);
  const guides=['x','y'].map(axis=>{const div=doc.createElement('div');div.className='vb-smart-guide';div.dataset.axis=axis;doc.body.appendChild(div);return div;});
  const info=doc.createElement('div');info.className='vb-canvas-info';info.hidden=true;doc.body.appendChild(info);
  let snap=true,guidesEnabled=true,lock=false,drag=null,pointerType='';
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==window.parent)return;
    if(event.data?.type==='vb:canvas-settings'){
      snap=event.data.snap!==false;guidesEnabled=event.data.guides!==false;
      if(!guidesEnabled)hideGuides();
    }
  });
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const px=n=>Math.round(n)+'px';
  const round=n=>Math.round(n*10)/10;
  const parseTranslation=(raw)=>{
    const m=String(raw||'').match(/(-?\d+(?:\.\d+)?)px(?:\s+|,\s*)(-?\d+(?:\.\d+)?)px/);
    return m?{x:Number(m[1]),y:Number(m[2])}:{x:0,y:0};
  };
  const selected=()=>api.getSelected();
  const canMove=el=>!!el && /^(H[1-6]|P|A|BUTTON|IMG|VIDEO|BLOCKQUOTE|LI|HR|SPAN)$/.test(el.tagName) || !!el?.dataset.vbAddedId;
  const boundsFor=el=>el.closest('section')||el.closest('article')||el.parentElement||api.root;
  function hideGuides(){guides.forEach(line=>line.style.display='none');}
  function label(){
    const el=selected();if(!el)return;
    const r=el.getBoundingClientRect();
    sizeLabel.textContent=Math.round(r.width)+' × '+Math.round(r.height)+' px';
    overlay.classList.toggle('vb-locked',lock||!canMove(el));
  }
  const priorPosition=api.positionOverlay;
  let raf=0;
  function refresh(){if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{priorPosition();label();raf=0;});}
  const isIgnored=e=>e.button!==0 || e.target.closest?.('#vb-selection-overlay') || e.target.isContentEditable || doc.activeElement?.isContentEditable;
  function notify(styles){const el=selected();if(!el)return;window.parent.postMessage({type:'vb:geometry-commit',selector:api.selectorFor(el),addedId:el.dataset.vbAddedId||'',device:api.getDevice(),styles},location.origin);}
  function selectOnPointer(e){const el=api.editableTarget(e.target);if(el)api.select(el);return el;}
  function start(event,el,mode='move',edge=''){
    if(!el||lock||!canMove(el)||event.button!==0||event.isPrimary===false)return;
    if(el.closest('[contenteditable="true"]'))return;
    const rect=el.getBoundingClientRect();
    const bound=boundsFor(el).getBoundingClientRect();
    const old=parseTranslation(el.style.translate||getComputedStyle(el).translate);
    drag={el,id:event.pointerId,mode,edge,x:event.clientX,y:event.clientY,rect,bound,old,width:rect.width,height:rect.height,styles:{},active:mode==='resize',shift:false};
    pointerType=event.pointerType;
    try{event.target.setPointerCapture(event.pointerId);}catch{}
    doc.documentElement.classList.add('vb-dragging');
    if(mode==='resize')event.preventDefault();
  }
  function snapValue(value){return snap?Math.round(value/8)*8:value;}
  function move(e){
    if(!drag||e.pointerId!==drag.id)return;
    const d=drag;
    const dx=e.clientX-d.x,dy=e.clientY-d.y;
    if(!d.active && Math.hypot(dx,dy)<3)return;
    d.active=true;
    const parentRect=d.bound;
    const inset=5;
    if(d.mode==='move'){
      let deltaX=clamp(dx,parentRect.left-d.rect.left+inset,parentRect.right-d.rect.right-inset);
      let deltaY=clamp(dy,parentRect.top-d.rect.top+inset,parentRect.bottom-d.rect.bottom-inset);
      deltaX=snapValue(deltaX);deltaY=snapValue(deltaY);
      let x=d.old.x+deltaX,y=d.old.y+deltaY;
      const cX=d.rect.left+d.rect.width/2+deltaX,cY=d.rect.top+d.rect.height/2+deltaY;
      const bX=parentRect.left+parentRect.width/2,bY=parentRect.top+parentRect.height/2;
      hideGuides();
      if(guidesEnabled){
        if(Math.abs(cX-bX)<7){x+=bX-cX;guides[0].style.left=px(bX);guides[0].style.display='block';}
        if(Math.abs(cY-bY)<7){y+=bY-cY;guides[1].style.top=px(bY);guides[1].style.display='block';}
      }
      d.el.style.translate=px(x)+' '+px(y);
      d.styles={translate:d.el.style.translate};
    }else{
      const edge=d.edge;
      const hor=/e|w/.test(edge),ver=/n|s/.test(edge);
      const sx=edge.includes('w')?-1:1,sy=edge.includes('n')?-1:1;
      const maxWidth=Math.max(70,parentRect.width-12);
      const width=hor?clamp(snapValue(d.width+dx*sx),48,maxWidth):d.width;
      const height=ver?clamp(snapValue(d.height+dy*sy),24,Math.max(30,parentRect.height)):d.height;
      if(hor){d.el.style.width=px(width);d.el.style.maxWidth='100%';d.styles.width=d.el.style.width;d.styles.maxWidth='100%';}
      if(ver){
        if(/^(H[1-6]|P|A|BUTTON|BLOCKQUOTE|LI|SPAN)$/.test(d.el.tagName)){d.el.style.minHeight=px(height);d.styles.minHeight=d.el.style.minHeight;}
        else{d.el.style.height=px(height);d.styles.height=d.el.style.height;}
      }
      if(edge.includes('w')||edge.includes('n')){
        const tx=d.old.x+(edge.includes('w')?d.width-width:0);
        const ty=d.old.y+(edge.includes('n')?d.height-height:0);
        d.el.style.translate=px(tx)+' '+px(ty);d.styles.translate=d.el.style.translate;
      }
      hideGuides();
    }
    info.hidden=false;info.textContent=d.mode==='move'?'Moving element · release to place':'Resizing · '+Math.round(d.el.getBoundingClientRect().width)+' × '+Math.round(d.el.getBoundingClientRect().height);
    refresh();
    e.preventDefault();
  }
  function finish(e){
    if(!drag||e.pointerId!==drag.id)return;
    const d=drag;drag=null;
    doc.documentElement.classList.remove('vb-dragging');
    hideGuides();info.hidden=true;
    if(d.active && Object.keys(d.styles).length)notify(d.styles);
    refresh();
  }
  doc.addEventListener('pointerdown',e=>{
    if(isIgnored(e))return;
    const el=selectOnPointer(e);
    if(!el||!canMove(el)||!['mouse','pen'].includes(e.pointerType))return;
    start(e,el);
  },true);
  handles.forEach(handle=>handle.addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();start(e,selected(),'resize',handle.dataset.edge);}));
  moveButton.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();start(e,selected(),'move');});
  doc.addEventListener('pointermove',move,true);
  doc.addEventListener('pointerup',finish,true);
  doc.addEventListener('pointercancel',finish,true);
  doc.addEventListener('scroll',refresh,{passive:true,capture:true});
  window.addEventListener('resize',refresh);
  doc.addEventListener('click',refresh,true);
  function action(name){
    if(name==='check-overlaps'&&!selected()){const first=api.root.querySelector('h1,h2,p,a,button,img,video');if(first)api.select(first);}
    const el=selected();if(!el)return;
    const section=boundsFor(el).getBoundingClientRect(),r=el.getBoundingClientRect(),old=parseTranslation(el.style.translate);
    let change={};
    if(name==='reset'){el.style.translate='0px 0px';el.style.removeProperty('width');el.style.removeProperty('height');el.style.removeProperty('min-height');change={translate:'0px 0px',width:'auto',height:'auto',minHeight:'0px'};}
    else if(name==='center'){el.style.translate=px(old.x+(section.left+section.width/2-r.left-r.width/2))+' '+px(old.y);change={translate:el.style.translate};}
    else if(name==='left'){el.style.translate=px(old.x+section.left-r.left+12)+' '+px(old.y);change={translate:el.style.translate};}
    else if(name==='right'){el.style.translate=px(old.x+section.right-r.right-12)+' '+px(old.y);change={translate:el.style.translate};}
    else if(name==='top'){el.style.translate=px(old.x)+' '+px(old.y+section.top-r.top+12);change={translate:el.style.translate};}
    else if(name==='middle'){el.style.translate=px(old.x)+' '+px(old.y+section.top+section.height/2-r.top-r.height/2);change={translate:el.style.translate};}
    else if(name==='front'||name==='back'){const index=parseInt(getComputedStyle(el).zIndex,10)||0;const z=clamp(index+(name==='front'?1:-1),-20,80);el.style.zIndex=String(z);if(getComputedStyle(el).position==='static')el.style.position='relative';change={zIndex:String(z)};}
    else if(name==='check-overlaps'){
      const scope=api.root;
      const candidates=[...scope.querySelectorAll('h1,h2,h3,h4,p,a.button,button,img,video,[data-vb-added-id]')]
        .filter(node=>node.getClientRects().length && getComputedStyle(node).visibility!=='hidden' && getComputedStyle(node).display!=='none');
      const rectangles=candidates.slice(0,140).map(node=>({node,rect:node.getBoundingClientRect()}));
      const clashes=new Set();
      for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){
        const a=rectangles[i],b=rectangles[j];
        if(a.node.contains(b.node)||b.node.contains(a.node))continue;
        if(a.node.closest('section')!==b.node.closest('section'))continue;
        const width=Math.min(a.rect.right,b.rect.right)-Math.max(a.rect.left,b.rect.left);
        const height=Math.min(a.rect.bottom,b.rect.bottom)-Math.max(a.rect.top,b.rect.top);
        const overlap=width*height;
        const smaller=Math.min(a.rect.width*a.rect.height,b.rect.width*b.rect.height);
        if(width>3&&height>3&&smaller>100&&overlap/smaller>.23){clashes.add(a.node);clashes.add(b.node);}
      }
      const count=clashes.size;
      clashes.forEach(node=>{node.classList.add('vb-overlap-alert');setTimeout(()=>node.classList.remove('vb-overlap-alert'),4000)});
      info.textContent=count?count+' elements may overlap. Review the orange outlines.':'No significant overlaps detected among editable elements.';
      info.hidden=false;
      setTimeout(()=>{if(!drag)info.hidden=true},4400);
      window.parent.postMessage({type:'vb:overlap-report',count},location.origin);
      return;
    }
    else if(name==='lock'){lock=!lock;refresh();window.parent.postMessage({type:'vb:canvas-status',locked:lock},location.origin);return;}
    else if(name==='select-parent'){if(el.parentElement&&api.root.contains(el.parentElement))api.select(el.parentElement);return;}
    else return;
    notify(change);refresh();
  }
  window.MubestPremiumCanvasAction=action;
  doc.addEventListener('keydown',e=>{
    if(e.target.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||e.metaKey||e.altKey)return;
    if(e.ctrlKey && e.key.toLowerCase()==='d'){
      e.preventDefault();window.parent.postMessage({type:'vb:shortcut',action:'duplicate'},location.origin);return;
    }
    if(e.ctrlKey && e.key.toLowerCase()==='z'){
      e.preventDefault();window.parent.postMessage({type:'vb:shortcut',action:e.shiftKey?'redo':'undo'},location.origin);return;
    }
    if(e.ctrlKey && e.key.toLowerCase()==='y'){
      e.preventDefault();window.parent.postMessage({type:'vb:shortcut',action:'redo'},location.origin);return;
    }
    if(e.ctrlKey)return;
    const el=selected();if(!el||!canMove(el)||lock)return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
      e.preventDefault();const old=parseTranslation(el.style.translate),step=e.shiftKey?10:1;
      const x=old.x+(e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0);
      const y=old.y+(e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0);
      el.style.translate=px(x)+' '+px(y);notify({translate:el.style.translate});refresh();
    }
  });
  window.parent.postMessage({type:'vb:canvas-ready',features:['move','resize','snap','align','layers','device-position']},location.origin);
})();
