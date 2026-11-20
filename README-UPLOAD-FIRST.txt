MUBEST DIGITAL — CONTENT STUDIO 3.0
Portfolio Case Studies + Visual Section Builder + Two-Colour 3-Video Hero

THIS ONE PACKAGE REPLACES THE PREVIOUS THREE-VIDEO HERO ZIP.
Do not upload the earlier hero/colour package as well.

GITHUB REPOSITORY
https://github.com/mubest001/mubest-digital-site

VERCEL ROOT DIRECTORY
mubest-digital-site

HOW TO UPLOAD MANUALLY
1. Extract the ZIP.
2. In GitHub, OPEN the existing website folder:
   https://github.com/mubest001/mubest-digital-site/tree/main/mubest-digital-site
3. Click Add file > Upload files.
4. Upload the CONTENTS of this ZIP's mubest-digital-site folder, preserving the
   admin/, api/, assets/, lib/, database/, portfolio/ subfolders and names.
   Do not create another nested mubest-digital-site folder inside the website folder.
5. Commit to main; in Vercel check the latest Production deployment is Ready.
6. Hard-refresh the public website and admin dashboard (Ctrl+Shift+R).

WHAT IS INCLUDED
- Portfolio cards now open their own case-study pages:
  https://mubestdigital.vercel.app/portfolio/project/?slug=hobbry
  https://mubestdigital.vercel.app/portfolio/project/?slug=berrymae
  https://mubestdigital.vercel.app/portfolio/project/?slug=arteescorp
- Case studies can display description/overview, role, project type, year,
  duration, services used, skills, deliverables, challenge, goals, approach,
  solution, verified outcomes, client feedback and image gallery.
- External project link is OPTIONAL. If empty, no Visit Website button appears.
- All new fields appear in Admin > Portfolio > Add/Edit.
- New Admin > Visual layout builder: switch between Home/About/Services/Portfolio/
  Contact; drag sections to reorder, use Up/Down buttons, toggle visibility,
  change alignment, or add new text, image+text, reviews, FAQ, stats, CTA or
  gallery sections. Press Publish layout to save to Neon.
- Reviews and FAQ sections use *published* testimonials and FAQs already
  available in the dashboard. If none are published, those sections stay empty.
- 3 video hero with editable videos, three slide layouts, arrows, swipes and
  dot indicators, preserving the two-colour blue/lime brand.

DATABASE MIGRATION
The new portfolio details are in a JSONB column. It is created automatically
on the first API request after deployment (see lib/db.js). Existing portfolio,
reviews, pages, admin login and saved content stay intact. No need to reset Neon.

EDIT WITHOUT REDEPLOYING
After the one-time deployment, edit project details and layouts from the admin:
- Portfolio > Edit project > fill case-study fields > Publish.
- Visual layout builder > choose page > rearrange and add > Publish layout.
- Testimonials > Publish genuine reviews before adding a Reviews section.
- Media library > upload images, then paste their URLs into case studies/sections.
- Pages > Home > edit hero slides 2 and 3.

LIMITS / IMPORTANT NOTES
The layout editor is a SECTION-LEVEL visual builder with layout presets, not an
unrestricted pixel-by-pixel designer for every element. It lets you rearrange
whole page sections and choose content/image placement without writing code.
The header and footer stay fixed in their normal page structure for safety.
Only publish real client outcomes and reviews with appropriate permission.
Existing project entries will show current summary data until you complete
any new details in the dashboard; no invented metrics are inserted.

QA STATUS
JavaScript syntax validation and CSS parsing passed locally. A full visual
browser preview and end-to-end testing against live Vercel/Neon could not be
completed from this environment. Test the deployment and save/publish flows.

If login still displays "Request origin is not allowed", compare your Vercel
SITE_URL with the exact domain opened in the browser, then redeploy after updating.
