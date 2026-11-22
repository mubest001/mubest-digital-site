/* Mubest Digital premium canvas toolbar */
(function setupPremiumToolbar(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  const frame=$('#vePreview'),shell=$('#veFrameShell'),stage=$('#veFrameStage');
  const snapButton=$('#veSnapToggle'),guideButton=$('#veGuidesToggle'),zoomSelect=$('#veCanvasZoom');
  if(!frame||!shell||!stage)return;
  const state={snap:true,guides:true,zoom:'fit',mode:'desktop'};
  const send=(type,other={})=>{if(frame.contentWindow)frame.contentWindow.postMessage({type,...other},location.origin);};
  const currentMode=()=>document.querySelector('[data-device].active')?.dataset.device||'desktop';
  let resizeFrame=0;
  function fit(){
    cancelAnimationFrame(resizeFrame);
    resizeFrame=requestAnimationFrame(()=>{
      const mode=currentMode();state.mode=mode;
      const targetWidth=mode==='desktop'?1200:mode==='tablet'?768:390;
      const available=Math.max(200,stage.clientWidth-34);
      const zoom=state.zoom==='fit'?Math.min(1,available/targetWidth):Math.max(.35,Number(state.zoom)||1);
      const displayWidth=Math.round(targetWidth*zoom);
      shell.style.width=displayWidth+'px';
      shell.style.maxWidth='none';
      shell.style.minWidth=displayWidth+'px';
      frame.style.width=targetWidth+'px';
      frame.style.maxWidth='none';
      frame.style.height=Math.ceil(shell.clientHeight/zoom)+'px';
      frame.style.transform='scale('+zoom+')';
      frame.style.transformOrigin='top left';
      frame.dataset.premiumZoom=String(zoom);
      send('vb:set-device',{device:mode});
    });
  }
  function sync(){
    snapButton.setAttribute('aria-pressed',String(state.snap));
    snapButton.querySelector('span').textContent=state.snap?'ON':'OFF';
    guideButton.setAttribute('aria-pressed',String(state.guides));
    guideButton.querySelector('span').textContent=state.guides?'ON':'OFF';
    send('vb:canvas-settings',{snap:state.snap,guides:state.guides});
  }
  snapButton.addEventListener('click',()=>{state.snap=!state.snap;sync();});
  guideButton.addEventListener('click',()=>{state.guides=!state.guides;sync();});
  document.querySelectorAll('[data-premium-action]').forEach(button=>button.addEventListener('click',()=>send('vb:canvas-action',{action:button.dataset.premiumAction})));
  zoomSelect.addEventListener('change',()=>{state.zoom=zoomSelect.value;fit();});
  document.querySelectorAll('[data-device]').forEach(button=>button.addEventListener('click',()=>{setTimeout(fit,10);setTimeout(fit,280);}));
  frame.addEventListener('load',()=>{setTimeout(()=>{fit();sync();},260);});
  if('ResizeObserver' in window)new ResizeObserver(()=>fit()).observe(stage);
  else window.addEventListener('resize',fit,{passive:true});
  document.addEventListener('keydown',event=>{
    const editable=event.target?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName);
    if(editable||event.altKey||event.metaKey)return;
    if(event.ctrlKey && !event.shiftKey && event.key.toLowerCase()==='z'){event.preventDefault();$('#veUndo')?.click();}
    if(event.ctrlKey && (event.key.toLowerCase()==='y'||event.shiftKey&&event.key.toLowerCase()==='z')){event.preventDefault();$('#veRedo')?.click();}
  });
  fit();sync();
})();
