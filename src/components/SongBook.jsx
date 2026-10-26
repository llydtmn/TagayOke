import { useEffect, useRef, useState } from 'react';
import { api } from '../services';

const PAGE = 100; // songs loaded per batch, listed A to Z by title

export default function SongBook({ onReserve }) {
  const [q, setQ] = useState('');
  const [songs, setSongs] = useState([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const req = useRef(0); // ignores answers that arrive after the search text changed

  useEffect(() => {
    const id = ++req.current;
    const t = setTimeout(() => {
      api.listSongs(q, 0, PAGE)
        .then((r) => { if (id !== req.current) return; setSongs(r); setMore(r.length === PAGE); setNote(''); })
        .catch((e) => setNote(e.message));
    }, 150);
    return () => clearTimeout(t);
  }, [q]);

  const loadMore = async () => {
    const id = req.current;
    setLoading(true);
    try {
      const r = await api.listSongs(q, songs.length, PAGE);
      if (id !== req.current) return;
      setSongs((prev) => [...prev, ...r]);
      setMore(r.length === PAGE);
    } catch (e) { setNote(e.message); }
    finally { setLoading(false); }
  };

  const searchOnline = async () => {
    setNote('Searching YouTube…');
    try { setSongs(await api.searchOnline(q)); setMore(false); setNote(''); } catch (e) { setNote(e.message); }
  };

  const exact = /^\d{5}$/.test(q.trim()) && songs.length === 1 ? songs[0] : null;

  return (
    <section>
      <label className="field">
        <span>Song number, title or artist</span>
        <input inputMode="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try 10003 or Eraserheads" />
      </label>
      {exact && <button className="primary wide" onClick={() => onReserve(exact)}>Reserve #{exact.code} {exact.title}</button>}
      <ul className="songs">
        {songs.map((s) => (
          <li key={s.id}>
            <span className="chip small">#{s.code}</span>
            <div className="grow"><b>{s.title}</b><span className="muted">{s.artist}</span></div>
            <button className="primary" onClick={() => onReserve(s)}>Reserve</button>
          </li>
        ))}
      </ul>
      {more && <button className="ghost wide" onClick={loadMore} disabled={loading}>{loading ? 'Loading…' : 'Show more songs'}</button>}
      {q && !songs.length && <p className="empty">No match in the song book.</p>}
      {q && <button className="ghost wide" onClick={searchOnline}>Not in the book? Search YouTube karaoke</button>}
      {note && <p className="muted" role="status">{note}</p>}
    </section>
  );
}