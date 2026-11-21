# CineVerse — Cloudflare Pages Free deployment

This repository is prepared for a **static Cloudflare Pages Free** deployment.

## Pages build settings

- Production branch: `main`
- Build command: `npm run build:github`
- Build output directory: `dist`
- Root directory: `/`
- Environment variable `BACKEND_ORIGIN`: **not required** in Static Free mode.

The `build:github` script generates `public/static-db.json` from the configured public catalogue mirrors before Vite builds the site. If upstream mirrors are unavailable during the build, the app still has its bundled fallback catalogue, but the generated snapshot may be incomplete.

## Free-mode limitations

Cloudflare Pages Free serves the frontend and static catalogue files. The Pages Functions under `functions/api/` deliberately return a non-success response so the browser-side fallback engine can take over; they do not proxy to an Express server.

This does **not** provide the full Node/Express backend. Features requiring persistent server memory/disk, background auto-sync, server-side scraping, FFmpeg processing/remuxing, or server-proxied stream/download endpoints are not guaranteed to work in this mode. Direct playback/download depends on the upstream provider exposing a browser-accessible URL and allowing CORS where required.

No Supabase project or database is modified by this deployment preparation. Keep the existing Cloudflare Pages production project and connect this repository to it only when ready to replace the current frontend.
