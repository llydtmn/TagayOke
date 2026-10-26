// Optional "search YouTube karaoke" fallback. Keeps the API key server-side and
// caches every result into `songs`, so a repeat search never spends quota twice.
// Secrets: YT_API_KEY (yours). SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { q } = await req.json();
    if (!q || String(q).length > 80) throw new Error('Bad query');

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.search = new URLSearchParams({
      part: 'snippet', type: 'video', videoEmbeddable: 'true', maxResults: '8',
      q: `${q} karaoke`, key: Deno.env.get('YT_API_KEY')!,
    }).toString();
    const yt = await (await fetch(url)).json();
    if (yt.error) throw new Error(yt.error.message);

    const rows = (yt.items ?? []).map((i: any) => ({
      title: decode(i.snippet.title), artist: decode(i.snippet.channelTitle),
      youtube_id: i.id.videoId, language: 'Other', source: 'youtube',
    }));

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data, error } = await db.from('songs').upsert(rows, { onConflict: 'youtube_id' }).select();
    if (error) throw error;

    return new Response(JSON.stringify({ songs: data }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
});
