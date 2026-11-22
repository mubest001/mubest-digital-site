(() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const safeUrl = value => {
    const v = String(value || "").trim();
    if (/^\/(?!\/)/.test(v) || /^https?:\/\//i.test(v)) return v;
    return "";
  };
  const setText = (selector, value, root = document) => {
    if (value === undefined || value === null) return;
    const el = root.querySelector(selector);
    if (el) el.textContent = value;
  };
  const setLink = (el, label, href) => {
    if (!el) return;
    if (label) {
      const span = el.querySelector("span");
      if (span) {
        el.childNodes.forEach(n => { if (n.nodeType === Node.TEXT_NODE) n.textContent = ""; });
        el.insertBefore(document.createTextNode(label + " "), span);
      } else el.textContent = label;
    }
    if (href) el.href = safeUrl(href) || el.href;
  };
  const iconSvg = name => {
    const icons = {
      website:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4M3 8h18"/>',
      email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
      video:'<rect x="3" y="5" width="13" height="14" rx="2"/><path d="m16 10 5-3v10l-5-3z"/>',
      ecommerce:'<path d="M4 8h16l-1 12H5L4 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
      book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 5.5V22M8 7h8M8 11h8"/>',
      ads:'<path d="M4 19V5M4 19h17"/><path d="m7 15 4-4 3 2 6-7"/><path d="M16 6h4v4"/>'
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.website}</svg>`;
  };

  function renderPortfolio(items, container) {
    if (!container || !Array.isArray(items)) return;
    const list = container.classList.contains("portfolio-grid")
      ? items
      : items.filter(item => item.featured).slice(0,3).length
        ? items.filter(item => item.featured).slice(0,3)
        : items.slice(0,3);
    if (!list.length) { container.innerHTML=""; return; }

    // Preserve the current designed previews for the three seeded projects
    // until actual screenshots are uploaded through the dashboard.
    const oldCards = Array.from(container.querySelectorAll(".work-card"));
    const oldByTitle = new Map(oldCards.map(card => [
      (card.querySelector(".work-info h3")?.textContent || "").trim().toLowerCase(), card
    ]));

    container.innerHTML = list.map(item => {
      const detailUrl = "/portfolio/project/?slug=" + encodeURIComponent(String(item.slug||""));
      const existing = oldByTitle.get(String(item.title || "").trim().toLowerCase());

      if (!safeUrl(item.cover_image) && existing) {
        const clone = existing.cloneNode(true);
        const category = clone.querySelector(".work-info small");
        const title = clone.querySelector(".work-info h3");
        const excerpt = clone.querySelector(".work-info p");
        if (category) category.textContent = item.category || "Selected project";
        if (title) title.textContent = item.title || "";
        if (excerpt) excerpt.textContent = item.excerpt || item.description || "";
        clone.querySelectorAll("a").forEach(a => {
          a.href = detailUrl;
          a.removeAttribute("target");
          a.removeAttribute("rel");
          a.setAttribute("aria-label",`Read ${item.title || "project"} case study`);
        });
        return clone.outerHTML;
      }

      const visual = safeUrl(item.cover_image)
        ? `<img src="${esc(safeUrl(item.cover_image))}" alt="${esc(item.title)} project preview" loading="lazy">`
        : `<div class="cms-project-placeholder"><span>${esc((item.title || "M").split(/\s+/).map(x=>x[0]).join("").slice(0,3).toUpperCase())}</span></div>`;
      return `<article class="work-card reveal cms-work-card"><a href="${esc(detailUrl)}" aria-label="Read ${esc(item.title)} case study"><div class="work-visual cms-work-visual">${visual}</div></a><div class="work-info"><div><small>${esc(item.category || "Selected project")}</small><h3><a href="${esc(detailUrl)}">${esc(item.title)}</a></h3><p>${esc(item.excerpt || item.description || "")}</p></div><a class="work-link" href="${esc(detailUrl)}" aria-label="Read ${esc(item.title)} case study">↗</a></div></article>`;
    }).join("");
    container.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible"));
  }

  function renderServices(items, container, detailed = false) {
    if (!container || !Array.isArray(items)) return;
    if (!items.length) { container.innerHTML=""; return; }
    container.innerHTML = items.map((item,index) => detailed
      ? `<article class="service-detail reveal" id="${esc(item.slug)}"><span class="service-icon">${iconSvg(item.icon)}</span><div><h2>${esc(item.title)}</h2><p>${esc(item.description || item.summary || "")}</p>${item.tag ? `<span class="service-tag">${esc(item.tag)}</span>` : ""}</div><ul>${(item.deliverables || []).map(d=>`<li>${esc(d)}</li>`).join("")}</ul></article>`
      : `<a class="service-card reveal" href="/services/#${esc(item.slug)}"><div class="service-top"><span class="service-icon">${iconSvg(item.icon)}</span><span class="service-number">${String(index+1).padStart(2,"0")} / ${String(items.length).padStart(2,"0")}</span></div><h3>${esc(item.title)}</h3><p>${esc(item.summary || item.description || "")}</p><span class="card-arrow">↗</span></a>`
    ).join("");
    container.querySelectorAll(".reveal").forEach(el => el.classList.add("is-visible"));
  }

  function renderTestimonials(items) {
    if (!Array.isArray(items) || !items.length || document.querySelector(".cms-testimonials")) return;
    const cta = document.querySelector(".cta-section");
    if (!cta) return;
    const section = document.createElement("section");
    section.className = "cms-testimonials";
    section.innerHTML = `<div class="container"><div class="section-head"><div><span class="eyebrow">Client feedback</span><h2>Good work is better when it makes a difference.</h2></div></div><div class="cms-testimonial-grid">${items.map(item=>`<article class="cms-testimonial"><div aria-label="${Math.min(5,Math.max(1,Number(item.rating)||5))} out of 5 stars">${"★".repeat(Math.min(5,Math.max(1,Number(item.rating)||5)))}</div><blockquote>“${esc(item.quote)}”</blockquote><strong>${esc(item.name)}</strong><small>${esc([item.role,item.company].filter(Boolean).join(" · "))}</small></article>`).join("")}</div></div>`;
    cta.parentNode.insertBefore(section,cta);
  }

  function renderFaqs(items) {
    const list = document.querySelector(".faq-list");
    if (!list || !Array.isArray(items)) return;
    if (!items.length) {list.innerHTML="";return;}
    list.innerHTML = items.map(item=>`<div class="faq-item"><button class="faq-question" data-faq-question aria-expanded="false"><span>${esc(item.question)}</span><span>+</span></button><div class="faq-answer"><p>${esc(item.answer)}</p></div></div>`).join("");
    list.querySelectorAll("[data-faq-question]").forEach(button=>{
      button.addEventListener("click",()=>{
        const item=button.closest(".faq-item");
        const answer=item.querySelector(".faq-answer");
        const open=item.classList.toggle("open");
        button.setAttribute("aria-expanded",String(open));
        answer.style.maxHeight=open?`${answer.scrollHeight}px`:"0px";
      });
    });
  }

  function applyPage(pageKey, data) {
    const p = data || {};
    if (pageKey === "home") {
      const kicker = document.querySelector(".hero-kicker");
      if (kicker && p.hero_kicker) { const dot=kicker.querySelector(".pulse-dot"); kicker.textContent=p.hero_kicker; if(dot) kicker.prepend(dot); }
      setText(".hero h1",p.hero_title);
      setText(".hero-copy",p.hero_description);
      const heroLinks=document.querySelectorAll(".hero-actions a");
      if(heroLinks[0]) setLink(heroLinks[0],p.hero_primary_label,p.hero_primary_url);
      if(heroLinks[1]) setLink(heroLinks[1],p.hero_secondary_label,p.hero_secondary_url);
      setText(".intro-section .eyebrow",p.intro_eyebrow);
      setText(".intro-title",p.intro_heading);
      const introPs=document.querySelectorAll(".intro-copy p");
      if(introPs[0] && p.intro_copy_1) introPs[0].textContent=p.intro_copy_1;
      if(introPs[1] && p.intro_copy_2) introPs[1].textContent=p.intro_copy_2;
      setText(".services-section .section-head .eyebrow",p.services_eyebrow);
      setText(".services-section .section-head h2",p.services_heading);
      setText(".services-section .section-head p",p.services_description);
      setText(".work-section .section-head .eyebrow",p.portfolio_eyebrow);
      setText(".work-section .section-head h2",p.portfolio_heading);
      setText(".work-section .section-head p",p.portfolio_description);
      setText(".process-section .section-head .eyebrow",p.process_eyebrow);
      setText(".process-section .section-head h2",p.process_heading);
      setText(".process-section .section-head p",p.process_description);
      setText(".about-strip .eyebrow",p.about_eyebrow);
      setText(".about-copy h2",p.about_heading);
      setText(".about-copy p",p.about_description);
      setText(".cta-panel .eyebrow",p.cta_eyebrow);
      setText(".cta-panel h2",p.cta_heading);
      const cta=document.querySelector(".cta-panel .button");
      if(cta && p.cta_button) setLink(cta,p.cta_button);
    } else if (pageKey === "about") {
      setText(".page-hero .eyebrow",p.hero_eyebrow);
      setText(".page-hero h1",p.hero_title);
      setText(".page-hero p",p.hero_description);
      setText(".intro-grid .eyebrow",p.intro_eyebrow);
      setText(".intro-title",p.intro_heading);
      const ps=document.querySelectorAll(".intro-copy p");
      ["intro_copy_1","intro_copy_2","intro_copy_3"].forEach((key,i)=>{if(ps[i]&&p[key])ps[i].textContent=p[key];});
      setText(".section-head .eyebrow",p.values_eyebrow);
      setText(".section-head h2",p.values_heading);
      setText(".section-head p",p.values_description);
    } else {
      setText(".page-hero .eyebrow",p.hero_eyebrow);
      setText(".page-hero h1",p.hero_title);
      setText(".page-hero p",p.hero_description);
      setText(".section-head .eyebrow",p.section_eyebrow);
      setText(".section-head h2",p.section_heading);
      setText(".section-head p",p.section_description);
    }
  }

  async function init() {
    const css=document.createElement("link");css.rel="stylesheet";css.href="/assets/cms-public.css";document.head.appendChild(css);
    const motionCss=document.createElement("link");motionCss.rel="stylesheet";motionCss.href="/assets/portfolio-motion.css?v=3";document.head.appendChild(motionCss);
    const categoriesCss=document.createElement("link");categoriesCss.rel="stylesheet";categoriesCss.href="/assets/portfolio-categories.css?v=1";document.head.appendChild(categoriesCss);
    const data=await (window.MubestPublicContentPromise ||= fetch("/api/public-content",{cache:"no-store"}).then(async response=>response.ok?response.json():null));
    if(!data) return;
    const settings=data.settings||{};
    const pageKey=document.body.dataset.page||"home";
    const page=(data.pages||{})[pageKey]||{};

    document.querySelectorAll(".brand-logo").forEach(img=>{
      if(settings.logo_url) img.src=safeUrl(settings.logo_url)||img.src;
      img.alt=settings.site_name||"Mubest Digital";
    });
    const favicon=document.querySelector('link[rel~="icon"]');
    if(favicon&&settings.favicon_url) favicon.href=safeUrl(settings.favicon_url)||favicon.href;
    const colors={ink:settings.color_ink,blue:settings.color_blue,lime:settings.color_lime,paper:settings.color_paper};
    Object.entries(colors).forEach(([key,value])=>{if(value)document.documentElement.style.setProperty(`--${key}`,value);});
    if(settings.font_heading) document.documentElement.style.setProperty("--cms-heading-font",`"${settings.font_heading}",sans-serif`);
    if(settings.font_body) document.documentElement.style.setProperty("--cms-body-font",`"${settings.font_body}",sans-serif`);
    if(settings.seo_title) document.title=pageKey==="home"?settings.seo_title:`${document.title.split("|")[0].trim()} | ${settings.site_name||"Mubest Digital"}`;
    const description=document.querySelector('meta[name="description"]');
    if(description&&settings.seo_description) description.content=settings.seo_description;

    applyPage(pageKey,page);

    const homeServices=document.querySelector(".services-grid");
    renderServices(data.services,homeServices,false);
    const serviceDetails=document.querySelector(".service-list");
    renderServices(data.services,serviceDetails,true);

    renderPortfolio(data.portfolio,document.querySelector(".work-grid"));
    renderPortfolio(data.portfolio,document.querySelector(".portfolio-grid"));
    try { const motion = await import("/assets/portfolio-motion.js?v=3"); motion.applyPortfolioMotion(settings); }
    catch(error) { console.warn("Portfolio motion could not load:",error); }
    try { const categories = await import("/assets/portfolio-categories.js?v=2"); categories.initPortfolioCategories(data.portfolio,settings); }
    catch(error) { console.warn("Portfolio categories could not load:",error); }

    const aboutImage=settings.about_image_url||page.about_image_url||"";
    if(aboutImage) {
      const aboutPage=document.querySelector('body[data-page="about"] .intro-grid > div:first-child');
      if(aboutPage&&!aboutPage.querySelector(".cms-about-photo")) {
        const figure=document.createElement("figure");figure.className="cms-about-photo";
        figure.innerHTML=`<img src="${esc(safeUrl(aboutImage))}" alt="${esc(settings.site_name||"Mubest Digital")} profile photograph" loading="lazy">`;
        aboutPage.appendChild(figure);
      }
      const homeMark=document.querySelector(".about-mark");
      if(homeMark) {homeMark.classList.add("cms-about-mark");homeMark.innerHTML=`<img src="${esc(safeUrl(aboutImage))}" alt="Mubest" loading="lazy">`;}
    }

    if (settings.show_home_testimonials !== false) renderTestimonials(data.testimonials);
    renderFaqs(data.faqs);


    const contactPoints = document.querySelector(".contact-points");
    if (contactPoints) {
      const extras = [
        settings.contact_email ? `<a class="contact-point cms-contact-detail" href="mailto:${esc(settings.contact_email)}"><span>✉</span>${esc(settings.contact_email)}</a>` : "",
        settings.phone ? `<a class="contact-point cms-contact-detail" href="tel:${esc(settings.phone.replace(/[^+0-9]/g,""))}"><span>☎</span>${esc(settings.phone)}</a>` : "",
        settings.whatsapp ? `<a class="contact-point cms-contact-detail" href="${esc(safeUrl(settings.whatsapp) || ("https://wa.me/" + settings.whatsapp.replace(/[^0-9]/g,"")))}" target="_blank" rel="noopener noreferrer"><span>↗</span>WhatsApp</a>` : ""
      ].filter(Boolean);
      extras.forEach(markup => contactPoints.insertAdjacentHTML("beforeend", markup));
    }

    // Additional live design/content controls from Content Studio 2.0.
    // Defaults retain the current public website until the admin changes them.
    if (page.seo_title) document.title=String(page.seo_title).slice(0,180);
    if (page.seo_description) {
      const meta=document.querySelector('meta[name="description"]');
      if (meta) meta.content=String(page.seo_description).slice(0,300);
    }
    const updateMeta=(property,content)=>{
      if(!content)return;
      let el=document.querySelector(`meta[property="${property}"]`);
      if(!el){el=document.createElement("meta");el.setAttribute("property",property);document.head.appendChild(el);}
      el.content=String(content);
    };
    updateMeta("og:title",page.seo_title||settings.seo_title);
    updateMeta("og:description",page.seo_description||settings.seo_description);
    if(safeUrl(settings.seo_image_url))updateMeta("og:image",safeUrl(settings.seo_image_url));

    // Add fonts only from the approved list of supported families.
    const fontNames=[settings.font_heading,settings.font_body].filter(x=>["Inter","Manrope","DM Sans","Montserrat","Poppins"].includes(x));
    if(fontNames.some(x=>!['Inter','Manrope'].includes(x))){
      const href="https://fonts.googleapis.com/css2?"+[...new Set(fontNames)].map(name=>"family="+encodeURIComponent(name).replace(/%20/g,"+")+":wght@400;500;600;700;800").join("&")+"&display=swap";
      const link=document.createElement("link");link.rel="stylesheet";link.href=href;document.head.appendChild(link);
    }

    const navLinks={"/":settings.nav_home_label,"/about/":settings.nav_about_label,"/services/":settings.nav_services_label,"/portfolio/":settings.nav_portfolio_label,"/contact/":settings.nav_contact_label};
    document.querySelectorAll(".site-header .nav a").forEach(a=>{
      const label=navLinks[a.getAttribute("href")];if(label)a.textContent=String(label);
    });
    setLink(document.querySelector(".site-header .header-cta"),settings.header_cta_label,settings.header_cta_url);

    const announcementText=String(settings.announcement_text||"").trim();
    if(settings.announcement_enabled===true && announcementText){
      const announcement=document.createElement("div");announcement.className="cms-announcement";
      const span=document.createElement("span");span.textContent=announcementText;announcement.appendChild(span);
      if(safeUrl(settings.announcement_url) && settings.announcement_link_label){
        const a=document.createElement("a");a.href=safeUrl(settings.announcement_url);a.textContent=String(settings.announcement_link_label)+" ↗";
        if(/^https?:\/\//.test(a.href)){a.target="_blank";a.rel="noopener noreferrer";}
        announcement.appendChild(a);
      }
      document.body.classList.add("has-cms-announcement");
      document.body.prepend(announcement);
    }
    const video=document.querySelector(".hero-video");
    if(video){
      const customVideo=safeUrl(settings.hero_video_url);
      const customPoster=safeUrl(settings.hero_poster_url);
      if(customPoster)video.poster=customPoster;
      if(customVideo){let src=video.querySelector("source");if(!src){src=document.createElement("source");video.appendChild(src);}src.src=customVideo;src.type="video/mp4";video.load();}
      if(settings.hero_video_enabled===false){video.pause();video.hidden=true;video.style.display="none";const hero=document.querySelector(".hero");if(hero&&customPoster)hero.style.backgroundImage=`linear-gradient(90deg,rgba(13,15,22,.88),rgba(13,15,22,.52)),url("${customPoster.replace(/["'\\()]/g,'')}")`;hero.style.backgroundSize="cover";hero.style.backgroundPosition="center";}
      else if(customVideo&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !(navigator.connection&&navigator.connection.saveData)){video.play().catch(()=>{});}
    }
    if(settings.availability_enabled===true){
      const heroContent=document.querySelector(".hero-content");
      if(heroContent){const pill=document.createElement("div");pill.className="cms-availability";pill.textContent=String(settings.availability_text||"Available for select new projects");heroContent.appendChild(pill);}
    }
    if(pageKey==="home"){
      const sectionSwitches=[
        ["show_home_services",".services-section"],
        ["show_home_work",".work-section"],
        ["show_home_process",".process-section"],
        ["show_home_about",".about-strip"],
        ["show_home_faq",".faq-list"],
        ["show_home_cta",".cta-section"],
        ["show_home_testimonials",".cms-testimonials"]
      ];
      sectionSwitches.forEach(([key,selector])=>{
        if(settings[key]!==false)return;
        let el=document.querySelector(selector);
        if(el&&[".about-strip",".faq-list"].includes(selector))el=el.closest("section");
        if(el)el.style.display="none";
      });
    }
    // Section layouts are optional; keep the original page when no layout was published.
    if(settings.layout_sections && Array.isArray(settings.layout_sections[pageKey])) {
      const style = document.createElement("link");
      style.rel="stylesheet";
      style.href="/assets/section-layout.css";
      document.head.appendChild(style);
      try {
        const layoutModule = await import("/assets/section-layout.js");
        layoutModule.applyLayout(settings.layout_sections,pageKey,data);
      } catch(error) { console.warn("Section layout could not be applied:",error); }
    }
    setText(".site-footer .footer-brand p",settings.footer_tagline);
    setText(".site-footer .footer-bottom > span:last-child",settings.footer_note);
    setLink(document.querySelector(".site-footer .footer-col:last-child a:first-of-type"),settings.footer_cta_label);

    // Social links use platform logo SVG assets, with accessible names for screen readers.
    // Hide platforms without valid URLs; existing four stored social links are preserved.
    const socialStyles=document.querySelector('link[data-mubest-social]');
    if(!socialStyles){const link=document.createElement('link');link.rel='stylesheet';link.href='/assets/social-icons.css?v=7';link.dataset.mubestSocial='1';document.head.appendChild(link);}
    const platforms=[
      ['instagram','Instagram',settings.social_instagram],
      ['linkedin','LinkedIn',settings.social_linkedin],
      ['facebook','Facebook',settings.social_facebook],
      ['tiktok','TikTok',settings.social_tiktok],
      ['youtube','YouTube',settings.social_youtube],
      ['x','X',settings.social_x],
      ['pinterest','Pinterest',settings.social_pinterest],
      ['whatsapp','WhatsApp',settings.whatsapp]
    ];
    const social=platforms.map(([id,label,raw])=>{
      let url=safeUrl(raw);
      if(id==='whatsapp' && !url && raw){const digits=String(raw).replace(/[^0-9]/g,'');if(digits.length>=8 && digits.length<=15)url='https://wa.me/'+digits;}
      return {id,label,url};
    }).filter(x=>x.url && /^https?:\/\//i.test(x.url));
    const footer=document.querySelector('.site-footer .footer-top');
    if(footer){
      const col=footer.querySelector('.footer-col:last-child');
      if(col){
        let links=col.querySelector('.cms-social-links');
        if(!links){links=document.createElement('div');links.className='cms-social-links';links.setAttribute('aria-label','Follow Mubest Digital');col.appendChild(links);}
        links.innerHTML=social.map(({id,label,url})=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(label)}" title="${esc(label)}"><img src="/assets/social-icons/${id}.svg" alt="" width="19" height="19" loading="lazy"></a>`).join('');
        links.hidden=!social.length;
      }
    }
  }

  init().catch(error=>console.warn("Mubest CMS content could not be loaded:",error));
})();
