#!/usr/bin/env python3
"""Apply portfolio appearance controls to the existing Mubest Digital source root.
Usage: python apply_mubest_portfolio_motion.py /path/to/mubest-digital-site
"""
from pathlib import Path
import sys

BASE = Path(__file__).resolve().parent
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()


def replace(path, needle, replacement):
    file = ROOT / path
    text = file.read_text(encoding='utf-8')
    if replacement in text:
        print(f'Already applied: {path}')
        return
    if needle not in text:
        raise RuntimeError(f'Cannot safely patch {path}: expected source anchor not found: {needle[:110]}')
    file.write_text(text.replace(needle, replacement, 1), encoding='utf-8')
    print(f'Updated {path}')


def append(path, block, marker):
    file = ROOT / path
    text = file.read_text(encoding='utf-8')
    if marker not in text:
        file.write_text(text.rstrip() + '\n\n' + block.strip() + '\n', encoding='utf-8')
        print(f'Updated {path}')
    else:
        print(f'Already applied: {path}')


def main():
    if not (ROOT / 'assets/cms-public.js').exists() or not (ROOT / 'api/admin.js').exists():
        raise SystemExit('Please pass the mubest-digital-site source directory, not the outer GitHub repo root.')

    replace('lib/defaults.js', '  layout_sections: {},', '''  layout_sections: {},
  portfolio_columns_desktop: "3",
  portfolio_home_columns: "3",
  portfolio_columns_tablet: "2",
  portfolio_columns_mobile: "1",
  portfolio_gap: "18",
  portfolio_hover_animation: "Lift",
  portfolio_scroll_animation: "Fade up",
  portfolio_motion_speed: "Balanced",''')

    replace('api/admin.js', '"footer_tagline","footer_note","footer_cta_label","layout_sections"', '''"footer_tagline","footer_note","footer_cta_label","layout_sections",
    "portfolio_columns_desktop","portfolio_home_columns","portfolio_columns_tablet","portfolio_columns_mobile",
    "portfolio_gap","portfolio_hover_animation","portfolio_scroll_animation","portfolio_motion_speed"''')

    replace('admin/index.html', '<button data-view="portfolio"><svg><use href="#i-briefcase"/></svg> Portfolio</button>',
        '<button data-view="portfolio"><svg><use href="#i-briefcase"/></svg> Portfolio</button><button data-view="portfoliodesign"><svg><use href="#i-palette"/></svg> Portfolio appearance</button>')

    replace('assets/cms-admin.js', "layout:'Visual layout builder'", "layout:'Visual layout builder',portfoliodesign:'Portfolio appearance'")
    replace('assets/cms-admin.js', "'contactsettings','layout'];", "'contactsettings','layout','portfoliodesign'];")

    groups = '''  const settingGroups={
    portfoliodesign:{intro:'Control your portfolio layout and choose a modern motion style. Preview each hover effect before publishing.',groups:[
      {title:'Portfolio grid layout',description:'Choose the number of projects in each row. Desktop defaults to three, tablet to two, and mobile to one.',fields:[
        ['portfolio_columns_desktop','Projects per row · desktop','select',['1','2','3','4','5']],
        ['portfolio_home_columns','Homepage featured projects per row','select',['1','2','3','4']],
        ['portfolio_columns_tablet','Projects per row · tablet','select',['1','2','3']],
        ['portfolio_columns_mobile','Projects per row · mobile','select',['1','2']],
        ['portfolio_gap','Space between cards (px)','select',['12','18','24','30']]
      ]},
      {title:'Hover animation library',description:'Move your cursor over the preview cards to try a motion style. Works on keyboard focus too.',fields:[
        ['portfolio_hover_animation','Hover style','select',['Lift','Zoom','Tilt','Glow','Sheen','Reveal','Spotlight','Parallax','Border','Float','None']],
        ['portfolio_motion_speed','Animation speed','select',['Fast','Balanced','Slow']]
      ]},
      {title:'Scroll entrance effect',description:'A subtle entrance animation when projects appear. Reduced-motion visitors see a static layout.',fields:[
        ['portfolio_scroll_animation','Entrance style','select',['Fade up','Scale in','Stagger','None']]
      ]}
    ]},
'''
    replace('assets/cms-admin.js', '  const settingGroups={\n', groups)

    replace('assets/cms-admin.js', '  function renderSettings(panel,settings,view){\n    const config=', '''  function renderSettings(panel,settings,view){
    settings={portfolio_columns_desktop:'3',portfolio_home_columns:'3',portfolio_columns_tablet:'2',portfolio_columns_mobile:'1',portfolio_gap:'18',portfolio_hover_animation:'Lift',portfolio_scroll_animation:'Fade up',portfolio_motion_speed:'Balanced',...settings};
    const config=''')

    preview = '''    if(view==='portfoliodesign'){
      const first=panel.querySelector('.settings-section');
      first?.insertAdjacentHTML('beforebegin',
        '<section class="md-motion-preview"><div class="md-preview-head"><div><span class="md-preview-eyebrow">INTERACTIVE PREVIEW</span><h3>See the motion before you publish.</h3><p>Hover or focus a card; changing the selector updates this preview instantly.</p></div><a href="/portfolio/" target="_blank" rel="noopener noreferrer">View live portfolio ↗</a></div><div class="md-preview-grid" id="mdMotionPreview">'+
        ['Shopify Storefront','Email Design','Product Customizer','Brand Experience','Digital Campaign'].map((name,i)=>'<div class="md-preview-card" tabindex="0"><div class="md-preview-art md-art-'+(i+1)+'"><span>0'+(i+1)+'</span></div><strong>'+name+'</strong><small>View project ↗</small></div>').join('')+
        '</div></section>');
      const preview=panel.querySelector('#mdMotionPreview');
      const sync=()=>{
        if(!preview)return;
        preview.dataset.hover=String(panel.querySelector('[name="portfolio_hover_animation"]')?.value||'Lift').toLowerCase();
        preview.style.setProperty('--preview-cols',String(Math.max(1,Math.min(5,Number(panel.querySelector('[name="portfolio_columns_desktop"]')?.value)||3))));
        const speed=String(panel.querySelector('[name="portfolio_motion_speed"]')?.value||'Balanced');
        preview.style.setProperty('--preview-time',speed==='Fast'?'220ms':speed==='Slow'?'700ms':'420ms');
      };
      panel.querySelectorAll('select').forEach(el=>el.addEventListener('change',sync));
      sync();
    }
    $$('[data-settings-group]',panel).forEach(form=>{'''
    replace('assets/cms-admin.js', "    $$('[data-settings-group]',panel).forEach(form=>{", preview)

    replace('assets/cms-public.js',
        '    const css=document.createElement("link");css.rel="stylesheet";css.href="/assets/cms-public.css";document.head.appendChild(css);',
        '    const css=document.createElement("link");css.rel="stylesheet";css.href="/assets/cms-public.css";document.head.appendChild(css);\n    const motionCss=document.createElement("link");motionCss.rel="stylesheet";motionCss.href="/assets/portfolio-motion.css?v=1";document.head.appendChild(motionCss);')
    replace('assets/cms-public.js',
        '    renderPortfolio(data.portfolio,document.querySelector(".portfolio-grid"));',
        '    renderPortfolio(data.portfolio,document.querySelector(".portfolio-grid"));\n    try { const motion = await import("/assets/portfolio-motion.js?v=1"); motion.applyPortfolioMotion(settings); }\n    catch(error) { console.warn("Portfolio motion could not load:",error); }')

    css = r'''
/* Portfolio appearance admin preview */
.md-motion-preview{margin:18px 0 24px;padding:23px;background:linear-gradient(135deg,#111a36,#1a2552 65%,#243889);border-radius:18px;color:#fff}
.md-preview-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:19px}
.md-preview-eyebrow{font-size:10px;letter-spacing:.18em;font-weight:800;color:#b9e769}
.md-preview-head h3{margin:7px 0 5px;font-size:1.3rem;color:#fff}
.md-preview-head p{margin:0;color:#c1c9e2;font-size:13px}
.md-preview-head a{font-size:12px;color:#dce7ff;text-decoration:underline}
.md-preview-grid{display:grid;grid-template-columns:repeat(var(--preview-cols,3),minmax(0,1fr));gap:12px;perspective:1000px}
.md-preview-card{background:#fff;border-radius:12px;padding:8px;color:#1f2438;min-width:0;cursor:pointer;outline-offset:3px;transition:transform var(--preview-time,420ms) cubic-bezier(.22,1,.36,1),box-shadow var(--preview-time,420ms) ease}
.md-preview-art{height:90px;display:grid;place-items:center;border-radius:8px;color:#fff;font-weight:900;font-size:1.6rem;background:linear-gradient(135deg,#4268e9,#8a6ee7)}
.md-art-2{background:linear-gradient(135deg,#0e6f61,#44b39c)}.md-art-3{background:linear-gradient(135deg,#1d3d93,#f5b957)}.md-art-4{background:linear-gradient(135deg,#ea718a,#8440a8)}.md-art-5{background:linear-gradient(135deg,#396977,#b9e769)}
.md-preview-card strong{display:block;font-size:11px;margin:10px 2px 3px;line-height:1.35}
.md-preview-card small{display:block;margin:0 2px 6px;color:#68708b;font-size:10px}
.md-preview-grid[data-hover="lift"] .md-preview-card:is(:hover,:focus){transform:translateY(-10px);box-shadow:0 20px 32px #0006}
.md-preview-grid[data-hover="zoom"] .md-preview-card:is(:hover,:focus){transform:scale(1.055);box-shadow:0 15px 28px #0007}
.md-preview-grid[data-hover="tilt"] .md-preview-card:is(:hover,:focus){transform:rotateY(-7deg) rotateX(4deg) translateY(-5px);box-shadow:14px 18px 26px #0007}
.md-preview-grid[data-hover="glow"] .md-preview-card:is(:hover,:focus){transform:translateY(-5px);box-shadow:0 0 0 2px #b9e769,0 0 35px #b9e76990}
.md-preview-grid[data-hover="sheen"] .md-preview-card:is(:hover,:focus){transform:translateY(-3px);filter:brightness(1.17)}
.md-preview-grid[data-hover="reveal"] .md-preview-card:is(:hover,:focus){transform:translateY(-4px);box-shadow:inset 0 -30px 30px #4563f555}
.md-preview-grid[data-hover="spotlight"] .md-preview-card:is(:hover,:focus){box-shadow:0 0 34px #b9e769bb}
.md-preview-grid[data-hover="parallax"] .md-preview-card:is(:hover,:focus){transform:translate(-5px,-6px) scale(1.04);box-shadow:8px 13px 28px #0007}
.md-preview-grid[data-hover="border"] .md-preview-card:is(:hover,:focus){box-shadow:inset 0 0 0 3px #b9e769;transform:translateY(-3px)}
.md-preview-grid[data-hover="float"] .md-preview-card:is(:hover,:focus){animation:md-preview-float 1.6s ease-in-out infinite}
@keyframes md-preview-float{50%{transform:translateY(-11px)}}
@media(max-width:780px){.md-preview-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:500px){.md-preview-grid{grid-template-columns:1fr}}
@media(prefers-reduced-motion:reduce){.md-preview-card{animation:none!important;transition:none!important;transform:none!important}}
'''
    append('assets/cms-admin.css', css, '/* Portfolio appearance admin preview */')

    for filename in ('portfolio-motion.js', 'portfolio-motion.css'):
        target = ROOT / 'assets' / filename
        target.write_bytes((BASE / 'assets' / filename).read_bytes())
        print(f'Installed assets/{filename}')

    print('\nCompleted. Review changes with git diff, then commit and push to main to deploy through Vercel.')


if __name__ == '__main__':
    main()
