// returns [{ time: seconds, text }] or null
export async function fetchLyrics(title, artist) {
  const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.syncedLyrics) return null;
    return data.syncedLyrics.split("\n").map((line) => {
      const m = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*(.*)$/);
      return m ? { time: +m[1] * 60 + +m[2], text: m[3] } : null;
    }).filter(Boolean);
  } catch { return null; }
}