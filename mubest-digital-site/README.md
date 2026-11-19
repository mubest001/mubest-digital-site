# Mubest Digital website

A responsive, multi-page static website for Mubest Digital. Built with HTML, CSS and vanilla JavaScript so it can be deployed directly to Vercel from GitHub without a build step.

## Pages

- `/` — Home
- `/about/` — About
- `/services/` — Services
- `/portfolio/` — Portfolio
- `/contact/` — Contact

## Run locally

Run a local static server from this folder (the site uses root-relative asset paths):

```bash
python -m http.server 3000
```

Then visit `http://localhost:3000`.

## Deploy to Vercel through GitHub

1. Create a new GitHub repository, for example `mubest-digital`.
2. Upload the contents of this folder to the repository root (not the folder wrapper).
3. In Vercel, choose **Add New → Project** and import the repository.
4. Select **Other** as the framework preset if Vercel asks.
5. Leave the build command empty and set the output directory to `.` if requested.
6. Deploy. Vercel will serve the static HTML pages and assets.

## Before publishing

### 1. Configure the contact email

Open `assets/site.js` and set:

```js
const CONTACT_EMAIL = 'your-real-business-email@example.com';
```

The contact form validates the fields and prepares a pre-filled email draft in the visitor's email app. It does not silently store or transmit form data. If you want a server-side form that sends directly without opening the visitor's email app, connect a form provider or backend later.

### 2. Review portfolio details

The first draft includes Hobbry, Berrymae and Arteescorp based on the portfolio projects discussed. The portfolio visuals are illustrative interface compositions, not screenshots of the live websites. Replace them with approved screenshots and confirm the exact project descriptions before launch.

### 3. Hero video

The hero uses a Pexels video clip as a remote MP4 background, with a static poster fallback. It is muted, autoplaying and looping. Pexels source: https://www.pexels.com/video/a-person-is-working-on-a-computer-screen-19197449/ . If you prefer, replace the source with your own edited brand reel in the hero `<video>` element.

## Brand system

- Midnight: `#17191F`
- Warm ivory: `#F5F3EE`
- Electric blue: `#4563F5`
- Lime accent: `#B9E769`
- Headings: Space Grotesk
- Body: DM Sans

The website uses Google Fonts when online and falls back to system fonts if they cannot load.
