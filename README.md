# TagayOke — Sing. Sip. Repeat.

A videoke for your inuman session: numbered songs, a song book, and a live reservation queue.
A host screen (TV or laptop) plays through the official YouTube IFrame Player; phones join by QR code and reserve songs.

## Run it (demo mode, no backend)
    npm install
    npm run dev
Open the app, click **Host on this screen**, then open the same site in a second tab and join with the room code or QR link.
Demo mode syncs tabs of one browser via localStorage + BroadcastChannel and uses a 15-second simulated player.

## Connect Supabase (real multi-device)
1. Create a Supabase project. In the SQL editor run `supabase/schema.sql`, then `supabase/seed.sql`.
2. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. In `songs`, set `youtube_id` for each song to a karaoke video you have checked is embeddable.
4. Optional YouTube search fallback: deploy `supabase/functions/yt-search` and set the secret `YT_API_KEY`
   (Supabase CLI: `supabase functions deploy yt-search`, `supabase secrets set YT_API_KEY=...`).

## Music source: curated catalog first, YouTube search as a cached fallback
- Songs live in your own `songs` table with numbers (10001+). Browsing and number entry cost no YouTube quota.
- Searching YouTube runs server-side in the edge function, filters to embeddable videos, and saves results so repeats are free.
- Playback is only via the official embedded player. No downloading or re-hosting.
- [uncertain] Verify current YouTube Data API quota costs and the YouTube API Services Terms before sharing publicly.
- Keep the project private and non-commercial.

## Folder map
    src/
      config/       env flags, app name
      data/         demo song list
      services/     api (the only backend boundary): mockAdapter, supabaseAdapter, supabaseClient
      hooks/        useQueue (fetch + realtime + actions)
      components/   Stage, YouTubePlayer, DemoStage, SongBook, QueueList
      pages/        Landing, Host (TV), Remote (phone)
      styles/       global.css
      utils/        room code + join URL
    supabase/       schema.sql, seed.sql, functions/yt-search

## Known gaps (on purpose, for the MVP)
- Row-level security is open so rooms work without logins. Tighten before any public launch.
- Anyone with a room code can add songs and remove their own entries; only the host screen can skip or remove any.
- Package versions in package.json are ranges; run `npm install` and check for updates.
