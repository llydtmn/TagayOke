import { useEffect, useRef, useState } from 'react';
import { api } from '../services';
import Icon from './Icon';
import { Mic, Notes, Waves, Sleeve } from './VintageArt';

const PAGE = 100; // songs loaded per batch, listed A to Z by title
const initial = (t) => { const c = (t || '').trim().charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : '#'; };

export default function SongBook({ onReserve }) {
  const [q, setQ] = useState('');
  const [songs, setSongs] = useState([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [letter, setLetter] = useState('');   // '' = all
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

  const base = songs;
  const letters = [...new Set(base.map((s) => initial(s.title)))].sort();
  const shown = letter ? base.filter((s) => initial(s.title) === letter) : base;

  const exact = /^\d{5}$/.test(q.trim()) && songs.length === 1 ? songs[0] : null;

  return (
    <section className="songbook">
      <header className="sb-masthead">
        <Mic className="sb-mic" size={92} />
        <div>
          <p className="sb-kicker">Est. for singing out loud</p>
          <h2 className="sb-title">The Songbook Room</h2>
          <p className="sb-sub"><Notes size={18} /> A catalogue of karaoke classics. Find a number, pick a sleeve, reserve it.</p>
        </div>
      </header>

      <label className="field sb-search">
        <span>Song number, title or artist</span>
        <span className="sb-input">
          <Icon name="search" size={20} />
          <input type="search" inputMode="search" enterKeyHint="search" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a Song..." />
        </span>
      </label>

      <div className="sb-filters" role="group" aria-label="Browse the song book">
        <button type="button" className="sb-chip" aria-pressed={!letter} onClick={() => setLetter('')}>All</button>
        {letters.length > 1 && <span className="sb-rule" aria-hidden="true" />}
        {letters.length > 1 && letters.map((l) => (
          <button type="button" key={l} className="sb-chip letter" aria-pressed={letter === l} aria-label={`Titles starting with ${l}`} onClick={() => setLetter(letter === l ? '' : l)}>{l}</button>
        ))}
      </div>

      {exact && <button className="primary wide" onClick={() => onReserve(exact)}><Icon name="plus" size={18} />Reserve #{exact.code} {exact.title}</button>}

      <ul className="songs sb-grid" aria-label="Songs">
        {shown.map((s) => (
          <li key={s.id} className="sb-card">
            <Sleeve code={s.code} />
            <div className="grow sb-info">
              <span className="chip small sb-no">No. {s.code}</span>
              <b>{s.title}</b>
              <span className="muted">{s.artist}</span>
            </div>
            <div className="sb-actions">
              <button className="primary sb-play" onClick={() => onReserve(s)} aria-label={`Reserve ${s.title}`}>Reserve</button>
            </div>
          </li>
        ))}
      </ul>
      {more && <button className="ghost wide" onClick={loadMore} disabled={loading}>{loading ? 'Loading…' : 'Show more songs'}</button>}
      {q && !songs.length && <p className="empty">No match in the song book.</p>}
      {q && <button className="ghost wide" onClick={searchOnline}><Icon name="search" size={18} />Not in the book? Search YouTube karaoke</button>}
      {note && <p className="muted" role="status">{note}</p>}
      <Waves className="sb-foot" size={96} />
    </section>
  );
}
