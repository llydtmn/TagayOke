// fill-youtube-ids.mjs
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const CANDIDATES = [["yt-dlp"], ["python", "-m", "yt_dlp"], ["py", "-m", "yt_dlp"]];
const YT = CANDIDATES.find((c) => {
  try { execFileSync(c[0], [...c.slice(1), "--version"], { stdio: "ignore" }); return true; }
  catch { return false; }
});
if (!YT) {
  console.error("yt-dlp not found. Run: py -m pip install -U yt-dlp");
  process.exit(1);
}

const embeddable = async (id) =>
  (await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)).ok;

function search(q) {
  return execFileSync(
    YT[0],
    [...YT.slice(1), "--flat-playlist", "--print", "id", `ytsearch5:${q} karaoke version`],
    { encoding: "utf8" }
  ).trim().split("\n").filter(Boolean);
}

async function fetchAll() {
  const all = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb.from("songs").select("id,title,artist")
      .is("youtube_id", null).order("id").range(from, from + 999);
    if (error) throw error;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

const songs = await fetchAll();
console.log(`${songs.length} songs need a youtube_id`);

for (const s of songs) {
  try {
    let found = false;
    for (const id of search(`${s.title} ${s.artist}`)) {
      if (await embeddable(id)) {
        const { error } = await sb.from("songs").update({ youtube_id: id }).eq("id", s.id);
        if (error) throw error;
        console.log("✓", s.title, id);
        found = true;
        break;
      }
    }
    if (!found) console.log("– no embeddable result:", s.title, "-", s.artist);
  } catch (e) { console.log("✗", s.title, e.message); }
}
console.log("Done.");