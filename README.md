# TagayOke admin update: session history + song catalog health

## Install
1. Copy everything in `src/` over your project's `src/` (new files: `pages/admin/Songs.jsx`, `pages/admin/History.jsx`,
   `utils/csv.js`, `styles/admin-extra.css`; the rest replace existing files).
   `styles/global.css` also includes the missing admin colour tokens, so you can skip the earlier `fix/global.css`.
2. Supabase -> SQL Editor -> run `supabase/session-history-and-song-reports.sql` (additive, safe to re-run).
3. Open /admin. New: **Session history** tab, and the **Songs** tab now has filters, duplicates, CSV import/export.

## What you get
- Session history: every hosted session with its access code, real length, songs played, phones joined and how it ended.
- Songs: pages of 50, "No video" and "Reported" filters, duplicate finder, CSV import (with preview) and export.
- Broken videos are reported automatically from the TV when YouTube refuses a video, and phones get a "Video not working? Report it" link.
