const ID = /^[\w-]{11}$/;

// Accepts watch, youtu.be, shorts, embed and live links, or a bare 11-character ID.
export function parseYouTubeId(input = '') {
  const raw = input.trim();
  if (ID.test(raw)) return raw;
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const host = u.hostname.replace(/^(www|m|music)\./, '');
    let id = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      id = u.searchParams.get('v');
      if (!id) { const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/); id = m && m[1]; }
    }
    return id && ID.test(id) ? id : null;
  } catch { return null; }
}

// Best effort title lookup through YouTube's oEmbed endpoint. Returns null if it fails.
export async function fetchVideoInfo(id) {
  try {
    const url = `https://www.youtube.com/watch?v=${id}`;
    const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!r.ok) return null;
    const d = await r.json();
    return { title: d.title, artist: d.author_name };
  } catch { return null; }
}
