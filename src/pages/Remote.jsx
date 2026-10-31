import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services';
import { joinRoom, pingRoom } from '../services/presence';
import { useQueue } from '../hooks/useQueue';
import SongBook from '../components/SongBook';
import QueueList from '../components/QueueList';
import Keypad from '../components/Keypad';
import AddSongForm from '../components/AddSongForm';
import Icon from '../components/Icon';
import { MAX_QUEUE } from '../config/env';

const TABS = [['keypad', 'Keypad', 'keypad'], ['book', 'Song book', 'book'], ['add', 'Add link', 'link'], ['queue', 'Queue', 'queue']];

const REPORTED = new Set(); // songs this phone already reported (module level so it needs no hook)

export default function Remote() {
  const { code } = useParams();
  const nav = useNavigate();
  const [exists, setExists] = useState(null);
  const [name, setName] = useState(localStorage.getItem('tagayoke:name') || '');
  const [draft, setDraft] = useState('');
  const [tab, setTab] = useState('keypad');
  const [toast, setToast] = useState('');
  const { queue, nowPlaying, add, error } = useQueue(code);

  useEffect(() => { api.roomExists(code).then(setExists); }, [code]);

  // Lets the admin dashboard count this phone as a user of the room.
  useEffect(() => {
    if (!name || exists !== true) return undefined;
    joinRoom(code, name).catch(() => {});
    const timer = setInterval(() => pingRoom(code).catch(() => {}), 30000);
    return () => clearInterval(timer);
  }, [code, name, exists]);

  // If the host ends the session (room deleted), send everyone back to the home page.
  useEffect(() => {
    const goHome = () => nav('/', { replace: true, state: { closed: true } });
    const off = api.subscribeRoom(code, goHome);
    let misses = 0; // backup check in case realtime is slow; needs 2 misses in a row
    const timer = setInterval(async () => {
      misses = (await api.roomExists(code)) ? 0 : misses + 1;
      if (misses >= 2) goHome();
    }, 5000);
    return () => { off(); clearInterval(timer); };
  }, [code, nav]);

  if (exists === false) {
    return <main className="landing"><p className="error">Room {code} was not found.</p><Link to="/">Back to start</Link></main>;
  }

  if (!name) {
    const save = (e) => {
      e.preventDefault();
      const n = draft.trim();
      if (n) { localStorage.setItem('tagayoke:name', n); setName(n); }
    };
    return (
      <main className="landing">
        <h1 className="logo small">Join {code}</h1>
        <form onSubmit={save}>
          <label className="field"><span>What should we call you on the queue?</span>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={20} placeholder="Your name or nickname" autoFocus />
          </label>
          <button className="primary wide" type="submit">Join the session</button>
        </form>
      </main>
    );
  }

  const full = queue.length >= MAX_QUEUE;
  const flash = (msg, ms = 2500) => { setToast(msg); setTimeout(() => setToast(''), ms); };

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  const onTabKey = (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = TABS.findIndex(([id]) => id === tab);
    const next = TABS[(i + step + TABS.length) % TABS.length][0];
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  const reserve = async (song, opts) => {
    if (queue.length >= MAX_QUEUE) {
      flash(`The queue is full (${MAX_QUEUE} songs max). Try again after a song finishes.`, 4000);
      return;
    }
    const ok = await add(song, name, opts); // false when the server refused it (e.g. someone else took the last spot)
    if (!ok) return;
    flash(opts?.first ? `Next up: #${song.code} ${song.title}` : `Reserved #${song.code} ${song.title}`);
  };

  return (
    <main className="remote">
      <header className="remote-head">
        <span className="logo small" aria-label={`Room ${code}`}>{code}</span>
        <p className="muted" aria-live="polite">{nowPlaying ? `Now: ${nowPlaying.song.title}` : 'Nothing playing yet'}</p>
      </header>
      {nowPlaying && !REPORTED.has(nowPlaying.id) && (
        <button className="report-link" onClick={() => { REPORTED.add(nowPlaying.id); api.reportSong(nowPlaying.song.id, 'broken'); flash('Thanks! We will check this song.'); }}>
          Video not working? Report it
        </button>
      )}
      <nav className="tabs" role="tablist" aria-label="Remote sections" onKeyDown={onTabKey}>
        {TABS.map(([id, label, icon]) => (
          <button key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls="remote-panel" tabIndex={tab === id ? 0 : -1} onClick={() => setTab(id)}>
            <Icon name={icon} size={20} />{id === 'queue' && queue.length ? `Queue (${queue.length})` : label}
          </button>
        ))}
      </nav>
      {full && <p className="muted" role="status">Queue is full ({queue.length}/{MAX_QUEUE}). You can reserve again once a song finishes.</p>}
      <div id="remote-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'keypad' && <Keypad onReserve={reserve} onList={() => setTab('book')} />}
        {tab === 'book' && <SongBook onReserve={reserve} />}
        {tab === 'add' && <AddSongForm onReserve={reserve} />}
        {tab === 'queue' && <QueueList items={queue} empty="Nobody has reserved a song yet. Open the song book and go first." />}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      {toast && <p className="toast" role="status">{toast}</p>}
    </main>
  );
}