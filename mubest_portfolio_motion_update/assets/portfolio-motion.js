/** Mubest Digital: responsive portfolio configuration and modern motion presets. */
const allowed = (value, choices, fallback) => choices.includes(String(value)) ? String(value) : fallback;
const columns = (value, max, fallback) => String(Math.max(1, Math.min(max, Math.floor(Number(value) || fallback))));

export function applyPortfolioMotion(settings = {}) {
  // The old development-draft disclaimer must not appear on the finished portfolio.
  document.querySelectorAll('.portfolio-note').forEach(el => el.remove());
  const speed = allowed(settings.portfolio_motion_speed, ['Fast', 'Balanced', 'Slow'], 'Balanced');
  const hover = allowed(settings.portfolio_hover_animation,
    ['Lift', 'Zoom', 'Tilt', 'Glow', 'Sheen', 'Reveal', 'Spotlight', 'Parallax', 'Border', 'Float', 'None'], 'Lift');
  const entrance = allowed(settings.portfolio_scroll_animation,
    ['Fade up', 'Scale in', 'Stagger', 'None'], 'Fade up');
  const gap = allowed(String(settings.portfolio_gap || '18'), ['12', '18', '24', '30'], '18');

  document.querySelectorAll('.portfolio-grid, .work-grid').forEach(grid => {
    grid.classList.add('md-portfolio-motion');
    grid.dataset.mdHover = hover.toLowerCase();
    grid.dataset.mdEntrance = entrance.toLowerCase().replace(/\s/g, '-');
    grid.style.setProperty('--md-desktop-cols', columns(
      grid.classList.contains('work-grid') ? settings.portfolio_home_columns : settings.portfolio_columns_desktop, 5, 3));
    grid.style.setProperty('--md-tablet-cols', columns(settings.portfolio_columns_tablet, 3, 2));
    grid.style.setProperty('--md-mobile-cols', columns(settings.portfolio_columns_mobile, 2, 1));
    grid.style.setProperty('--md-gap', gap + 'px');
    grid.style.setProperty('--md-duration', speed === 'Fast' ? '240ms' : speed === 'Slow' ? '720ms' : '430ms');

    if (grid.dataset.mdPointerBound === '1') return;
    grid.dataset.mdPointerBound = '1';
    grid.addEventListener('pointermove', event => {
      if (!['spotlight', 'parallax'].includes(grid.dataset.mdHover) ||
          window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const card = event.target.closest('.work-card');
      if (!card || !grid.contains(card)) return;
      const r = card.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const x = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width));
      const y = Math.max(0, Math.min(1, (event.clientY - r.top) / r.height));
      card.style.setProperty('--md-x', (x * 100).toFixed(1) + '%');
      card.style.setProperty('--md-y', (y * 100).toFixed(1) + '%');
      card.style.setProperty('--md-shift-x', ((x - .5) * 12).toFixed(1) + 'px');
      card.style.setProperty('--md-shift-y', ((y - .5) * 12).toFixed(1) + 'px');
    }, { passive: true });
  });
}
