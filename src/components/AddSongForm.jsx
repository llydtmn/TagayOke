import { useState } from 'react';
import { api } from '../services';
import { parseYouTubeId, fetchVideoInfo } from '../utils/youtube';

export default function AddSongForm({ onReserve }) {
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [added, setAdded] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const onLink = async (v) => {
    setLink(v); setAdded(null); setMsg('');
    const id = parseYouTubeId(v);
    if (!id) return;
    const info = await fetchVideoInfo(id); // prefill only; you can edit the fields
    if (info) { setTitle((t) => t || info.title); setArtist((a) => a || info.artist); }
  };

  const reset = () => { setLink(''); setTitle(''); setArtist(''); setAdded(null); setMsg(''); };

  const submit = async (e) => {
    e.preventDefault();
    const youtubeId = parseYouTubeId(link);
    if (!youtubeId) return setMsg('That is not a YouTube link. Paste the video address from the Share button.');
    if (!title.trim()) return setMsg('Add the song title so people can find it in the song book.');
    setBusy(true);
    try {
      setAdded(await api.addSong({ youtubeId, title: title.trim(), artist: artist.trim() }));
      setMsg('');
    } catch (err) { setMsg(err.message || 'Could not add the song.'); }
    finally { setBusy(false); }
  };

  if (added) {
    return (
      <section className="added">
        <p><span className="chip small">#{added.code}</span> <b>{added.title}</b> is in the song book.</p>
        <button className="primary" onClick={() => { onReserve(added); reset(); }}>Reserve it now</button>
        <button className="ghost" onClick={reset}>Add another</button>
      </section>
    );
  }

  return (
    <form onSubmit={submit}>
      <label className="field"><span>YouTube link to a karaoke video</span>
        <input value={link} onChange={(e) => onLink(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." inputMode="url" />
      </label>
      <label className="field"><span>Song title</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
      </label>
      <label className="field"><span>Artist (optional)</span>
        <input value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={100} />
      </label>
      <button className="primary wide" type="submit" disabled={busy}>{busy ? 'Adding…' : 'Add to song book'}</button>
      <p className="muted">If the video does not allow embedding, the TV skips it to the next song.</p>
      {msg && <p className="error" role="alert">{msg}</p>}
    </form>
  );
}
