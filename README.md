# Mubest Digital — Portfolio Appearance & Motion Update

This update is for the GitHub repository `mubest001/mubest-digital-site`, project root `mubest-digital-site/`, deployed to `mubestdigital.vercel.app`.

## What's included

- **Default 3-column desktop portfolio**, 2-column tablet, 1-column mobile.
- Dashboard controls for 1–5 portfolio columns, 1–4 homepage columns, mobile/tablet counts and card spacing.
- **10 hover presets**: Lift, Zoom, Tilt, Glow, Sheen, Reveal, Spotlight, Parallax, Border, Float, plus None.
- **4 entrance options**: Fade up, Scale in, Stagger, None; configurable speed.
- Admin preview cards that react instantly as you choose each hover effect.
- Configurations stored in the existing Neon site settings and reflected on public pages.
- Removes the old “first website draft” portfolio disclaimer without altering project records.
- Keyboard hover equivalents, responsive layouts, and reduced-motion handling.

## Apply

1. Clone or download the existing repository and open a terminal inside the repo.
2. Run:

   ```sh
   python path/to/mubest_portfolio_motion_update/apply_mubest_portfolio_motion.py mubest-digital-site
   ```

   Replace `path/to` with the directory where you extracted this update, or run `python apply_mubest_portfolio_motion.py /path/to/repo/mubest-digital-site` from inside the extracted update folder.
3. Inspect `git diff`, commit, and push to `main`. The existing GitHub → Vercel integration will deploy the source changes.
4. Log in to `/admin/`, open **Portfolio appearance** from the sidebar, try the animation preview, then save each settings card.

## Notes

- This package has **not** been deployed to the live site from this chat. A GitHub connection with write access to `mubest001/mubest-digital-site` is needed for an automatic in-chat update.
- No database migration is required. The existing `site_settings` JSONB table stores new settings.
- It does not change the existing brand, project descriptions, navigation or SEO settings.
