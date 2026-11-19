/* Mubest Digital — small, dependency-free interactions.
   Add your real enquiry email to CONTACT_EMAIL before launch. */
const CONTACT_EMAIL = '';

// Keep the site header fixed and strengthen its background after scrolling.
const siteHeader = document.querySelector('.site-header');
if (siteHeader) {
  const syncHeader = () => siteHeader.classList.toggle('is-scrolled', window.scrollY > 24);
  syncHeader();
  window.addEventListener('scroll', syncHeader, { passive: true });
}


const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-site-nav]');
if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    document.body.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    nav.classList.remove('open');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));
}

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach(item => observer.observe(item));
} else {
  revealItems.forEach(item => item.classList.add('is-visible'));
}

// Accessible FAQ accordion.
document.querySelectorAll('[data-faq-question]').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const answer = item?.querySelector('.faq-answer');
    const isOpen = item?.classList.toggle('open');
    button.setAttribute('aria-expanded', String(Boolean(isOpen)));
    if (answer) answer.style.maxHeight = isOpen ? `${answer.scrollHeight}px` : '0px';
  });
});

// The form opens a pre-filled email draft once CONTACT_EMAIL is configured.
const contactForm = document.querySelector('[data-contact-form]');
if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const status = contactForm.querySelector('[data-form-status]');
    if (!contactForm.reportValidity()) return;
    if (!CONTACT_EMAIL) {
      status.textContent = 'The form is ready. Add your preferred business email in assets/site.js to activate enquiry delivery.';
      status.classList.add('show');
      return;
    }
    const data = new FormData(contactForm);
    const subject = encodeURIComponent(`Project enquiry: ${data.get('service') || 'New project'}`);
    const body = encodeURIComponent(
      `Name: ${data.get('name')}\nEmail: ${data.get('email')}\nService: ${data.get('service')}\nBudget: ${data.get('budget') || 'Not specified'}\n\nProject details:\n${data.get('message')}`
    );
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    status.textContent = 'Your email app should open with the enquiry prepared. Review it and send when ready.';
    status.classList.add('show');
  });
}

// Respect reduced-motion and data-saving preferences for the hero video.
const heroVideo = document.querySelector('.hero-video');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = Boolean(navigator.connection && navigator.connection.saveData);
if (heroVideo && (reduceMotion || saveData)) {
  heroVideo.pause();
  heroVideo.removeAttribute('autoplay');
}

// Keep the year current without a server.
document.querySelectorAll('[data-current-year]').forEach(node => {
  node.textContent = new Date().getFullYear();
});
