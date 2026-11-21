Mubest Digital — Content Studio + Visual Website Builder media upgrade
21 November 2026

THIS PACKAGE REPLACES EXACTLY THREE EXISTING FILES
1. mubest-digital-site/admin/index.html
2. mubest-digital-site/assets/cms-admin.js
3. mubest-digital-site/assets/visual-editor.js

IMPORTANT
- These paths include the inner `mubest-digital-site` folder in the repository.
- Do not upload to the duplicate root `admin/` or `assets/` folders.
- No database migration and no environment variable changes are required.
- Do not deploy the entire ZIP as an independent Vercel project; replace the files in the existing GitHub repository and commit.

DIRECT GITHUB FOLDERS
Admin file: https://github.com/mubest001/mubest-digital-site/blob/main/mubest-digital-site/admin/index.html
CMS JavaScript: https://github.com/mubest001/mubest-digital-site/blob/main/mubest-digital-site/assets/cms-admin.js
Visual builder JavaScript: https://github.com/mubest001/mubest-digital-site/blob/main/mubest-digital-site/assets/visual-editor.js

WHAT CHANGES
- Adds upload button, drag-and-drop, file search and selectable thumbnails directly to the existing Content Studio image picker.
- Uses the existing authenticated /api/upload endpoint (Vercel Blob) and /api/admin media records (Neon).
- Keeps the current form open when uploading instead of navigating away.
- Adds 'Choose or upload media' inside the visual builder when an image or video element is selected.
- Syncs both editors to the same persisted media library.
- Restricts uploads to types accepted by the API and 50 MB per file.
- Removes reference to the previous fragile media-picker-upload.js add-on. It can remain in the repository unused.
- Doesn't change public website pages, design, analytics, Google verification, sitemap or SEO.

HOW TO CHECK
1. Commit all three replacements on `main`.
2. In Vercel project Deployments, wait until production shows Ready.
3. In the browser, hard-refresh /admin/ and sign in.
4. Open Branding > choose a logo/image. You should now see Upload media and drag/drop.
5. Open /admin/visual-editor/ and select an existing image, then click Choose or upload media in Element settings.
6. Upload an image (JPG/PNG/etc); select it from the grid; save/publish your edits.

VALIDATION COMPLETED
- Baselines matched current repository's Git blob hashes for all edited source files.
- JavaScript passed Node.js syntax checks.
- HTML controls and CSS parsed successfully.
- Browser UI smoke test: CMS upload modal opens; visual editor library modal opens and applies an existing media URL; no client-side JS exceptions under mocks.
- Live Blob upload was not tested because a production admin session is required. Validate one real file upload after deployment.
