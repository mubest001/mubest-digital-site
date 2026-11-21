MUBEST DIGITAL — PREMIUM VISUAL BUILDER V6

Change type: Frontend-only interface redesign for the visual builder.

This package contains:
  mubest-digital-site/admin/visual-editor.html  (REPLACE existing file)

HOW TO UPLOAD
1. Download and extract the ZIP.
2. In the GitHub repository mubest001/mubest-digital-site, navigate to:
   mubest-digital-site/admin/
3. REPLACE the existing visual-editor.html with the included visual-editor.html.
   Do not upload the outer mubest-digital-site folder *inside* the existing one.
4. Commit directly to main.
5. In Vercel, confirm the new production deployment is READY.
6. Hard refresh: https://mubestdigital.vercel.app/admin/visual-editor/

RETAINED BACKEND/FUNCTIONS
- Existing assets/visual-editor.js is reused (cache-busted to v5).
- Existing Vercel + Neon CMS APIs stay untouched.
- Existing drag-to-move, inspector edits, Undo/Redo, Save Draft & Publish remain wired.
- Builder component search, property-category tabs, and drag-from-library-to-canvas are added in this HTML.

NOTES
- GitHub connected accounts visible to ChatGPT do not have write permissions on the mubest001 repository.
- Updating this HTML does not require environment-variable or database changes.
- No website public pages or Search Console files are changed by this package.
