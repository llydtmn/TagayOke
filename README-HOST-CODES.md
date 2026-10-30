# TagayOke: host access codes + admin updates

## Install (3 steps)
1. Copy everything inside `src/` over your project's `src/` (new files: `hooks/useSessionClock.js`,
   `components/SessionTimer.jsx`, `utils/hostCode.js`; the rest replace existing files).
2. Supabase -> SQL Editor -> paste and run `supabase/host-access-codes.sql` (safe to re-run).
   If the last line errors, turn on **pg_cron** under Database -> Extensions and run the last two lines again.
3. `npm run dev`, open `/admin`, sign in, go to **Access codes**, generate one, then try "Host on this screen".

## How it works
- Admin creates a code with a session length (type a number, then pick Seconds / Minutes / Hours; 1 second to 24 hours), how many times it can be used, and an optional "must be used within" window.
- Someone presses "Host on this screen", types the code, and the server creates the room and starts the clock.
- Host screen shows a countdown (turns pink in the last 10 minutes). At 0 the room is closed and everyone is sent home.
- Very short sessions end on the host screen right away; the server clean-up runs every minute.
- The server also deletes expired rooms every minute (pg_cron) and refuses new reservations after time is up,
  so closing the tab or changing the clock does not extend a session.
- Admin can add time to a running host (+30m / +1h) or end it now.
- Rooms can no longer be created without a code (database trigger); admin-created hosts still work.
