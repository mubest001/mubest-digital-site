/* Mubest Digital · Media picker upload enhancement.
   Uses the existing authenticated Vercel Blob upload endpoint and CMS media API. */
(() => {
  'use strict';

  const dialog = document.querySelector('#mediaDialog');
  const picker = document.querySelector('#mediaPicker');
  if (!dialog || !picker) return;

  const allowedTypes = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm'
  ]);
  const maxBytes = 50 * 1024 * 1024;
  let lastTrigger = null;
  let uploading = false;

  const style = document.createElement('style');
  style.id = 'media-picker-upload-styles';
  style.textContent = `
    .media-dialog{width:min(960px,calc(100% - 30px))}
    .media-dialog .dialog-head{align-items:center}
    .media-dialog .dialog-head>div:first-child{flex:1;min-width:0}
    .mpu-head-actions{display:flex;align-items:center;gap:10px;flex:none}
    .mpu-upload-trigger{display:inline-flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;cursor:pointer}
    .mpu-upload-trigger .mpu-plus{font-size:16px;line-height:1}
    .mpu-upload-input{display:none!important}
    .media-picker{display:block;max-height:68vh;overflow:auto;padding:20px 24px}
    .mpu-dropzone{display:flex;align-items:center;gap:14px;padding:16px 18px;margin:0 0 18px;border:1px dashed #cbd4e2;border-radius:13px;background:#f8faff;transition:background .18s,border-color .18s,box-shadow .18s}
    .mpu-dropzone.is-dragging{border-color:#4563f5;background:#f0f3ff;box-shadow:0 0 0 4px rgba(69,99,245,.08)}
    .mpu-drop-icon{display:grid;place-items:center;flex:none;width:42px;height:42px;border-radius:12px;background:#edf1ff;color:#4563f5;font-size:22px;font-weight:800}
    .mpu-drop-copy{flex:1;min-width:0}
    .mpu-drop-copy strong{display:block;color:#293344;font-size:11px;font-weight:850}
    .mpu-drop-copy span{display:block;margin-top:5px;color:#8993a2;font-size:9px;line-height:1.5}
    .mpu-browse-button{flex:none;padding:9px 13px;border:1px solid #dce2ec;border-radius:8px;background:#fff;color:#3e55c7;font-size:10px;font-weight:850;cursor:pointer}
    .mpu-browse-button:hover{border-color:#aebcff;background:#f8f9ff}
    .mpu-media-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}
    .media-picker .media-pick{display:block;width:100%;min-width:0;padding:0;overflow:hidden;border:2px solid transparent;border-radius:11px;background:#f1f4f7;text-align:left;cursor:pointer;transition:border-color .16s,transform .16s,box-shadow .16s}
    .media-picker .media-pick:hover{border-color:#4563f5;transform:translateY(-2px);box-shadow:0 7px 18px rgba(30,48,90,.1)}
    .media-picker .media-pick img{width:100%;height:125px;display:block;object-fit:cover}
    .media-picker .media-pick span{display:block;padding:9px 10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;color:#364153}
    .media-picker .empty-state.mpu-empty{display:block;margin:0;padding:27px 18px;border:1px dashed #dce2ec;border-radius:12px;background:#fbfcfe;color:#7f8998;text-align:center;font-size:11px;line-height:1.7}
    .mpu-status{padding:10px 24px;border-top:1px solid #edf0f3;background:#fafbfc;color:#596678;font-size:10px;line-height:1.5}
    .mpu-status[data-state="error"]{background:#fff5f5;color:#a23b47}
    .mpu-status[data-state="success"]{background:#f5faef;color:#54743a}
    .mpu-status[hidden]{display:none}
    @media(max-width:640px){
      .media-dialog .dialog-head{align-items:flex-start;padding:18px}
      .mpu-head-actions{gap:6px}
      .mpu-upload-trigger{padding:0 10px;font-size:9px}
      .media-picker{padding:14px}
      .mpu-dropzone{align-items:flex-start;flex-wrap:wrap;padding:13px}
      .mpu-drop-copy{min-width:calc(100% - 60px)}
      .mpu-browse-button{margin-left:56px}
      .mpu-media-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
      .media-picker .media-pick img{height:105px}
    }
  `;
  document.head.appendChild(style);

  const head = dialog.querySelector('.dialog-head');
  const closeButton = head?.querySelector('[data-close-media]');
  const heading = head?.querySelector('h2');
  const description = head?.querySelector('p');
  if (heading) heading.textContent = 'Choose or upload media';
  if (description) description.textContent = 'Upload a new image or video, or select an asset already in your library.';

  const input = document.createElement('input');
  input.type = 'file';
  input.id = 'mediaPickerUpload';
  input.className = 'mpu-upload-input';
  input.multiple = true;
  input.accept = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.svg,.mp4,.webm';

  const actions = document.createElement('div');
  actions.className = 'mpu-head-actions';
  const uploadLabel = document.createElement('label');
  uploadLabel.className = 'admin-button primary mpu-upload-trigger';
  uploadLabel.htmlFor = input.id;
  uploadLabel.innerHTML = '<span class="mpu-plus" aria-hidden="true">+</span> Upload media';
  if (closeButton) {
    head.insertBefore(actions, closeButton);
    actions.append(uploadLabel, closeButton);
  } else {
    head.append(actions);
    actions.append(uploadLabel);
  }
  dialog.append(input);

  const status = document.createElement('div');
  status.className = 'mpu-status';
  status.id = 'mediaPickerUploadStatus';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.hidden = true;
  dialog.insertBefore(status, picker);

  function setStatus(message, state = '') {
    status.textContent = message || '';
    status.dataset.state = state;
    status.hidden = !message;
  }

  document.addEventListener('click', event => {
    const trigger = event.target?.closest?.('[data-pick-image]');
    if (!trigger) return;
    lastTrigger = trigger;
    setStatus('');
  }, true);

  function enhancePicker() {
    if (!picker.querySelector('.mpu-dropzone')) {
      const zone = document.createElement('div');
      zone.className = 'mpu-dropzone';
      zone.innerHTML = `
        <span class="mpu-drop-icon" aria-hidden="true">↑</span>
        <span class="mpu-drop-copy">
          <strong>Drop images or videos here</strong>
          <span>Or browse your device · JPG, PNG, WEBP, GIF, SVG, MP4 and WEBM · Up to 50 MB per file</span>
        </span>
        <button type="button" class="mpu-browse-button">Browse files</button>
      `;
      picker.prepend(zone);
      zone.querySelector('.mpu-browse-button').addEventListener('click', () => input.click());
      zone.addEventListener('dragenter', event => {
        event.preventDefault();
        zone.classList.add('is-dragging');
      });
      zone.addEventListener('dragover', event => {
        event.preventDefault();
        zone.classList.add('is-dragging');
      });
      zone.addEventListener('dragleave', event => {
        if (!zone.contains(event.relatedTarget)) zone.classList.remove('is-dragging');
      });
      zone.addEventListener('drop', event => {
        event.preventDefault();
        zone.classList.remove('is-dragging');
        if (event.dataTransfer?.files?.length) uploadFiles(event.dataTransfer.files);
      });
    }

    const cards = [...picker.querySelectorAll('.media-pick')];
    if (cards.length && !picker.querySelector('.mpu-media-grid')) {
      const grid = document.createElement('div');
      grid.className = 'mpu-media-grid';
      cards[0].before(grid);
      cards.forEach(card => grid.append(card));
    }

    const empty = picker.querySelector('.empty-state');
    if (empty) {
      empty.classList.add('mpu-empty');
      empty.textContent = 'Your media library is empty. Upload an image or video above to get started.';
    }
  }

  const observer = new MutationObserver(enhancePicker);
  observer.observe(picker, { childList: true, subtree: true });
  enhancePicker();

  async function uploadFiles(fileList) {
    if (uploading) return;
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const tooLarge = files.filter(file => file.size > maxBytes);
    if (tooLarge.length) {
      setStatus(`Each file must be 50 MB or smaller. Please remove: ${tooLarge.map(file => file.name).join(', ')}`, 'error');
      return;
    }
    const unsupported = files.filter(file => !allowedTypes.has(file.type));
    if (unsupported.length) {
      setStatus(`Unsupported file type: ${unsupported.map(file => file.name).join(', ')}. Use JPG, PNG, WEBP, GIF, SVG, MP4 or WEBM.`, 'error');
      return;
    }

    uploading = true;
    uploadLabel.textContent = 'Uploading…';
    uploadLabel.style.pointerEvents = 'none';
    const browseButton = picker.querySelector('.mpu-browse-button');
    if (browseButton) browseButton.disabled = true;

    let uploaded = 0;
    try {
      const { upload } = await import('https://esm.sh/@vercel/blob@2.0.0/client');
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        setStatus(`Uploading ${index + 1} of ${files.length}: ${file.name}`);
        const result = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload'
        });

        const response = await fetch('/api/admin', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource: 'media',
            action: 'create',
            data: {
              url: result.url,
              pathname: result.pathname,
              filename: file.name,
              content_type: file.type,
              size_bytes: file.size,
              alt_text: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')
            }
          })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || `Could not save ${file.name} to the media library.`);
        uploaded++;
      }

      setStatus(`${uploaded} file${uploaded === 1 ? '' : 's'} uploaded. Refreshing your media library…`, 'success');
      const trigger = lastTrigger;
      if (trigger?.isConnected) {
        dialog.close();
        window.setTimeout(() => trigger.click(), 120);
      } else {
        setStatus('Upload complete. Close this window and reopen the media picker to see your files.', 'success');
      }
    } catch (error) {
      const message = uploaded
        ? `${uploaded} file${uploaded === 1 ? '' : 's'} uploaded, but another upload failed: ${error.message}`
        : (error.message || 'Upload failed. Please try again.');
      setStatus(message, 'error');
      if (uploaded && lastTrigger?.isConnected) {
        const trigger = lastTrigger;
        dialog.close();
        window.setTimeout(() => {
          trigger.click();
          window.setTimeout(() => setStatus(message, 'error'), 900);
        }, 120);
      }
    } finally {
      uploading = false;
      uploadLabel.innerHTML = '<span class="mpu-plus" aria-hidden="true">+</span> Upload media';
      uploadLabel.style.pointerEvents = '';
      if (browseButton) browseButton.disabled = false;
      input.value = '';
    }
  }

  input.addEventListener('change', event => uploadFiles(event.target.files));
})();