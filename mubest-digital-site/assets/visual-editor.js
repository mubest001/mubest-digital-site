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
    const value = (key, fallback = '') => esc(patch[key] !== undefined ? patch[key] : fallback);
    const currentText = patch.text !== undefined ? patch.text : selected.text || '';
    const fields = [];
    if (selected.editableText || selected.tag === 'a' || selected.tag === 'button' || selected.addedId) {
      fields.push(`<div class="ve-prop-group"><h3>Content</h3><label class="ve-prop-field"><span>Text / label</span><textarea id="veText" rows="4">${esc(currentText)}</textarea></label>${selected.addedId && ['section','review'].includes(added?.type) ? `<label class="ve-prop-field"><span>Supporting text</span><textarea id="veBody" rows="3">${value('body', added?.body || '')}</textarea></label>` : ''}</div>`);
    }
    if (selected.tag === 'a' || selected.href || selected.addedId && ['button'].includes(added?.type)) {
      fields.push(`<div class="ve-prop-group"><h3>Link</h3><label class="ve-prop-field"><span>Destination URL</span><input id="veHref" value="${value('href', selected.href || '')}" placeholder="/contact/ or https://..."></label></div>`);
    }
    if (selected.tag === 'img' || selected.tag === 'video' || selected.src || selected.addedId && ['image','video'].includes(added?.type)) {
      fields.push(`<div class="ve-prop-group"><h3>Media</h3><label class="ve-prop-field"><span>Media URL</span><input id="veSrc" value="${value('src', selected.src || '')}" placeholder="https://... or /assets/..."></label>${selected.tag === 'img' || added?.type === 'image' ? `<label class="ve-prop-field"><span>Alternative text</span><input id="veAlt" value="${value('alt', selected.alt || '')}" placeholder="Describe the image"></label>` : ''}</div>`);
    }
    fields.push(`<div class="ve-prop-group"><h3>Appearance</h3><div class="ve-prop-two"><label class="ve-prop-field"><span>Text colour</span><input id="veColor" type="color" value="${/^#[0-9a-f]{6}$/i.test(styles.color || selected.styles?.color || '') ? (styles.color || selected.styles.color) : '#17191f'}"></label><label class="ve-prop-field"><span>Background</span><input id="veBackground" type="color" value="${/^#[0-9a-f]{6}$/i.test(styles.backgroundColor || selected.styles?.backgroundColor || '') ? (styles.backgroundColor || selected.styles.backgroundColor) : '#ffffff'}"></label></div><div class="ve-prop-two"><label class="ve-prop-field"><span>Font size</span><input id="veFontSize" value="${value('fontSize', styles.fontSize || selected.styles?.fontSize || '')}" placeholder="e.g. 24px"></label><label class="ve-prop-field"><span>Width</span><input id="veWidth" value="${value('width', styles.width || selected.styles?.width || '')}" placeholder="e.g. 100%"></label></div><label class="ve-prop-field"><span>Text alignment</span><select id="veAlign"><option value="">Keep current</option>${['left','center','right','justify'].map(x => `<option value="${x}" ${(styles.textAlign || selected.styles?.textAlign) === x ? 'selected' : ''}>${x[0].toUpperCase()+x.slice(1)}</option>`).join('')}</select></label><div class="ve-prop-two"><label class="ve-prop-field"><span>Padding</span><input id="vePadding" value="${value('padding', styles.padding || selected.styles?.padding || '')}" placeholder="e.g. 16px"></label><label class="ve-prop-field"><span>Margin</span><input id="veMargin" value="${value('margin', styles.margin || selected.styles?.margin || '')}" placeholder="e.g. 12px 0"></label></div><label class="ve-prop-field"><span>Corner radius</span><input id="veRadius" value="${value('borderRadius', styles.borderRadius || selected.styles?.borderRadius || '')}" placeholder="e.g. 12px"></label></div>`);
    fields.push(`<div class="ve-prop-group"><h3>Visibility & actions</h3><label class="ve-prop-toggle"><input id="veHidden" type="checkbox" ${patch.hidden === true ? 'checked' : ''}> Hide this element on the live page</label><div class="ve-prop-actions"><button id="veDelete" class="danger" type="button">Delete / hide element</button></div></div>`);
    fields.push(`<div class="ve-prop-summary"><b>Selected: ${esc(selected.tag || 'element')}</b><small>${esc(selected.selector || 'New block')}</small></div>`);
    properties.innerHTML = fields.join('');
    $('#veText')?.addEventListener('input', e => updateSelected('text', e.target.value));
    $('#veBody')?.addEventListener('input', e => updateSelected('body', e.target.value));
    $('#veHref')?.addEventListener('change', e => updateSelected('href', e.target.value));
    $('#veSrc')?.addEventListener('change', e => updateSelected('src', e.target.value));
    $('#veAlt')?.addEventListener('input', e => updateSelected('alt', e.target.value));
    const styleBindings = [['veColor','color'],['veBackground','backgroundColor'],['veFontSize','fontSize'],['veWidth','width'],['veAlign','textAlign'],['vePadding','padding'],['veMargin','margin'],['veRadius','borderRadius']];
    styleBindings.forEach(([id,key]) => $(`#${id}`)?.addEventListener('input', e => updateSelected(key, e.target.value, true)));
    $('#veHidden')?.addEventListener('change', e => updateSelected('hidden', e.target.checked));
    $('#veDelete')?.addEventListener('click', deleteSelected);
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
  }

  $('#vePage').addEventListener('change', e => loadPage(e.target.value));
  $('#veRefresh').addEventListener('click', () => { const src = frame.src; frame.src = 'about:blank'; setTimeout(() => { frame.src = src; }, 50); });
  $('#veSaveDraft').addEventListener('click', () => save('draft'));
  $('#vePublish').addEventListener('click', () => { if (confirm(`Publish the visual changes to the ${page} page?`)) save('publish'); });
  $$('[data-add]').forEach(b => b.addEventListener('click', () => addElement(b.dataset.add)));
  $$('[data-device]').forEach(b => b.addEventListener('click', () => setDevice(b.dataset.device)));
  frame.addEventListener('load', () => { setTimeout(applyToFrame, 220); setTimeout(applyToFrame, 850); });
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
    }
    if (data.type === 'vb:moved') {
      layout.moves = layout.moves.filter(x => x.selector !== data.move.selector);
      layout.moves.push(data.move); setDirty(); snapshot();
    }
    if (data.type === 'vb:deleted') { deleteSelected(); }
  });

  checkAuth().then(() => loadPage('home'));
})();
