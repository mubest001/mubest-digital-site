/* Mubest Digital Premium V5 · real-data project case study enhancements */
(function MubestCaseStudyExperience() {
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safe=v=>{const s=String(v||'').trim();return /^https:\/\//i.test(s)||/^\/(?!\/)/.test(s)?s:'';};
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
  let lightbox, current=0,images=[],title="";
  function openGallery(index){
    if(!images.length)return;
    current=index;
    if(!lightbox){
      lightbox=document.createElement('dialog');lightbox.className='v5-lightbox';lightbox.setAttribute('aria-label','Project image viewer');
      lightbox.innerHTML='<div class="v5-lightbox-top"><span>PROJECT GALLERY</span><button type="button" data-lightbox-close aria-label="Close image viewer">×</button></div><figure><img alt=""><figcaption></figcaption></figure><div class="v5-lightbox-bottom"><button type="button" data-lightbox-prev aria-label="Previous image">← Previous</button><span data-lightbox-count></span><button type="button" data-lightbox-next aria-label="Next image">Next →</button></div>';
      document.body.appendChild(lightbox);
      $('[data-lightbox-close]',lightbox).addEventListener('click',()=>lightbox.close());
      $('[data-lightbox-prev]',lightbox).addEventListener('click',()=>{current=(current+images.length-1)%images.length;renderLightbox();});
      $('[data-lightbox-next]',lightbox).addEventListener('click',()=>{current=(current+1)%images.length;renderLightbox();});
      lightbox.addEventListener('click',event=>{if(event.target===lightbox)lightbox.close();});
      lightbox.addEventListener('keydown',event=>{
        if(event.key==='ArrowRight'){event.preventDefault();current=(current+1)%images.length;renderLightbox();}
        if(event.key==='ArrowLeft'){event.preventDefault();current=(current+images.length-1)%images.length;renderLightbox();}
      });
    }
    renderLightbox();lightbox.showModal();
  }
  function renderLightbox(){
    if(!lightbox)return;
    const img=$('img',lightbox);
    img.src=images[current];img.alt=title+' — image '+(current+1);
    $('figcaption',lightbox).textContent=title+' · Visual '+String(current+1).padStart(2,'0');
    $('[data-lightbox-count]',lightbox).textContent=(current+1)+' / '+images.length;
  }
  function enhance({data,project}){
    const details=project?.details||{};
    title=String(project?.title||'Project');
    const gallery=Array.isArray(project?.gallery)?project.gallery.map(safe).filter(Boolean):[];
    images=[safe(project?.cover_image),...gallery].filter(Boolean);
    // A gallery is never presented as before/after unless actual separate images were provided.
    const cover=$('#caseVisual');
    if(cover && !cover.querySelector('.v5-media-tabs') && images.length){
      cover.insertAdjacentHTML('afterbegin','<div class="v5-media-toolbar"><div><span class="v5-mini-eyebrow">THE WORK, UP CLOSE</span><strong>Explore the visuals</strong></div><div class="v5-media-controls" role="group" aria-label="Preview image size"><button type="button" data-v5-view="wide" aria-pressed="true">Wide view</button><button type="button" data-v5-view="phone" aria-pressed="false">Mobile frame</button><button type="button" data-v5-open>↗ Expand image</button></div></div>');
      const wrapper=$('.case-cover',cover);
      if(wrapper)wrapper.classList.add('v5-cover-preview');
      $$('[data-v5-view]',cover).forEach(button=>button.addEventListener('click',()=>{
        const phone=button.dataset.v5View==='phone';
        wrapper?.classList.toggle('v5-cover-phone',phone);
        $$('[data-v5-view]',cover).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      }));
      $('[data-v5-open]',cover).addEventListener('click',()=>openGallery(0));
    }
    const before=safe(details.before_image),after=safe(details.after_image);
    if(before&&after&&!$('#v5BeforeAfter')){
      const section=document.createElement('section');
      section.id='v5BeforeAfter';section.className='v5-comparison-section';
      section.innerHTML='<div class="container"><div class="v5-feature-intro"><span class="eyebrow">Before and after</span><h2>See what changed.</h2><p>Use the slider to compare the supplied before and after visuals.</p></div><div class="v5-comparison"><img class="v5-after" src="'+esc(after)+'" alt="After: '+esc(title)+'" loading="lazy"><img class="v5-before" src="'+esc(before)+'" alt="Before: '+esc(title)+'" loading="lazy"><span class="v5-before-tag">Before</span><span class="v5-after-tag">After</span><div class="v5-comparison-divider" aria-hidden="true"><span>↔</span></div><input type="range" min="0" max="100" value="50" aria-label="Reveal amount of before image"></div><p class="v5-source-note">Comparison shown only when original before and after visuals are supplied for the project.</p></div>';
      const main=$('#caseMain');main?.parentNode?.insertBefore(section,main);
      const input=$('input[type="range"]',section),comparator=$('.v5-comparison',section);
      const update=()=>{comparator.style.setProperty('--reveal',input.value+'%');};
      input.addEventListener('input',update);update();
    }
    const video=safe(details.walkthrough_video);
    if(video&&!$('#v5Walkthrough')){
      const isYouTube=video.match(/^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[&#?].*)?$/);
      const isDirect=/\.(mp4|webm)(?:\?.*)?$/i.test(video);
      const embed=isYouTube?'<iframe loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" title="'+esc(title)+' project walkthrough" src="https://www.youtube-nocookie.com/embed/'+isYouTube[1]+'" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"></iframe>':isDirect?'<video src="'+esc(video)+'" controls playsinline preload="none" aria-label="'+esc(title)+' video walkthrough"></video>':'';
      if(embed){
        const section=document.createElement('section');section.id='v5Walkthrough';section.className='v5-video-section';
        section.innerHTML='<div class="container"><div class="v5-feature-intro"><span class="eyebrow">Behind the project</span><h2>Watch the walkthrough.</h2><p>A closer look at the work and presentation.</p></div><div class="v5-video-frame">'+embed+'</div></div>';
        $('#caseGallerySection')?.before(section);
      }
    }
    if(gallery.length){
      $$('#caseGallery figure').forEach((figure,index)=>{
        const img=$('img',figure);if(!img)return;
        const button=document.createElement('button');button.type='button';button.className='v5-gallery-open';button.setAttribute('aria-label','Expand '+title+' visual '+(index+1));
        img.parentNode.insertBefore(button,img);button.appendChild(img);button.insertAdjacentHTML('beforeend','<span aria-hidden="true">↗</span>');
        button.addEventListener('click',()=>openGallery(index+1));
      });
    }
    const highlight=String(details.project_highlight||'').trim();
    if(highlight && $('#caseContent')){
      const section=document.createElement('section');section.className='v5-project-highlight';
      section.innerHTML='<span class="eyebrow">Project highlight</span><p>'+esc(highlight)+'</p>';
      $('#caseContent').prepend(section);
    }
    const actions=$('#caseActions');
    if(actions){
      const share=document.createElement('button');share.type='button';share.className='v5-share-case';share.textContent='Share case study ↗';
      share.addEventListener('click',async()=>{
        try{
          if(navigator.share)await navigator.share({title, url:location.href});
          else if(navigator.clipboard){await navigator.clipboard.writeText(location.href);share.textContent='Link copied ✓';setTimeout(()=>share.textContent='Share case study ↗',2600);}
          else prompt('Copy this project link:',location.href);
        }catch(error){if(error.name!=='AbortError')prompt('Copy this project link:',location.href);}
      });
      actions.append(share);
    }
    const categories=Array.isArray(details.service_categories)?details.service_categories:[];
    const first=categories[0]||'';
    const briefLink='/start-project/'+(first?'?service='+encodeURIComponent(first):'');
    const bottom=$('.case-bottom-cta .button');
    if(bottom){bottom.href=briefLink;bottom.textContent='Discuss a similar project ↗';}
    const related=$('#caseRelated');
    if(related && data?.portfolio?.length){
      const candidates=data.portfolio.filter(item=>item.id!==project.id);
      candidates.sort((a,b)=>{
        const count=x=>(Array.isArray(x?.details?.service_categories)?x.details.service_categories:[]).filter(n=>categories.includes(n)).length;
        return count(b)-count(a);
      });
      const choice=candidates.slice(0,3);
      if(choice.length)related.innerHTML=choice.map(item=>{
        const link='/portfolio/project/?slug='+encodeURIComponent(item.slug||'');
        const src=safe(item.cover_image);
        return '<a class="case-related-card" href="'+esc(link)+'"><span class="case-related-visual">'+(src?'<img src="'+esc(src)+'" loading="lazy" alt="'+esc(item.title)+' preview">':'<strong>'+esc((item.title||'M')[0])+'</strong>')+'</span><small>'+esc(item.category||'Selected project')+'</small><h3>'+esc(item.title)+' <span aria-hidden="true">↗</span></h3><p>'+esc(item.excerpt||'')+'</p></a>';
      }).join('');
    }
  }
  window.addEventListener('mubest:case-ready',event=>enhance(event.detail));
})();
