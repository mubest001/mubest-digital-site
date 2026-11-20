# Mubest Digital Admin Dashboard — Installation

This package adds a private content-management dashboard to the existing Mubest Digital website.

- Existing public website: kept in place.
- Admin URL after installation: `/admin/`
- Database: Neon PostgreSQL.
- Media uploads: Vercel Blob.
- API: Vercel serverless functions.
- Public pages read published content at runtime.
- Content edits do not trigger a Vercel deployment.

## 1. Files to upload

Upload the contents of this package into the existing `mubest-digital-site` directory in your connected GitHub repository. Keep the current directory structure.

**New files**
- `admin/index.html`
- `api/auth.js`
- `api/public-content.js`
- `api/admin.js`
- `api/contact.js`
- `api/upload.js`
- `lib/auth.js`
- `lib/db.js`
- `lib/defaults.js`
- `assets/cms-admin.css`
- `assets/cms-admin.js`
- `assets/cms-public.css`
- `assets/cms-public.js`
- `database/schema.sql`
- `package.json`
- `README-CMS-SETUP.md`

**Replace existing files**
- `assets/site.js`
- `robots.txt`

Do not remove the existing `index.html`, `about`, `services`, `portfolio`, `contact`, `assets/site.css`, logo or favicon. The CMS script loads alongside the current site and keeps its existing design.

## 2. Create the Neon database

Create a new, dedicated Neon project/database for Mubest Digital. Do not reuse a database that belongs to another website or application.

In Neon:
1. Create a PostgreSQL project.
2. Open the connection details.
3. Copy the pooled connection string (the hostname usually contains `-pooler`).
4. Keep the connection string private.

The CMS automatically creates its tables and seeds the current website content on its first API request. `database/schema.sql` is included as a reference.

## 3. Create a Vercel Blob store

In the existing Vercel project for `mubest-digital-site`:
1. Open **Storage**.
2. Create a **Blob** store.
3. Set access to **Public**, because portfolio images and brand assets must be visible on the public website.
4. Connect it to this existing Vercel project.
5. Vercel adds `BLOB_READ_WRITE_TOKEN` to the project's environment variables.

Client uploads are authorized by the private admin session; do not expose the Blob token in browser code.

## 4. Add Vercel environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon pooled connection string |
| `ADMIN_SETUP_KEY` | A long, unique one-time setup key (at least 32 random characters) |
| `SITE_URL` | `https://mubest-digital-site.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Automatically added when the Blob store is connected |

Apply the variables to Production. Preview can also be selected if you intend to test admin changes on preview deployments.

Do not put database passwords or setup keys in any public JavaScript or HTML file.

## 5. Commit and deploy once

1. Upload the files to the existing GitHub repository.
2. Commit them to the existing `main` branch.
3. Vercel will deploy the dashboard and API as part of the same project.

This is the one required deployment to install the CMS.

## 6. Create the administrator

After the deployment is ready:
1. Visit `https://mubest-digital-site.vercel.app/admin/`.
2. The first-run screen asks for the one-time setup key, administrator email and password.
3. Use a strong password of at least 12 characters.
4. After the first administrator is created, the setup endpoint is permanently closed while that administrator account exists. You may remove `ADMIN_SETUP_KEY` from Vercel later as additional cleanup; doing so is optional and does not affect normal dashboard use.

The dashboard is not linked in the public navigation and its page is marked noindex. Keep the administrator credentials private.

## 7. What the dashboard manages

- Overview and recent enquiries
- Portfolio projects: create, edit, feature, reorder, publish, draft and delete
- Services and deliverables
- Page copy for Home, About, Services, Portfolio and Contact
- Media library: upload, reuse and delete images/video
- Logo, favicon, About/profile picture
- Contact details and social links
- Brand colours and font choices
- SEO title and description
- Testimonials and FAQs
- Contact form enquiries and follow-up notes
- Activity history and content revision restoration

## 8. Publishing workflow

For page copy:
1. Open Page editor.
2. Choose a page.
3. Edit the text.
4. Save draft or Publish changes.

For portfolio, services, testimonials and FAQs:
- Set status to `published` to show the item publicly.
- Set status to `draft` to keep it in the dashboard only.
- Set status to `archived` to hide it without deleting it.

Published content is read by the public website from the database. Content changes, uploads and page publishing do not require a new Vercel deployment.

## Important notes

- The first three portfolio entries are seeded from the current site: Hobbry, Berrymae and Arteescorp. Their cover images are blank initially; upload approved screenshots and add them through Portfolio.
- The existing About page does not currently contain a portrait image. The CMS can add one after you set the About/profile picture in Website settings.
- Contact form submissions are stored in the Enquiries dashboard. This package does not yet send email notifications.
- Vercel Blob public URLs are used for public images and video. Avoid uploading private documents or confidential client material.
- If you change the website's domain later, update `SITE_URL` in Vercel.
