MUBEST DIGITAL — SOCIAL ICONS & VISUAL BUILDER v7
===================================================

WHAT YOU GET
• Footer social links show recognizable logos, NOT text names.
• Existing Instagram / LinkedIn / Facebook / TikTok URLs remain intact.
• New Contact & social URL fields: YouTube, X (Twitter), Pinterest.
• Existing WhatsApp setting is used for the WhatsApp logo.
• Visual Builder: draggable Social icons block. Edit each URL in Element Settings.
• No fake social links: blank URLs hide their logos.
• Icon-only links have accessible names and open in a new tab.
• No database migration or new environment variables.

UPLOAD INSTRUCTIONS (VERY IMPORTANT)
Extract this ZIP. Upload the entire inner "mubest-digital-site" folder structure
from the GitHub REPOSITORY ROOT, or open the existing nested folder and upload
its CONTENTS into their exact subfolders. Do not create double nesting.

Correct repo: https://github.com/mubest001/mubest-digital-site
Deployed Vercel Root Directory: mubest-digital-site

CHANGED FILES:
  mubest-digital-site/assets/cms-public.js
  mubest-digital-site/assets/cms-admin.js
  mubest-digital-site/assets/visual-editor.js
  mubest-digital-site/assets/visual-editor-bridge.js
  mubest-digital-site/assets/visual-layout-runtime.js
  mubest-digital-site/admin/visual-editor.html
  mubest-digital-site/api/admin.js
  mubest-digital-site/lib/defaults.js
NEW FILES:
  mubest-digital-site/assets/social-icons.css
  mubest-digital-site/assets/social-icons/*.svg (eight icons)

After all files are committed and Vercel shows READY:
1. Hard refresh admin /admin/ and builder /admin/visual-editor/.
2. Content Studio > Contact & social: set full HTTPS profile URLs and Save.
3. Open website footer. See clickable social logos, no visible platform names.
4. Visual Builder > Component Library > Social icons > add to page.
5. Select social block and edit URLs in Element Settings.
6. Save Draft or Publish (only Publish updates visitors).

NOTE: These are public links. Do not enter private social account passwords.
IMPORTANT: All original files were SHA-matched with the live GitHub main branch
before changes. No Vercel settings, analytics, or Google Search Console edits.
