# Mubest Digital Content Studio 2.0

## What this update does

A complete UI refresh for the existing `/admin/` dashboard. It keeps the same Neon database, Vercel Blob storage, login system, and public website design.

### Upgraded admin areas
- A redesigned, mobile-friendly dashboard with real counts, recent enquiries and activity, quick actions.
- Page editing for Home, About, Services, Portfolio, Contact, with grouped inputs and a simplified text preview. Each page supports private draft saving and live publishing.
- Portfolio: add, edit, publish, archive, feature, reorder, delete, add images, links, descriptions and gallery URLs.
- Services: update titles, descriptions, tags, icons, deliverables, order and publication status.
- Testimonials and FAQs: add, edit, publish, archive and delete.
- Media library: upload files, filter by image/video, search, edit alt descriptions, copy URLs, delete.
- Brand identity: upload/change your logo, favicon, about/profile picture, brand colours and fonts.
- Homepage & hero: change hero video, fallback poster, availability message, show/hide seven homepage sections.
- Header & footer: menu link text, header call-to-action, announcement bar and footer description/note.
- SEO settings: default page title, descriptions, a sharing image, and individual page metadata fields.
- Contact & social: email, phone, WhatsApp, location and four social links.
- Enquiries: search, filter, update follow-up status and notes, export to CSV.
- Activity and revisions: view prior changes and restore available snapshots.

## Upload instructions — important

The GitHub repository is:
https://github.com/mubest001/mubest-digital-site

**The existing Vercel Root Directory is `mubest-digital-site`.**

In the extracted ZIP, open the folder named `mubest-digital-site`. The contents inside it mirror the correct website subdirectory.

Open the correct GitHub destination:
https://github.com/mubest001/mubest-digital-site/tree/main/mubest-digital-site

Replace/add the following files in that WEBSITE directory:

- `admin/index.html` — REPLACE
- `assets/cms-admin.css` — REPLACE
- `assets/cms-admin.js` — REPLACE
- `assets/cms-public.css` — REPLACE
- `assets/cms-public.js` — REPLACE
- `api/admin.js` — REPLACE
- `api/public-content.js` — REPLACE
- `lib/defaults.js` — REPLACE

Do NOT upload the release files into the repository top level, or into the `mubest-digital-cms` copy. Do NOT create a second nested `mubest-digital-site/mubest-digital-site` directory.

Do NOT delete or replace `index.html`, `site.js`, `site.css`, `vercel.json`, existing image assets, existing login/auth implementation, or your public page folders. No new environment variables are required.

Once committed to `main`, your connected Vercel project should deploy. Check the production deployment status in Vercel, then open:
https://mubest-digital-site.vercel.app/admin/

Hard-refresh with Ctrl + Shift + R to clear older cached scripts.

## Operating the dashboard

1. Login with your existing admin email and password. This update does not create or reset the administrator.
2. Content Studio > Pages: edit a page and choose Save draft or Publish changes.
3. Portfolio/Services/Testimonials/FAQs: save an item with Published status to show publicly.
4. Brand identity, Homepage & hero, Header & footer, SEO & sharing, Contact & social: save the relevant settings group to update the public site.
5. Media library: upload photos/videos first, then select them with the image picker in an editor.
6. Enquiries: track new leads, save internal notes/status, export records when needed.

## Notes and limitations

- Changes to database content normally do NOT need another Vercel deployment after installation. This code upgrade DOES require one deployment.
- Existing content in Neon remains intact, and default settings seed only missing keys (they never overwrite existing values).
- New page settings / default SEO metadata are applied to the existing static website by JavaScript. Some social crawlers and search engines do not execute JavaScript, so rich link-preview and indexing guarantees require future server-rendered/prerendered metadata. Do not treat this as a complete technical SEO solution.
- The simplified page-editor preview shows headline/intro text; it is not a pixel-perfect draft version of the website. The live-page link shows the currently published page.
- This package does not add a blog, commerce checkout, analytics tracking, email notifications, or extra user accounts. These need separate backend/frontend work.
- Your original SVG full logo and icon favicon are reused at `/assets/mubest-digital-logo.svg` and `/assets/favicon.svg`; they are NOT replaced.
- Do not publish private client images or credentials via Public Vercel Blob storage. Only upload approved media.
- We tested JavaScript syntax and compatibility of the new settings/API names, but we have not authenticated against your private live Neon database or executed a production browser test. Test a safe content edit before relying on all tools.
