import { useEffect, useState } from 'react';
import { api } from '../services';

export default function SongBook({ onReserve }) {
  const [q, setQ] = useState('');
  const [songs, setSongs] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    const t = setTimeout(() => api.listSongs(q).then(setSongs).catch((e) => setNote(e.message)), 150);
    return () => clearTimeout(t);
  }, [q]);

  const searchOnline = async () => {
    setNote('Searching YouTube…');
    try { setSongs(await api.searchOnline(q)); setNote(''); } catch (e) { setNote(e.message); }
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
      {q && !songs.length && <p className="empty">No match in the song book.</p>}
      {q && <button className="ghost wide" onClick={searchOnline}>Not in the book? Search YouTube karaoke</button>}
      {note && <p className="muted" role="status">{note}</p>}
    </section>
  );
}
