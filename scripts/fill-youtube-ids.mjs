// fill-youtube-ids.mjs  (faster version: parallel searches + skips already-used videos)
// Usage: node scripts\fill-youtube-ids.mjs
// Optional: set CONCURRENCY (default 6). Example (PowerShell): $env:CONCURRENCY=8; node scripts\fill-youtube-ids.mjs
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { createClient } from "@supabase/supabase-js";

const run = promisify(execFile);
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY) || 6);
const RESULTS_PER_SEARCH = 8; // extra results so we can skip videos another song already uses

const CANDIDATES = [["yt-dlp"], ["python", "-m", "yt_dlp"], ["py", "-m", "yt_dlp"]];
const YT = CANDIDATES.find((c) => {
  try { execFileSync(c[0], [...c.slice(1), "--version"], { stdio: "ignore" }); return true; }
  catch { return false; }
});
if (!YT) {
  console.error("yt-dlp not found. Run: py -m pip install -U yt-dlp");
  process.exit(1);
}

const embeddable = async (id) => {
  try {
    return (await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)).ok;
  } catch { return false; }
};

// Async (does not block other workers). One automatic retry if yt-dlp fails.
async function search(q) {
  const args = [...YT.slice(1), "--flat-playlist", "--print", "id", `ytsearch${RESULTS_PER_SEARCH}:${q} karaoke version`];
  for (let attempt = 1; ; attempt++) {
    try {
      const { stdout } = await run(YT[0], args, { encoding: "utf8", timeout: 45000, windowsHide: true });
      return stdout.trim().split("\n").filter(Boolean);
    } catch (e) {
      if (attempt >= 2) throw new Error("search failed: " + String(e.message).split("\n")[0]);
    }
  }
}

async function fetchPaged(build) {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await build().range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

// IDs already in the table (so we never try to reuse one -> no more duplicate-key errors)
const used = new Set(
  (await fetchPaged(() => sb.from("songs").select("youtube_id").not("youtube_id", "is", null).order("id")))
    .map((r) => r.youtube_id)
);
const songs = await fetchPaged(() => sb.from("songs").select("id,title,artist").is("youtube_id", null).order("id"));
console.log(`${songs.length} songs need a youtube_id (running ${CONCURRENCY} at a time)`);

let done = 0, ok = 0, skipped = 0, failed = 0;
const total = songs.length;
const tag = () => `[${++done}/${total}]`;

async function handle(s) {
  try {
    for (const id of await search(`${s.title} ${s.artist}`)) {
      if (used.has(id)) continue;   // taken by another song (or another worker)
      used.add(id);                 // claim it right away so parallel workers can't pick it too
      if (!(await embeddable(id))) continue;
      const { error } = await sb.from("songs").update({ youtube_id: id }).eq("id", s.id);
      if (error) {
        if (error.code === "23505") continue; // someone else has it, try the next result
        used.delete(id);
        throw error;
      }
      ok++;
      console.log(tag(), "✓", s.title, "-", s.artist, id);
      return;
    }
    skipped++;
    console.log(tag(), "–", "no free embeddable result:", s.title, "-", s.artist);
  } catch (e) {
    failed++;
    console.log(tag(), "✗", s.title, "-", s.artist, String(e.message).slice(0, 120));
  }
}

// Simple worker pool
let next = 0;
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (next < total) await handle(songs[next++]);
}));

console.log(`\nDone. Filled: ${ok}, no result: ${skipped}, errors: ${failed}.`);
console.log("Songs left without an ID can be checked in Supabase (youtube_id is null). Re-run to retry them.");
