(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pages = { home:'/', about:'/about/', services:'/services/', portfolio:'/portfolio/', contact:'/contact/' };
  const emptyLayout = () => ({ version:1, patches:[], added:[], moves:[] });
  const clone = value => JSON.parse(JSON.stringify(value));
  const frame = $('#vePreview');
  const shell = $('#veFrameShell');
  const properties = $('#veProperties');
  let page = 'home';
  let layout = emptyLayout();
  let publishedLayout = emptyLayout();
  let selected = null;
  let history = [JSON.stringify(layout)];
  let historyIndex = 0;
  let dirty = false;
  let historyTimer = null;
  let currentDevice = 'desktop';
  let snapEnabled=true;
  let smartGuidesEnabled=true;
  const geometryKeys=['translate','width','height','minHeight','maxWidth','zIndex'];
  const parseXY=value=>{const m=String(value||'').match(/(-?\d+(?:\.\d+)?)px(?:\s+|,\s*)(-?\d+(?:\.\d+)?)px/);return m?{x:Number(m[1]),y:Number(m[2])}:{x:0,y:0};};
  function sendCanvas(type,extra={}){if(frame.contentWindow)frame.contentWindow.postMessage({type,...extra},location.origin);}
  function devicePatch(){
    if(!selected)return null;
    return selected.addedId?layout.added.find(x=>x.id===selected.addedId):getPatch(selected.selector);
  }
  function setDeviceGeometry(update){
    const patch=devicePatch();if(!patch)return;
    patch.deviceStyles=patch.deviceStyles||{};
    patch.deviceStyles[currentDevice]={...(patch.deviceStyles[currentDevice]||{}),...update};
    setDirty();scheduleSnapshot();applyToFrame();
  }

  function toast(message, error = false) {
    const el = $('#veToast'); el.textContent = message; el.className = 've-toast show' + (error ? ' error' : '');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => el.className = 've-toast', 3600);
  }
  async function request(url, options = {}) {
    const response = await fetch(url, { cache:'no-store', ...options, headers:{ 'Content-Type':'application/json', ...(options.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
    return body;
  }
  async function checkAuth() {
    try {
      const status = await request('/api/auth?action=status');
      if (!status.authenticated) location.replace('/admin/');
    } catch { location.replace('/admin/'); }
  }
  function setDirty(value = true) {
    dirty = value;
    $('#veSaveState').textContent = dirty ? 'Unsaved changes' : 'All changes saved';
    $('#veSaveState').style.color = dirty ? '#a06b25' : '#7e8793';
  }
  function snapshot() {
    const current = JSON.stringify(layout);
    if (history[historyIndex] === current) return;
    history = history.slice(0, historyIndex + 1);
    history.push(current);
    if (history.length > 60) history.shift();
    historyIndex = history.length - 1;
    updateHistoryButtons();
  }
  function scheduleSnapshot() {
    clearTimeout(historyTimer);
    historyTimer = setTimeout(snapshot, 450);
  }
  function updateHistoryButtons() {
    $('#veUndo').disabled = historyIndex <= 0;
    $('#veRedo').disabled = historyIndex >= history.length - 1;
  }
  function applyToFrame() {
    if (!frame.contentWindow) return;
    frame.contentWindow.postMessage({ type:'vb:apply-layout', layout }, location.origin);
  }
  function resetHistory() {
    history = [JSON.stringify(layout)]; historyIndex = 0; updateHistoryButtons(); setDirty(false);
  }
  async function loadPage(nextPage) {
    if (!pages[nextPage]) return;
    if (dirty && !confirm('You have unsaved visual changes. Discard them and switch pages?')) {
      $('#vePage').value = page; return;
    }
    page = nextPage; selected = null;
    $('#vePage').value = page;
    $('#veSelectionLabel').textContent = 'Select an element to begin';
    $('#veElementType').textContent = 'Nothing selected';
    properties.innerHTML = '<div class="ve-empty-selection"><div>✳</div><b>Select an element</b><p>Click text, images, buttons or sections in the website preview to edit them here.</p></div>';
    try {
      const result = await request(`/api/visual-layout?page=${encodeURIComponent(page)}&mode=editor`);
      layout = result.data.layout || emptyLayout();
      publishedLayout = result.data.published || emptyLayout();
      resetHistory();
      frame.src = pages[page] + (pages[page].includes('?') ? '&' : '?') + 'mubest-editor=1&vbPreview=' + Date.now();
      $('#vePreviewLabel').textContent = currentDevice[0].toUpperCase() + currentDevice.slice(1);
    } catch (error) {
      toast(error.message, true);
    }
  }
  function getPatch(selector) {
    let patch = layout.patches.find(x => x.selector === selector);
    if (!patch) { patch = { selector, styles:{} }; layout.patches.push(patch); }
    if (!patch.styles) patch.styles = {};
    return patch;
  }
  function updateSelected(field, value, style = false) {
    if (!selected) return;
    if (selected.addedId) {
      const item = layout.added.find(x => x.id === selected.addedId);
      if (!item) return;
      if (style) { item.styles = item.styles || {}; item.styles[field] = value; }
      else item[field] = value;
    } else {
      const patch = getPatch(selected.selector);
      if (style) patch.styles[field] = value;
      else patch[field] = value;
    }
    setDirty(); scheduleSnapshot(); applyToFrame();
  }
  function renderProperties() {
    if (!selected) {
      properties.innerHTML = '<div class="ve-empty-selection"><div>✳</div><b>Select an element</b><p>Click text, images, buttons or sections in the website preview to edit them here.</p></div>';
      $('#veElementType').textContent = 'Nothing selected';
      return;
    }
    const tag = String(selected.tag || 'element').toUpperCase();
    $('#veElementType').textContent = selected.addedId ? 'New element' : tag;
    $('#veSelectionLabel').textContent = `${tag.toLowerCase()} selected`;
    const added = selected.addedId ? layout.added.find(x => x.id === selected.addedId) : null;
    const patch = selected.addedId ? (added || {}) : (layout.patches.find(x => x.selector === selected.selector) || {});
    const styles = patch.styles || {};
    const deviceStyles=patch.deviceStyles?.[currentDevice]||{};
    const xy=parseXY(deviceStyles.translate||'0px 0px');
    const geo=key=>deviceStyles[key]!==undefined?String(deviceStyles[key]):'';
    const isTextBox=/^(h[1-6]|p|a|button|blockquote|li|span)$/.test(String(selected.tag||''));
    const value = (key, fallback = '') => esc(patch[key] !== undefined ? patch[key] : fallback);
    const currentText = patch.text !== undefined ? patch.text : selected.text || '';
    const socialPlatforms=[['instagram','Instagram'],['linkedin','LinkedIn'],['facebook','Facebook'],['tiktok','TikTok'],['youtube','YouTube'],['x','X / Twitter'],['pinterest','Pinterest'],['whatsapp','WhatsApp']];
    const isSocial=added?.type==='social';

    const fields = [];
    if (!isSocial && (selected.editableText || selected.tag === 'a' || selected.tag === 'button' || selected.addedId)) {
      fields.push(`<div class="ve-prop-group"><h3>Content</h3><label class="ve-prop-field"><span>Text / label</span><textarea id="veText" rows="4">${esc(currentText)}</textarea></label>${selected.addedId && ['section','review'].includes(added?.type) ? `<label class="ve-prop-field"><span>Supporting text</span><textarea id="veBody" rows="3">${value('body', added?.body || '')}</textarea></label>` : ''}</div>`);
    }
    if (selected.tag === 'a' || selected.href || selected.addedId && ['button'].includes(added?.type)) {
      fields.push(`<div class="ve-prop-group"><h3>Link</h3><label class="ve-prop-field"><span>Destination URL</span><input id="veHref" value="${value('href', selected.href || '')}" placeholder="/contact/ or https://..."></label></div>`);
    }
    if (selected.tag === 'img' || selected.tag === 'video' || selected.src || selected.addedId && ['image','video'].includes(added?.type)) {
      fields.push(`<div class="ve-prop-group"><h3>Media</h3><label class="ve-prop-field"><span>Media URL</span><input id="veSrc" value="${value('src', selected.src || '')}" placeholder="https://... or /assets/..."></label><div class="ve-media-property"><button type="button" id="veBrowseMedia" class="ve-media-browse">+ Choose or upload media</button><span>Select from your existing library or upload a new file.</span></div>${selected.tag === 'img' || added?.type === 'image' ? `<label class="ve-prop-field"><span>Alternative text</span><input id="veAlt" value="${value('alt', selected.alt || '')}" placeholder="Describe the image"></label>` : ''}</div>`);
    }
    if (isSocial) {
      const urls=added.links || {};
      fields.push(`<div class="ve-prop-group"><h3>Social profile URLs</h3><p style="font-size:10px;color:#7b8594;line-height:1.6;margin:0 0 14px">Paste each social profile link. The preview and live website show only the platform logos. Leave unused links blank.</p>${socialPlatforms.map(([id,label])=>`<label class="ve-prop-field"><span>${esc(label)}</span><input class="ve-social-input" data-social-platform="${id}" type="url" value="${esc(urls[id] || '')}" placeholder="https://..." autocomplete="off"></label>`).join('')}</div>`);
    }
    fields.push('<div class="ve-prop-group"><h3>Position & size</h3>'+
      '<p class="ve-premium-note">Drag the selected element directly in the preview. Pull any blue handle to resize. These settings apply to '+esc(currentDevice)+' only.</p>'+
      '<div class="ve-prop-two"><label class="ve-prop-field"><span>X offset (px)</span><input id="veX" type="number" step="1" value="'+esc(xy.x)+'"></label><label class="ve-prop-field"><span>Y offset (px)</span><input id="veY" type="number" step="1" value="'+esc(xy.y)+'"></label></div>'+
      '<div class="ve-prop-two"><label class="ve-prop-field"><span>Width (px)</span><input id="veGeometryWidth" type="number" min="40" value="'+esc(parseFloat(geo('width'))||'')+'" placeholder="Auto"></label><label class="ve-prop-field"><span>'+ (isTextBox?'Min height':'Height') +' (px)</span><input id="veGeometryHeight" type="number" min="20" value="'+esc(parseFloat(geo(isTextBox?'minHeight':'height'))||'')+'" placeholder="Auto"></label></div>'+
      '<div class="ve-premium-action-grid"><button type="button" data-canvas-action="left">Align left</button><button type="button" data-canvas-action="center">Center</button><button type="button" data-canvas-action="right">Align right</button><button type="button" data-canvas-action="middle">Center vertically</button><button type="button" data-canvas-action="reset">Reset position</button><button type="button" data-canvas-action="select-parent">Select parent</button></div>'+
      '<small class="ve-premium-shortcut">Arrow keys nudge 1px · Shift + Arrow nudges 10px · Use the toolbar for guides, layers and snap.</small></div>');
    fields.push('<div class="ve-prop-group"><h3>Layers</h3><div class="ve-premium-layers">'+layout.added.map(item=>'<button type="button" data-select-layer="[data-vb-added-id=&quot;'+esc(item.id)+'&quot;]" class="ve-premium-layer"><span>'+esc((item.type||'element').toUpperCase())+'</span><b>'+esc((item.text||item.type||'New element').slice(0,45))+'</b></button>').join('')+'</div><div class="ve-premium-action-grid"><button type="button" data-canvas-action="front">Bring forward</button><button type="button" data-canvas-action="back">Send backward</button></div></div>');
    fields.push(`<div class="ve-prop-group"><h3>Appearance</h3><div class="ve-prop-two"><label class="ve-prop-field"><span>Text colour</span><input id="veColor" type="color" value="${/^#[0-9a-f]{6}$/i.test(styles.color || selected.styles?.color || '') ? (styles.color || selected.styles.color) : '#17191f'}"></label><label class="ve-prop-field"><span>Background</span><input id="veBackground" type="color" value="${/^#[0-9a-f]{6}$/i.test(styles.backgroundColor || selected.styles?.backgroundColor || '') ? (styles.backgroundColor || selected.styles.backgroundColor) : '#ffffff'}"></label></div><div class="ve-prop-two"><label class="ve-prop-field"><span>Font size</span><input id="veFontSize" value="${value('fontSize', styles.fontSize || selected.styles?.fontSize || '')}" placeholder="e.g. 24px"></label><label class="ve-prop-field"><span>Width</span><input id="veWidth" value="${value('width', styles.width || selected.styles?.width || '')}" placeholder="e.g. 100%"></label></div><label class="ve-prop-field"><span>Text alignment</span><select id="veAlign"><option value="">Keep current</option>${['left','center','right','justify'].map(x => `<option value="${x}" ${(styles.textAlign || selected.styles?.textAlign) === x ? 'selected' : ''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select></label><div class="ve-prop-two"><label class="ve-prop-field"><span>Padding</span><input id="vePadding" value="${value('padding', styles.padding || selected.styles?.padding || '')}" placeholder="e.g. 16px"></label><label class="ve-prop-field"><span>Margin</span><input id="veMargin" value="${value('margin', styles.margin || selected.styles?.margin || '')}" placeholder="e.g. 12px 0"></label></div><label class="ve-prop-field"><span>Corner radius</span><input id="veRadius" value="${value('borderRadius', styles.borderRadius || selected.styles?.borderRadius || '')}" placeholder="e.g. 12px"></label></div>`);
    fields.push(`<div class="ve-prop-group"><h3>Visibility & actions</h3><label class="ve-prop-toggle"><input id="veHidden" type="checkbox" ${patch.hidden === true ? 'checked' : ''}> Hide this element on the live page</label><div class="ve-prop-actions"><button id="veDelete" class="danger" type="button">Delete / hide element</button></div></div>`);
    fields.push(`<div class="ve-prop-summary"><b>Selected: ${esc(selected.tag || 'element')}</b><small>${esc(selected.selector || 'New block')}</small></div>`);
    properties.innerHTML = fields.join('');
    $$('.ve-social-input',properties).forEach(input=>input.addEventListener('change',event=>{
      if(!selected?.addedId)return;
      const item=layout.added.find(x=>x.id===selected.addedId);
      if(!item)return;
      const next={...(item.links||{})};
      const platform=input.dataset.socialPlatform;
      const value=event.target.value.trim();
      if(value && !/^https?:\/\//i.test(value)){
        toast('Use a full URL beginning with https:// for '+platform+'.',true);
        event.target.focus();return;
      }
      next[platform]=value;
      updateSelected('links',next);
    }));
    $('#veText')?.addEventListener('input', e => updateSelected('text', e.target.value));
    $('#veBody')?.addEventListener('input', e => updateSelected('body', e.target.value));
    $('#veHref')?.addEventListener('change', e => updateSelected('href', e.target.value));
    $('#veSrc')?.addEventListener('change', e => updateSelected('src', e.target.value));
    $('#veBrowseMedia')?.addEventListener('click', openVisualMediaLibrary);
    $('#veAlt')?.addEventListener('input', e => updateSelected('alt', e.target.value));
    const styleBindings = [['veColor','color'],['veBackground','backgroundColor'],['veFontSize','fontSize'],['veWidth','width'],['veAlign','textAlign'],['vePadding','padding'],['veMargin','margin'],['veRadius','borderRadius']];
    styleBindings.forEach(([id,key]) => $(`#${id}`)?.addEventListener('input', e => updateSelected(key, e.target.value, true)));
    const commitXY=()=>setDeviceGeometry({translate:String(Number($('#veX')?.value||0))+'px '+String(Number($('#veY')?.value||0))+'px'});
    $('#veX')?.addEventListener('change',commitXY);
    $('#veY')?.addEventListener('change',commitXY);
    $('#veGeometryWidth')?.addEventListener('change',event=>setDeviceGeometry({width:event.target.value?Math.max(40,Number(event.target.value))+'px':'auto'}));
    $('#veGeometryHeight')?.addEventListener('change',event=>setDeviceGeometry({[isTextBox?'minHeight':'height']:event.target.value?Math.max(20,Number(event.target.value))+'px':isTextBox?'0px':'auto'}));
    $$('[data-canvas-action]',properties).forEach(button=>button.addEventListener('click',()=>sendCanvas('vb:canvas-action',{action:button.dataset.canvasAction})));
    $$('[data-select-layer]',properties).forEach(button=>button.addEventListener('click',()=>sendCanvas('vb:select',{selector:button.dataset.selectLayer})));
    $('#veHidden')?.addEventListener('change', e => updateSelected('hidden', e.target.checked));
    $('#veDelete')?.addEventListener('click', deleteSelected);
  }
  // Media library for the visual builder. Uses the SAME persisted assets as Content Studio.
  let visualMediaDialog=null;
  let visualMediaItems=[];
  let visualMediaBusy=false;
  function ensureVisualMediaDialog(){
    if(visualMediaDialog)return visualMediaDialog;
    const css=document.createElement('style');css.id='ve-integrated-media-styles';css.textContent=`
      .ve-media-property{display:flex;flex-direction:column;gap:6px;margin:-4px 0 13px}
      .ve-media-browse{border:1px solid #ced6ff;background:#f4f6ff;color:#3d56cc;border-radius:9px;padding:10px 12px;font-size:10px;font-weight:850;cursor:pointer;text-align:center}
      .ve-media-browse:hover{background:#ebefff;border-color:#4563f5}
      .ve-media-property span{color:#8a93a0;font-size:9px;line-height:1.6}
      .ve-media-dialog{width:min(800px,calc(100vw - 28px));max-height:89vh;border:1px solid #e5e9ef;border-radius:16px;background:#fff;box-shadow:0 25px 75px rgba(13,20,34,.2);padding:0;color:#263144;font-family:Inter,Arial,sans-serif;overflow:hidden}
      .ve-media-dialog::backdrop{background:rgba(16,23,35,.62);backdrop-filter:blur(5px)}
      .ve-media-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:21px 22px;border-bottom:1px solid #eaedf1}
      .ve-media-head b{display:block;font-size:16px;letter-spacing:-.035em}
      .ve-media-head small{display:block;margin-top:6px;color:#919aaa;font-size:10px}
      .ve-media-actions{display:flex;align-items:center;gap:8px}
      .ve-media-actions label{display:inline-flex;justify-content:center;align-items:center;padding:10px 14px;border-radius:9px;background:#4563f5;color:#fff;font-size:10px;font-weight:800;cursor:pointer;white-space:nowrap}
      .ve-media-actions button{width:30px;height:30px;display:grid;place-items:center;border:1px solid #e2e7ef;border-radius:50%;background:#fff;color:#4a5568;font-size:18px;cursor:pointer}
      .ve-media-body{padding:20px;overflow-y:auto;max-height:69vh}
      .ve-media-drop{display:flex;align-items:center;gap:13px;padding:18px;border:1.5px dashed #cbd4e6;border-radius:12px;background:#f7f9fd;cursor:pointer}
      .ve-media-drop:hover,.ve-media-drop.dragging{border-color:#4563f5;background:#f1f4ff}
      .ve-media-drop-icon{width:42px;height:42px;display:grid;place-items:center;border-radius:11px;background:#e7edff;color:#4563f5;font-size:20px}
      .ve-media-drop b{display:block;font-size:11px}.ve-media-drop span{display:block;margin-top:5px;color:#8994a2;font-size:9px;line-height:1.5}
      .ve-media-search{width:100%;min-height:39px;margin:15px 0;padding:0 13px;border:1px solid #e0e5ed;border-radius:9px;background:#fff;outline:none;font-size:11px}
      .ve-media-search:focus{border-color:#4563f5;box-shadow:0 0 0 3px rgba(69,99,245,.1)}
      .ve-media-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px}
      .ve-media-tile{overflow:hidden;border:1px solid #e2e6ee;border-radius:10px;background:#fff;padding:0;text-align:left;cursor:pointer}
      .ve-media-tile:hover{border-color:#4563f5;box-shadow:0 8px 17px rgba(30,48,80,.09)}
      .ve-media-thumb{height:112px;display:grid;place-items:center;background:#f2f4f8;color:#4563f5;font-size:24px}
      .ve-media-thumb img{width:100%;height:100%;object-fit:cover;display:block}
      .ve-media-name{display:block;padding:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#364252;font-size:10px;font-weight:750}
      .ve-media-status{margin:0 0 13px;border-radius:8px;background:#eef2ff;color:#3856b9;padding:9px 11px;font-size:10px}
      .ve-media-status.error{background:#fff3f3;color:#b34252}
      .ve-media-empty{padding:30px;text-align:center;color:#8a94a1;background:#fafbfd;border:1px dashed #dce2ed;border-radius:10px;font-size:10px;line-height:1.6}
      @media(max-width:550px){.ve-media-head{padding:14px}.ve-media-head b{font-size:14px}.ve-media-actions{gap:5px}.ve-media-actions label{padding:9px;font-size:9px}.ve-media-body{padding:12px}.ve-media-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.ve-media-thumb{height:112px}.ve-media-drop{padding:12px}}
    `;document.head.appendChild(css);
    visualMediaDialog=document.createElement('dialog');
    visualMediaDialog.id='veMediaDialog';visualMediaDialog.className='ve-media-dialog';
    visualMediaDialog.innerHTML=`<div class="ve-media-head"><div><b>Choose or upload media</b><small>Use an image or video in your page design.</small></div><div class="ve-media-actions"><label for="veMediaFile">+ Upload</label><button type="button" data-vem-close aria-label="Close">×</button></div></div><div class="ve-media-body"><div class="ve-media-drop" tabindex="0" role="button"><span class="ve-media-drop-icon" aria-hidden="true">↑</span><div><b>Upload from your computer</b><span>Drag and drop or click here · Max 50 MB per file</span></div></div><input id="veMediaSearch" type="search" class="ve-media-search" placeholder="Search your media library..." aria-label="Search media"><div id="veMediaFeedback" class="ve-media-status" hidden></div><div id="veMediaResults" class="ve-media-grid"></div></div><input type="file" id="veMediaFile" accept=".jpg,.jpeg,.png,.webp,.gif,.svg,.mp4,.webm,image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm" multiple hidden>`;
    document.body.appendChild(visualMediaDialog);
    $('[data-vem-close]',visualMediaDialog).addEventListener('click',()=>visualMediaDialog.close());
    $('#veMediaSearch',visualMediaDialog).addEventListener('input',drawVisualMedia);
    const input=$('#veMediaFile',visualMediaDialog);
    input.addEventListener('change',event=>uploadVisualMediaFiles(event.target.files));
    const drop=$('.ve-media-drop',visualMediaDialog);
    drop.addEventListener('click',()=>input.click());
    drop.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();input.click();}});
    for(const name of ['dragenter','dragover'])drop.addEventListener(name,event=>{event.preventDefault();drop.classList.add('dragging');});
    drop.addEventListener('dragleave',event=>{if(!drop.contains(event.relatedTarget))drop.classList.remove('dragging');});
    drop.addEventListener('drop',event=>{event.preventDefault();drop.classList.remove('dragging');uploadVisualMediaFiles(event.dataTransfer?.files||[]);});
    $('#veMediaResults',visualMediaDialog).addEventListener('click',event=>{
      const button=event.target.closest('[data-media-id]');if(!button)return;
      const item=visualMediaItems.find(x=>String(x.id)===button.dataset.mediaId);
      if(!item||!selected){toast('Choose an element first.',true);return;}
      updateSelected('src',item.url);
      if((selected.tag==='img'||(selected.addedId&&layout.added.find(x=>x.id===selected.addedId)?.type==='image'))&&item.alt_text)updateSelected('alt',item.alt_text);
      renderProperties();
      visualMediaDialog.close();toast('Media inserted. Save draft or publish when ready.');
    });
    return visualMediaDialog;
  }
  function visualMediaStatus(message='',error=false){
    if(!visualMediaDialog)return;
    const node=$('#veMediaFeedback',visualMediaDialog);
    node.hidden=!message;node.classList.toggle('error',error);node.textContent=message;
  }
  function drawVisualMedia(){
    if(!visualMediaDialog)return;
    const added=selected?.addedId?layout.added.find(x=>x.id===selected.addedId):null;
    const video=selected?.tag==='video'||added?.type==='video';
    const term=String($('#veMediaSearch',visualMediaDialog).value||'').trim().toLowerCase();
    const items=visualMediaItems.filter(item=>{
      const mime=String(item.content_type||'').toLowerCase();
      const isCorrect=video?mime.startsWith('video/'):mime.startsWith('image/');
      return isCorrect&&[item.filename,item.alt_text].join(' ').toLowerCase().includes(term);
    });
    $('#veMediaResults',visualMediaDialog).innerHTML=items.length?items.map(item=>`<button type="button" class="ve-media-tile" data-media-id="${esc(item.id)}"><span class="ve-media-thumb">${String(item.content_type||'').startsWith('image/')?`<img src="${esc(item.url)}" alt="${esc(item.alt_text||item.filename||'Media')}" loading="lazy">`:'▶'}</span><span class="ve-media-name">${esc(item.filename||'Media file')}</span></button>`).join(''):`<div class="ve-media-empty">No ${video?'videos':'images'} to display. Upload a file above to get started.</div>`;
  }
  async function openVisualMediaLibrary(){
    const dialog=ensureVisualMediaDialog();
    visualMediaStatus('Loading saved media...');
    $('#veMediaSearch',dialog).value='';drawVisualMedia();dialog.showModal();
    try{
      const data=await request('/api/admin?resource=media');
      visualMediaItems=Array.isArray(data.data)?data.data:[];
      visualMediaStatus();drawVisualMedia();
    }catch(error){visualMediaStatus(error.message||'Could not load media.',true);}
  }
  async function uploadVisualMediaFiles(filesInput){
    if(visualMediaBusy)return;
    const files=Array.from(filesInput||[]);if(!files.length)return;
    const allowed=new Set(['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm']);
    if(files.some(file=>file.size>50*1024*1024)){visualMediaStatus('Each file must be 50 MB or smaller.',true);return;}
    if(files.some(file=>!allowed.has(file.type))){visualMediaStatus('Unsupported file format. Choose JPG, PNG, WebP, GIF, SVG, MP4 or WebM.',true);return;}
    const input=$('#veMediaFile',visualMediaDialog);input.disabled=true;visualMediaBusy=true;
    let done=0;
    try{
      const {upload}=await import('https://esm.sh/@vercel/blob@2.0.0/client');
      for(const file of files){
        visualMediaStatus(`Uploading ${done+1} of ${files.length}: ${file.name}`);
        const result=await upload(file.name,file,{access:'public',handleUploadUrl:'/api/upload'});
        await request('/api/admin',{method:'POST',body:JSON.stringify({resource:'media',action:'create',data:{url:result.url,pathname:result.pathname,filename:file.name,content_type:file.type,size_bytes:file.size,alt_text:file.name.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')}})});
        done++;
      }
      const data=await request('/api/admin?resource=media');
      visualMediaItems=Array.isArray(data.data)?data.data:[];
      visualMediaStatus(`${done} file${done===1?'':'s'} uploaded. Select one below to use it.`);drawVisualMedia();
    }catch(error){visualMediaStatus(`${done?`${done} uploaded. `:''}${error.message||'Upload failed.'}`,true);}
    finally{input.disabled=false;input.value='';visualMediaBusy=false;}
  }
  function deleteSelected() {
    if (!selected) return;
    if (selected.addedId) layout.added = layout.added.filter(x => x.id !== selected.addedId);
    else getPatch(selected.selector).hidden = true;
    selected = null; setDirty(); snapshot(); applyToFrame(); renderProperties();
  }
  function addElement(type) {
    if (!frame.contentWindow) { toast('Wait for the page preview to load.', true); return; }
    frame.contentWindow.postMessage({ type:'vb:add', blockType:type }, location.origin);
  }
  async function save(action) {
    const button = action === 'publish' ? $('#vePublish') : $('#veSaveDraft');
    button.disabled = true;
    try {
      await request('/api/visual-layout', { method:'POST', body:JSON.stringify({ page, action, layout }) });
      publishedLayout = action === 'publish' ? clone(layout) : publishedLayout;
      setDirty(false); snapshot();
      toast(action === 'publish' ? 'Your visual changes are now live.' : 'Draft saved. Visitors will not see it yet.');
    } catch (error) { toast(error.message, true); }
    finally { button.disabled = false; }
  }
  function setDevice(device) {
    currentDevice = device;
    shell.classList.toggle('tablet', device === 'tablet');
    shell.classList.toggle('mobile', device === 'mobile');
    $$('[data-device]').forEach(b => b.classList.toggle('active', b.dataset.device === device));
    $('#vePreviewLabel').textContent = device[0].toUpperCase() + device.slice(1);
    sendCanvas('vb:set-device',{device});
    setTimeout(()=>sendCanvas('vb:set-device',{device}),270);
    if(selected)renderProperties();
  }

  function duplicateSelected(){
    if(!selected){toast('Select an element in the preview first.',true);return;}
    const source=selected.addedId?layout.added.find(x=>x.id===selected.addedId):null;
    if(!source){toast('Duplication is available for elements you add in the builder.',true);return;}
    const copy=clone(source);
    copy.id='vb_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7);
    copy.hidden=false;
    layout.added.push(copy);
    setDirty();snapshot();applyToFrame();
    setTimeout(()=>sendCanvas('vb:select',{selector:'[data-vb-added-id="'+copy.id+'"]'}),130);
    toast('Element duplicated. Drag the copy to its new position.');
  }
  $('#veDuplicate')?.addEventListener('click',duplicateSelected);
  $('#veShowLayers')?.addEventListener('click',()=>{
    $('#veTabAdvanced')?.click();
    $('.ve-premium-layers',properties)?.scrollIntoView({block:'nearest',behavior:'smooth'});
  });
  $('#vePage').addEventListener('change', e => loadPage(e.target.value));
  $('#veRefresh').addEventListener('click', () => { const src = frame.src; frame.src = 'about:blank'; setTimeout(() => { frame.src = src; }, 50); });
  $('#veSaveDraft').addEventListener('click', () => save('draft'));
  $('#vePublish').addEventListener('click', () => { if (confirm(`Publish the visual changes to the ${page} page?`)) save('publish'); });
  $$('[data-add]').forEach(b => b.addEventListener('click', () => addElement(b.dataset.add)));
  $$('[data-device]').forEach(b => b.addEventListener('click', () => setDevice(b.dataset.device)));
  frame.addEventListener('load', () => {
    setTimeout(()=>sendCanvas('vb:set-device',{device:currentDevice}),120);
    setTimeout(applyToFrame,260);
    setTimeout(()=>{sendCanvas('vb:set-device',{device:currentDevice});applyToFrame();},850);
  });
  $('#veUndo').addEventListener('click', () => {
    if (historyIndex <= 0) return;
    historyIndex--; layout = JSON.parse(history[historyIndex]); setDirty(); updateHistoryButtons(); applyToFrame(); renderProperties();
  });
  $('#veRedo').addEventListener('click', () => {
    if (historyIndex >= history.length - 1) return;
    historyIndex++; layout = JSON.parse(history[historyIndex]); setDirty(); updateHistoryButtons(); applyToFrame(); renderProperties();
  });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== frame.contentWindow) return;
    const data = event.data || {};
    if (data.type === 'vb:selected') { selected = data.element; renderProperties(); }
    if (data.type === 'vb:inline-edit' && data.element) {
      selected = data.element; const p = selected.addedId ? layout.added.find(x => x.id === selected.addedId) : getPatch(selected.selector);
      if (p) p.text = data.text; setDirty(); scheduleSnapshot();
      const textField = $('#veText'); if (textField && document.activeElement !== textField) textField.value = data.text;
    }
    if (data.type === 'vb:added') {
      if (!layout.added.some(x => x.id === data.item.id)) layout.added.push(data.item);
      selected = data.element || { selector:`[data-vb-added-id="${data.item.id}"]`, tag:data.item.type, text:data.item.text, editableText:true, addedId:data.item.id };
      setDirty(); snapshot(); renderProperties(); applyToFrame();
      if(data.item.type==='social'){
        request('/api/admin?resource=settings').then(result=>{
          const item=layout.added.find(x=>x.id===data.item.id);
          if(!item)return;
          const s=result.data||{};
          const mapping={instagram:'social_instagram',linkedin:'social_linkedin',facebook:'social_facebook',tiktok:'social_tiktok',youtube:'social_youtube',x:'social_x',pinterest:'social_pinterest',whatsapp:'whatsapp'};
          const links={...(item.links||{})};
          for(const [platform,key] of Object.entries(mapping)){
            const raw=String(s[key]||'').trim();
            if(!raw)continue;
            let url=raw;
            if(platform==='whatsapp'&&!/^https?:\/\//i.test(raw)){
              const digits=raw.replace(/[^0-9]/g,'');url=digits.length>=8&&digits.length<=15?'https://wa.me/'+digits:'';
            }
            if(/^https?:\/\//i.test(url)&&!links[platform])links[platform]=url;
          }
          item.links=links;
          setDirty();snapshot();renderProperties();applyToFrame();
        }).catch(()=>{/* Manual URLs remain editable if settings fail to load. */});
      }
    }
    if (data.type === 'vb:moved') {
      layout.moves = layout.moves.filter(x => x.selector !== data.move.selector);
      layout.moves.push(data.move); setDirty(); snapshot();
    }
    if (data.type === 'vb:geometry-commit' && data.styles) {
      const patch=data.addedId?layout.added.find(x=>x.id===data.addedId):getPatch(data.selector);
      if(patch){
        const device=['desktop','tablet','mobile'].includes(data.device)?data.device:'desktop';
        const valid=Object.fromEntries(Object.entries(data.styles).filter(([key,value])=>geometryKeys.includes(key)&&typeof value==='string'));
        patch.deviceStyles=patch.deviceStyles||{};
        patch.deviceStyles[device]={...(patch.deviceStyles[device]||{}),...valid};
        setDirty();snapshot();applyToFrame();renderProperties();
      }
    }
    if(data.type==='vb:canvas-ready')toast('Direct canvas controls ready: drag, resize and align elements.');
    if(data.type==='vb:shortcut' && data.action==='undo')$('#veUndo').click();
    if(data.type==='vb:shortcut' && data.action==='redo')$('#veRedo').click();
    if(data.type==='vb:shortcut' && data.action==='duplicate')duplicateSelected();
    if (data.type === 'vb:deleted') { deleteSelected(); }
  });

  checkAuth().then(() => loadPage('home'));
})();
