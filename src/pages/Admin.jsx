import { Fragment, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as admin from '../services/admin';
import { getAnnouncement, saveAnnouncement } from '../services/settings';
import { AnnouncementView } from '../components/Announcement';
import Songs from './admin/Songs';
import History from './admin/History';
import { formatDuration, formatLeft } from '../utils/hostCode';
import '../styles/admin.css';

const ACTIVE_MS = 2 * 60 * 1000; // a phone counts as "active" if it checked in within the last 2 minutes

const ago = (iso) => {
  if (!iso) return '—';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};

// ---- small inline icons (no extra dependency) ----
const ICONS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9M16 7l3 3M14 9l2 2" /></>,
  music: <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>,
  back: <path d="M15 18l-6-6 6-6" />,
  out: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.5a3.5 3.5 0 010 7M18 14.3c2.2.8 3.5 2.6 3.5 5.7" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  mic: <><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  chart: <><path d="M3 3v18h18" /><path d="M8 16v-5M13 16V7M18 16v-8" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></>,
  megaphone: <><path d="M3 11v2a1 1 0 001 1h3l8 5V5L7 10H4a1 1 0 00-1 1z" /><path d="M18.5 9a4 4 0 010 6" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 21h16" /></>,
};
function Icon({ name, size = 20 }) {
  return (
    <svg className="ad-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

// Karaoke illustration for the greeting banner.
function HeroArt() {
  return (
    <svg className="ad-hero-art" viewBox="0 0 260 170" aria-hidden="true">
      <g fill="#0a1650" opacity=".12">
        <rect x="10" y="38" width="190" height="16" rx="8" />
        <rect x="40" y="70" width="210" height="16" rx="8" />
        <rect x="0" y="102" width="170" height="16" rx="8" />
        <rect x="60" y="134" width="190" height="16" rx="8" />
      </g>
      <g transform="rotate(18 150 85)">
        <rect x="122" y="14" width="56" height="72" rx="28" fill="#ff4fa3" />
        <g stroke="#fff" strokeWidth="3" opacity=".6">
          <path d="M126 36h48M126 50h48M126 64h48" />
        </g>
        <rect x="140" y="82" width="20" height="14" rx="3" fill="#0a1650" />
        <rect x="143" y="96" width="14" height="66" rx="7" fill="#1b30a8" />
      </g>
      <g fill="#0a1650">
        <path d="M60 128V82l30-8v46" fill="none" stroke="#0a1650" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" />
        <ellipse cx="52" cy="130" rx="11" ry="8" />
        <ellipse cx="82" cy="122" rx="11" ry="8" />
      </g>
      <circle cx="222" cy="28" r="6" fill="#ff4fa3" />
      <circle cx="30" cy="22" r="4" fill="#fff" opacity=".8" />
      <path d="M205 120l4 8 8 4-8 4-4 8-4-8-8-4 8-4z" fill="#fff" opacity=".9" />
    </svg>
  );
}

// Text with an Edit button that turns into a small inline form.
function Editable({ value, placeholder = '—', onSave }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(value || '');
  if (!edit) {
    return (
      <span>
        {value || <i className="ad-dim">{placeholder}</i>}{' '}
        <button className="ad-link" onClick={() => { setV(value || ''); setEdit(true); }}>Edit</button>
      </span>
    );
  }
  const done = async (e) => { e.preventDefault(); await onSave(v.trim()); setEdit(false); };
  return (
    <form className="ad-inline" onSubmit={done}>
      <input value={v} onChange={(e) => setV(e.target.value)} maxLength={30} autoFocus />
      <button className="ad-btn small">Save</button>
      <button type="button" className="ad-link" onClick={() => setEdit(false)}>Cancel</button>
    </form>
  );
}

// Live countdown for one host row. "No limit" for rooms without an end time.
function TimeLeft({ expiresAt }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  if (!expiresAt) return <span className="ad-dim">No limit</span>;
  const left = new Date(expiresAt).getTime() - Date.now();
  return <span className={left < 10 * 60 * 1000 ? 'ad-warn' : ''}>{left <= 0 ? 'Ending…' : formatLeft(left)}</span>;
}

const copy = async (text) => { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } };

// ---------- confirm dialog + undo toasts (shared by every section) ----------
const UiCtx = createContext({ confirm: async () => false, toast: () => {} });
const useUi = () => useContext(UiCtx);
let toastSeq = 0;

// Modal asking "are you sure?". With typeToConfirm the admin has to type that text before the red button works.
function ConfirmDialog({ dlg, onClose }) {
  const [typed, setTyped] = useState('');
  const need = dlg.typeToConfirm ? String(dlg.typeToConfirm) : '';
  const ok = !need || typed.trim().toLowerCase() === need.toLowerCase();
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="ad-modal-back" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(false); }}>
      <form className="ad-modal" role="alertdialog" aria-modal="true" aria-labelledby="ad-dlg-title" aria-describedby="ad-dlg-body"
        onSubmit={(e) => { e.preventDefault(); if (ok) onClose(true); }}>
        <h3 id="ad-dlg-title">{dlg.title}</h3>
        <div id="ad-dlg-body" className="ad-modal-body">{dlg.body}</div>
        {need && (
          <label className="ad-modal-type">
            <span>Type <b className="ad-code small">{need}</b> to confirm</span>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus autoComplete="off" autoCapitalize="characters" spellCheck={false} />
          </label>
        )}
        <div className="ad-row ad-modal-actions">
          <button type="button" className="ad-btn ghost" onClick={() => onClose(false)} autoFocus={!need}>Cancel</button>
          <button className="ad-btn danger" disabled={!ok}>{dlg.confirmLabel || 'Confirm'}</button>
        </div>
      </form>
    </div>
  );
}

function UiProvider({ children }) {
  const [dlg, setDlg] = useState(null);
  const [toasts, setToasts] = useState([]);
  const confirm = useCallback((opts) => new Promise((resolve) => setDlg({ ...opts, resolve })), []);
  const close = useCallback((answer) => { setDlg((d) => { if (d) d.resolve(answer); return null; }); }, []);
  const drop = useCallback((id) => setToasts((l) => l.filter((x) => x.id !== id)), []);
  const toast = useCallback((text, opts = {}) => {
    const id = ++toastSeq;
    setToasts((l) => [...l.slice(-2), { id, text, ...opts }]);
    setTimeout(() => drop(id), opts.undo ? 9000 : 4500);
  }, [drop]);
  const undo = async (t) => {
    drop(t.id);
    try {
      const r = await t.undo();
      if (r === false) toast('Could not undo. See the message at the top of the page.', { tone: 'bad' });
    } catch (e) { toast(`Could not undo: ${e.message || e}`, { tone: 'bad' }); }
  };
  return (
    <UiCtx.Provider value={{ confirm, toast }}>
      {children}
      {dlg && <ConfirmDialog dlg={dlg} onClose={close} />}
      <div className="ad-toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`ad-toast ${t.tone || ''}`}>
            <span>{t.text}</span>
            {t.undo && <button type="button" className="ad-toast-undo" onClick={() => undo(t)}>Undo</button>}
            <button type="button" className="ad-toast-x" aria-label="Dismiss" onClick={() => drop(t.id)}>×</button>
          </div>
        ))}
      </div>
    </UiCtx.Provider>
  );
}

function Login({ onDone }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await admin.signIn(email.trim(), password); onDone(); } catch (x) { setErr(x.message); }
  };
  return (
    <main className="ad-auth">
      <div className="ad-auth-card">
        <div className="ad-brand"><span className="ad-brand-mark"><Icon name="mic" size={22} /></span><span className="ad-brand-name">TagayOke</span></div>
        <h1>Admin sign in</h1>
        <form onSubmit={submit} className="ad-form">
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          <button className="ad-btn">Sign in</button>
          {err && <p className="ad-err" role="alert">{err}</p>}
        </form>
      </div>
    </main>
  );
}

function Users({ code, users, live, act }) {
  const ui = useUi();
  const [name, setName] = useState('');
  const remove = async (u) => {
    const label = `${u.name} (host ${code})`;
    const snap = await admin.snapshotPerson(u.id).catch(() => null);
    const ok = await act(admin.deletePerson)(u.id, label);
    if (ok) ui.toast(`Removed ${u.name}`, snap ? { undo: () => act(admin.restorePerson)(snap, label) } : {});
  };
  return (
    <div className="ad-users">
      {!users.length && <p className="ad-dim">No phones have joined this host yet.</p>}
      {users.map((u) => (
        <div key={u.id} className="ad-user">
          <span className={`ad-dot ${live(u) ? 'on' : ''}`} title={live(u) ? 'Active' : 'Away'} />
          <Editable value={u.name} onSave={(v) => (v ? act(admin.renamePerson)(u.id, v) : null)} />
          <span className="ad-dim">joined {ago(u.joined_at)} · seen {ago(u.last_seen)}</span>
          <button className="ad-link danger" onClick={() => remove(u)}>Remove</button>
        </div>
      ))}
      <form className="ad-row" onSubmit={(e) => { e.preventDefault(); if (name.trim()) act(admin.addPerson)(code, name.trim()); setName(''); }}>
        <input placeholder="Add a user by name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />
        <button className="ad-btn small">Add user</button>
      </form>
    </div>
  );
}

const TV_PRESETS = ['Last song, please wrap up!', 'Please keep the volume down', 'Happy birthday! 🎂', 'Session ends in 10 minutes'];
const TV_SECONDS = [[10, '10 seconds'], [20, '20 seconds'], [30, '30 seconds'], [60, '1 minute']];

// Control one running host: see what is playing, skip or remove songs, remove users, put a message on the TV.
function Control({ room, users, live, act, setErr }) {
  const code = room.code;
  const ui = useUi();
  const [state, setState] = useState(null);   // { items, message, messagesReady }
  const [text, setText] = useState('');
  const [secs, setSecs] = useState(20);
  const [note, setNote] = useState('');
  const load = useCallback(() => admin.loadRoomQueue(code).then(setState).catch((e) => setErr(e.message || String(e))), [code, setErr]);
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [load]);

  const flash = (t) => { setNote(t); setTimeout(() => setNote(''), 2500); };
  const go = async (fn, ...a) => { await act(fn)(...a); await load(); };
  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setErr('');
    try { await admin.sendTvMessage(code, t, Number(secs)); setText(''); flash('Sent to the TV.'); await load(); } catch (x) { setErr(x.message || String(x)); }
  };
  const clear = async () => {
    setErr('');
    try { await admin.clearTvMessage(code); flash('Cleared from the TV.'); await load(); } catch (x) { setErr(x.message || String(x)); }
  };

  const items = state ? state.items : [];
  const playing = items.find((i) => i.status === 'playing');
  const queued = items.filter((i) => i.status === 'queued');
  const msg = state && state.message;
  const onTv = msg && msg.until && new Date(msg.until).getTime() > Date.now();

  const skip = async () => {
    if (!playing) return;
    const ok = await ui.confirm({
      title: 'Skip this song?',
      body: <p>“{playing.song.title}” stops on the TV right now and the next song starts.</p>,
      confirmLabel: 'Skip song',
    });
    if (ok) go(admin.skipSong, code, `${playing.song.title} · ${playing.singer}`);
  };
  const removeItem = async (i) => {
    const label = `${i.song.title} · ${i.singer}`;
    const snap = await admin.snapshotQueueItem(code, i.id).catch(() => null);
    const ok = await act(admin.removeQueueItem)(code, i.id, label);
    await load();
    if (ok) ui.toast(`Removed “${i.song.title}”`, snap ? { undo: async () => { const r = await act(admin.restoreQueueItem)(code, snap, label); await load(); return r; } } : {});
  };

  return (
    <div className="ad-ctl">
      <section className="ad-ctl-card">
        <h4 className="ad-ctl-h">Now playing</h4>
        {!state ? <p className="ad-dim">Loading…</p> : playing ? (
          <div className="ad-ctl-now">
            <span className="ad-chipno">#{playing.song.code}</span>
            <div className="ad-ctl-grow"><b>{playing.song.title}</b><small className="ad-dim">{playing.song.artist ? `${playing.song.artist} · ` : ''}sung by {playing.singer}</small></div>
            <button className="ad-btn danger small" onClick={skip}>Skip song</button>
          </div>
        ) : <p className="ad-dim">Nothing is playing{queued.length ? '. The next song starts by itself.' : '.'}</p>}
      </section>

      <section className="ad-ctl-card">
        <h4 className="ad-ctl-h">Up next <span className="ad-chipno">{queued.length}</span></h4>
        {!state ? <p className="ad-dim">Loading…</p> : !queued.length ? <p className="ad-dim">The queue is empty.</p> : (
          <ol className="ad-ctl-queue">
            {queued.map((i, n) => (
              <li key={i.id}>
                <span className="ad-ctl-pos">{n + 1}</span>
                <div className="ad-ctl-grow"><b>{i.song.title}</b><small className="ad-dim">#{i.song.code} · {i.singer}</small></div>
                <button className="ad-link danger" onClick={() => removeItem(i)}>Remove</button>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="ad-ctl-card">
        <h4 className="ad-ctl-h"><Icon name="megaphone" size={18} /> Message to the TV</h4>
        {state && !state.messagesReady && <p className="ad-dim">TV messages are not switched on yet. Run <code>supabase/session-control.sql</code> once in Supabase.</p>}
        <div className="ad-chips">
          {TV_PRESETS.map((t) => <button key={t} type="button" className="ad-chipbtn" onClick={() => setText(t)}>{t}</button>)}
        </div>
        <form className="ad-ctl-msg" onSubmit={send}>
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={120} placeholder="Short message for the TV" aria-label="Message for the TV" />
          <div className="ad-row">
            <select value={secs} onChange={(e) => setSecs(e.target.value)} aria-label="How long to show it">
              {TV_SECONDS.map(([s, t]) => <option key={s} value={s}>Show for {t}</option>)}
            </select>
            <button className="ad-btn small" disabled={!text.trim()}>Send to TV</button>
            {note && <span className="ad-dim" role="status">{note}</span>}
          </div>
        </form>
        {onTv && (
          <div className="ad-ontv">
            <span>On the TV now: <b>“{msg.text}”</b> (<TimeLeft expiresAt={msg.until} />)</span>
            <button className="ad-link danger" onClick={clear}>Clear now</button>
          </div>
        )}
        <small className="ad-dim">Up to 120 characters. It appears over the video, also in full screen.</small>
      </section>

      <section className="ad-ctl-card">
        <h4 className="ad-ctl-h">Users <span className="ad-chipno">{users.length}</span></h4>
        <Users code={code} users={users} live={live} act={act} />
      </section>
    </div>
  );
}

function Hosts({ data, act, filter, setErr }) {
  const ui = useUi();
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(0);  // 0 = unlimited
  const [open, setOpen] = useState(null);
  const [fresh, setFresh] = useState(null);    // the code just generated, shown big so it can be copied
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const makeCode = async (e) => {
    e.preventDefault(); setBusy(true);
    try {
      const label = name.trim();
      const code = await admin.createCode({ label, seconds: Number(minutes) ? Number(minutes) * 60 : null, maxUses: 1, redeemByHours: 0 });
      setFresh({ code, label, minutes: Number(minutes) }); setName('');
    } catch (x) { setErr(x.message || String(x)); } finally { setBusy(false); }
  };
  const now = Date.now();
  const usersOf = (c) => data.people.filter((p) => p.room_code === c);
  const queuedOf = (c) => data.queue.filter((q) => q.room_code === c).length;
  const live = (p) => now - new Date(p.last_seen).getTime() < ACTIVE_MS;
  const f = filter.trim().toLowerCase();
  const rooms = f ? data.rooms.filter((r) => `${r.code} ${r.name || ''}`.toLowerCase().includes(f)) : data.rooms;
  const endHost = async (r, us) => {
    const songs = queuedOf(r.code);
    const ok = await ui.confirm({
      title: `End host ${r.code}?`,
      body: (
        <>
          <p>This closes {r.name ? `“${r.name}”` : 'this room'} right away and stops the TV.</p>
          <p><b>{us.length}</b> user{us.length === 1 ? '' : 's'} and <b>{songs}</b> queued song{songs === 1 ? '' : 's'} will be removed. This cannot be undone.</p>
        </>
      ),
      typeToConfirm: r.code,
      confirmLabel: 'End host now',
    });
    if (ok) act(admin.deleteRoom)(r.code);
  };
  return (
    <>
      <form className="ad-row" onSubmit={makeCode}>
        <input placeholder="Host name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
        <select value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Time limit">
          <option value={0}>Unlimited time</option><option value={60}>1 hour</option><option value={120}>2 hours</option>
          <option value={180}>3 hours</option><option value={360}>6 hours</option>
        </select>
        <button className="ad-btn" disabled={busy}>Generate host code</button>
      </form>
      {fresh && (
        <div className="ad-fresh">
          <span className="ad-dim">{fresh.label ? `Code for ${fresh.label}: ` : ''}give this to the host. They type it under "Host on this screen". {fresh.minutes ? `Their ${fresh.minutes / 60}-hour clock starts when they enter it.` : 'It has no time limit.'}</span>
          <b className="ad-bigcode">{fresh.code}</b>
          <button className="ad-btn small" onClick={async () => { if (await copy(fresh.code)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }}>{copied ? 'Copied' : 'Copy'}</button>
          <button className="ad-link" onClick={() => setFresh(null)}>Dismiss</button>
        </div>
      )}
      {!data.rooms.length ? (
        <p className="ad-dim">No hosts right now. Generate a host code above and give it to the host; their room appears here once they enter it on "Host on this screen".</p>
      ) : !rooms.length ? (
        <p className="ad-dim">No hosts match "{filter}".</p>
      ) : (
        <ul className="ad-list">
          {rooms.map((r, i) => {
            const users = usersOf(r.code);
            return (
              <Fragment key={r.code}>
                <li className="ad-item">
                  <span className="ad-rank">{String(i + 1).padStart(2, '0')}</span>
                  <span className="ad-code">{r.code}</span>
                  <div className="ad-item-main">
                    <div className="ad-item-title"><Editable value={r.name} placeholder="Unnamed" onSave={(v) => act(admin.renameRoom)(r.code, v)} /></div>
                    <div className="ad-dim">Created {ago(r.created_at)}</div>
                  </div>
                  <div className="ad-stats">
                    <span title="Users"><Icon name="users" size={18} />{users.length} <small className="ad-dim">({users.filter(live).length} active)</small></span>
                    <span title="Songs queued"><Icon name="list" size={18} />{queuedOf(r.code)}</span>
                    <span title="Time left"><Icon name="clock" size={18} /><TimeLeft expiresAt={r.expires_at} /></span>
                  </div>
                  <div className="ad-actions">
                    <button className="ad-btn ghost small" title="Add 30 minutes" onClick={() => act(admin.extendRoom)(r.code, 30, r.expires_at)}>+30m</button>
                    <button className="ad-btn ghost small" title="Add 1 hour" onClick={() => act(admin.extendRoom)(r.code, 60, r.expires_at)}>+1h</button>
                    <button className="ad-btn ghost small" onClick={() => setOpen(open === r.code ? null : r.code)}>{open === r.code ? 'Hide' : 'Control'}</button>
                    <button className="ad-btn danger small" onClick={() => endHost(r, users)}>End now</button>
                  </div>
                </li>
                {open === r.code && <li className="ad-item-sub"><Control room={r} users={users} live={live} act={act} setErr={setErr} /></li>}
              </Fragment>
            );
          })}
        </ul>
      )}
    </>
  );
}

const codeSeconds = (c) => c.duration_seconds ?? (c.duration_minutes != null ? c.duration_minutes * 60 : null); // null = unlimited
const UNITS = [[1, 'Seconds'], [60, 'Minutes'], [3600, 'Hours'], [0, 'Unlimited']]; // [seconds in one unit, label]
const MAX_SECONDS = 24 * 3600;
const REDEEM_BY = [[0, 'Any time'], [1, 'Within 1 hour'], [24, 'Within 24 hours'], [168, 'Within 7 days']];

function codeStatus(c) {
  if (c.revoked) return ['Revoked', 'bad'];
  if (c.redeem_by && new Date(c.redeem_by) < new Date()) return ['Expired', 'bad'];
  if (c.uses >= c.max_uses) return ['Used up', 'dim'];
  return ['Ready', 'ok'];
}

function Codes({ setErr, filter }) {
  const ui = useUi();
  const [rows, setRows] = useState([]);
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('3');   // typed by the admin
  const [unit, setUnit] = useState(3600);       // seconds per unit: 1 = seconds, 60 = minutes, 3600 = hours
  const [maxUses, setMaxUses] = useState(1);
  const [redeemBy, setRedeemBy] = useState(0);
  const [fresh, setFresh] = useState('');   // the code just created, shown big so it can be copied
  const [copied, setCopied] = useState('');
  const load = useCallback(() => admin.listCodes().then(setRows).catch((e) => setErr(e.message || String(e))), [setErr]);
  useEffect(() => { load(); }, [load]);
  const run = async (fn) => { setErr(''); try { await fn(); await load(); } catch (e) { setErr(e.message || String(e)); } };
  const removeCode = async (c) => {
    const ok = await ui.confirm({
      title: `Delete code ${c.code}?`,
      body: (
        <>
          <p>{c.label ? `“${c.label}”` : 'This code'} disappears from the list and can no longer be used.</p>
          <p>Sessions already running keep going until their time is up. Choose Revoke instead if you may want the code back.</p>
        </>
      ),
      confirmLabel: 'Delete code',
    });
    if (ok) run(() => admin.deleteCode(c.id, c.code));
  };
  const flashCopy = async (code) => { if (await copy(code)) { setCopied(code); setTimeout(() => setCopied(''), 1500); } };
  const f = filter.trim().toLowerCase();
  const shown = f ? rows.filter((c) => `${c.code} ${c.label || ''}`.toLowerCase().includes(f)) : rows;

  const create = (e) => {
    e.preventDefault();
    const seconds = Number(unit) === 0 ? null : Math.round(Number(amount) * Number(unit));
    if (seconds !== null && !(seconds >= 1 && seconds <= MAX_SECONDS)) { setErr('Session length must be between 1 second and 24 hours.'); return; }
    return run(async () => {
      const code = await admin.createCode({ label: label.trim(), seconds, maxUses: Number(maxUses), redeemByHours: Number(redeemBy) });
      setFresh(code); setLabel('');
    });
  };

  return (
    <>
      <form id="ad-new-code" className="ad-form ad-songform" onSubmit={create}>
        <strong>New host access code</strong>
        <label>Label (who is it for?)<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Maria's birthday" maxLength={40} /></label>
        <label>Session length
          <span className="ad-duration">
            <input type="number" min="1" step="any" inputMode="decimal" value={unit === 0 ? '' : amount} onChange={(e) => setAmount(e.target.value)} placeholder={unit === 0 ? 'No time limit' : 'e.g. 30'} disabled={unit === 0} required={unit !== 0} />
            <select value={unit} onChange={(e) => setUnit(Number(e.target.value))} aria-label="Unit of time">{UNITS.map(([s, t]) => <option key={s} value={s}>{t}</option>)}</select>
          </span>
        </label>
        <label>Times it can be used<input type="number" min={1} max={50} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} /></label>
        <label>Code must be used<select value={redeemBy} onChange={(e) => setRedeemBy(e.target.value)}>{REDEEM_BY.map(([h, t]) => <option key={h} value={h}>{t}</option>)}</select></label>
        <div className="ad-row"><button className="ad-btn">Generate code</button></div>
      </form>
      {fresh && (
        <div className="ad-fresh">
          <span className="ad-dim">Give this code to the host. Any session clock starts when they enter it.</span>
          <b className="ad-bigcode">{fresh}</b>
          <button className="ad-btn small" onClick={() => flashCopy(fresh)}>{copied === fresh ? 'Copied' : 'Copy'}</button>
        </div>
      )}
      <div className="ad-scroll">
        <table className="ad-table">
          <thead><tr><th>Code</th><th>Label</th><th>Length</th><th>Used</th><th>Status</th><th>Created</th><th /></tr></thead>
          <tbody>
            {shown.map((c) => {
              const [st, tone] = codeStatus(c);
              return (
                <tr key={c.id}>
                  <td><span className="ad-code">{c.code}</span></td>
                  <td data-label="Label">{c.label || <span className="ad-dim">—</span>}</td>
                  <td data-label="Length">{codeSeconds(c) == null ? 'Unlimited' : formatDuration(codeSeconds(c))}</td>
                  <td data-label="Used">{c.uses}/{c.max_uses}</td>
                  <td data-label="Status"><span className={`ad-status ${tone}`}>{st}</span></td>
                  <td data-label="Created">{ago(c.created_at)}</td>
                  <td className="ad-actions">
                    <button className="ad-btn ghost small" onClick={() => flashCopy(c.code)}>{copied === c.code ? 'Copied' : 'Copy'}</button>
                    <button className="ad-btn ghost small" onClick={() => run(() => admin.setCodeRevoked(c.id, !c.revoked, c.code))}>{c.revoked ? 'Restore' : 'Revoke'}</button>
                    <button className="ad-btn danger small" onClick={() => removeCode(c)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!shown.length && <p className="ad-dim">{rows.length ? `No access codes match "${filter}".` : 'No access codes yet. Generate one above, then give it to whoever will host.'}</p>}
      </div>
    </>
  );
}

// ---------- Reports & analytics ----------
const DAYS = 14;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

// Horizontal bars drawn with plain CSS (no chart library).
function Bars({ rows, empty = 'Nothing to show yet.' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="ad-dim">{empty}</p>;
  return (
    <ul className="ad-bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="ad-bar-label" title={r.label}>{r.label}</span>
          <span className="ad-bar-track"><span className={`ad-bar-fill ${r.tone || ''}`} style={{ width: `${Math.max(3, (r.value / max) * 100)}%` }} /></span>
          <b className="ad-bar-val">{r.value}</b>
        </li>
      ))}
    </ul>
  );
}

// Column chart for a daily series.
function Columns({ days, label = 'Access codes created per day' }) {
  const max = Math.max(1, ...days.map((d) => d.value));
  return (
    <div className="ad-cols" role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
      {days.map((d) => (
        <div key={d.key} className="ad-col" title={`${d.label}: ${d.value}`}>
          <b>{d.value || ''}</b>
          <span className="ad-col-bar" style={{ height: `${d.value ? Math.max(6, (d.value / max) * 100) : 2}%` }} />
          <small>{d.short}</small>
        </div>
      ))}
    </div>
  );
}

const hourName = (h) => `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`;
const hourShort = (h) => `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`;
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const INSIGHT_RANGES = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [0, 'All time']];

// What people actually sing and when. Numbers come from one database call (admin_insights), so this never downloads raw rows.
function Insights({ setErr }) {
  const [days, setDays] = useState(30);
  const [r, setR] = useState(null);
  useEffect(() => {
    let alive = true;
    setR(null);
    admin.loadInsights(days).then((x) => alive && setR(x)).catch((e) => alive && setErr(e.message || String(e)));
    return () => { alive = false; };
  }, [days, setErr]);

  const head = (
    <div className="ad-rhead">
      <h3><Icon name="mic" size={18} /> Karaoke insights</h3>
      <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Insights time range">
        {INSIGHT_RANGES.map(([d, t]) => <option key={d} value={d}>{t}</option>)}
      </select>
    </div>
  );
  if (admin.DEMO) return <section className="ad-rcard">{head}<p className="ad-dim">Insights are recorded in Supabase. Connect it to see them here.</p></section>;
  if (!r) return <section className="ad-rcard">{head}<p className="ad-dim">Loading…</p></section>;
  if (r.missing) return <section className="ad-rcard">{head}<p className="ad-notice">Insights are not set up yet. Run <code>supabase/session-insights.sql</code> once in the Supabase SQL editor, then reload this page. Songs are counted from that moment on.</p></section>;
  if (!r.songs_requested) return <section className="ad-rcard">{head}<p className="ad-dim">No songs recorded in this range yet. Every song a singer queues from now on is counted here, even after the session ends.</p></section>;

  const perSession = r.sessions_with_songs ? (r.songs_sung / r.sessions_with_songs).toFixed(1) : '—';
  const topHour = r.by_hour.indexOf(Math.max(...r.by_hour));
  const topDow = r.by_dow.indexOf(Math.max(...r.by_dow));
  const hours = r.by_hour.map((v, h) => ({ key: String(h), value: v, label: `${hourName(h)}: ${v} song${v === 1 ? '' : 's'}`, short: h % 3 === 0 ? hourShort(h) : '' }));

  return (
    <section className="ad-rcard">
      {head}
      <div className="ad-kpis">
        <div className="ad-kpi"><b>{r.songs_sung}</b><span>Songs sung ({r.songs_requested} requested)</span></div>
        <div className="ad-kpi"><b>{perSession}</b><span>Songs per session</span></div>
        <div className="ad-kpi"><b>{r.peak_users_max || '—'}</b><span>Most phones at once{r.peak_users_avg ? ` (avg peak ${r.peak_users_avg})` : ''}</span></div>
        <div className="ad-kpi"><b>{r.by_hour[topHour] ? hourName(topHour) : '—'}</b><span>Busiest hour{r.by_dow[topDow] ? ` · ${DOW_LONG[topDow]}s are busiest` : ''}</span></div>
      </div>

      <div className="ad-rgrid ad-insight-grid">
        <div>
          <h4 className="ad-rsub">Most requested songs</h4>
          <Bars rows={r.top_songs.map((s) => ({ label: `#${s.code ?? '?'} ${s.title || 'Unknown'}${s.artist ? ` · ${s.artist}` : ''}`, value: s.requested }))} empty="No songs yet." />
        </div>
        <div>
          <h4 className="ad-rsub">Top singers (songs sung)</h4>
          <Bars rows={r.top_singers.map((s) => ({ label: s.singer, value: s.sung, tone: 'pink' }))} empty="No singers yet." />
        </div>
        <div>
          <h4 className="ad-rsub">Songs by day of the week</h4>
          <Bars rows={DOW_SHORT.map((d, i) => ({ label: d, value: r.by_dow[i] || 0 }))} />
        </div>
      </div>

      <h4 className="ad-rsub">Songs by hour of the day</h4>
      <Columns days={hours} label="Songs sung by hour of the day" />
      <p className="ad-dim">Times are in your browser's time zone. A song counts when it starts playing; "requested" also includes songs that were removed or never reached.</p>
    </section>
  );
}

function Reports({ data, setErr }) {
  const [rep, setRep] = useState(null);
  useEffect(() => {
    let alive = true;
    const load = () => admin.loadReports().then((r) => alive && setRep(r)).catch((e) => setErr(e.message || String(e)));
    load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [setErr]);

  if (!rep || !data) return <p className="ad-dim">Loading the numbers…</p>;

  const now = Date.now();
  const { codes, songs } = rep;
  const used = codes.filter((c) => c.uses > 0);
  const sessions = codes.reduce((n, c) => n + (c.uses || 0), 0);
  const secs = codeSeconds; // null = unlimited
  const timedSessions = codes.reduce((n, c) => n + (secs(c) == null ? 0 : (c.uses || 0)), 0);
  const unlimitedSessions = sessions - timedSessions;
  const hosted = codes.reduce((n, c) => n + (secs(c) == null ? 0 : (c.uses || 0) * secs(c)), 0);
  const avgLen = timedSessions ? hosted / timedSessions : 0;
  const revoked = codes.filter((c) => c.revoked).length;
  const lapsed = codes.filter((c) => !c.revoked && c.redeem_by && new Date(c.redeem_by) < now && c.uses < c.max_uses).length;
  const ready = codes.filter((c) => !c.revoked && !(c.redeem_by && new Date(c.redeem_by) < now) && c.uses < c.max_uses).length;

  // codes created per day, last 14 days
  const perDay = countDays(codes);
  function countDays(list) {
    const m = {};
    list.forEach((c) => { const k = dayKey(c.created_at); m[k] = (m[k] || 0) + 1; });
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(now - (DAYS - 1 - i) * 86400000);
      return { key: dayKey(d), value: m[dayKey(d)] || 0, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), short: String(d.getDate()) };
    });
  }
  const last14 = perDay.reduce((n, d) => n + d.value, 0);

  // live: users per host + queue state
  const live = (p) => now - new Date(p.last_seen).getTime() < ACTIVE_MS;
  const perHost = data.rooms.map((r) => ({ label: r.name || r.code, value: data.people.filter((p) => p.room_code === r.code).length }))
    .sort((a, b) => b.value - a.value).slice(0, 6);
  const playing = data.queue.filter((q) => q.status === 'playing').length;
  const waiting = data.queue.filter((q) => q.status === 'queued').length;
  const activeUsers = data.people.filter(live).length;

  const langs = Object.entries(songs.byLanguage).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  const sources = Object.entries(songs.bySource).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value, tone: 'pink' }));

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['code', 'label', 'length_seconds', 'uses', 'max_uses', 'revoked', 'redeem_by', 'created_at', 'last_used_at'];
    const lines = [head.join(',')].concat(codes.map((c) => [c.code, c.label, secs(c) == null ? 'unlimited' : secs(c), c.uses, c.max_uses, c.revoked, c.redeem_by, c.created_at, c.last_used_at].map(esc).join(',')));
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `tagayoke-access-codes-${dayKey(now)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="ad-reports">
      <div className="ad-kpis">
        <div className="ad-kpi"><b>{sessions}</b><span>Sessions started</span></div>
        <div className="ad-kpi"><b>{pct(used.length, codes.length)}%</b><span>Codes redeemed ({used.length}/{codes.length})</span></div>
        <div className="ad-kpi"><b>{formatDuration(hosted)}</b><span>Timed hosting granted{unlimitedSessions ? ` (+${unlimitedSessions} unlimited)` : ''}</span></div>
        <div className="ad-kpi"><b>{formatDuration(avgLen)}</b><span>Average timed session</span></div>
      </div>

      <section className="ad-rcard">
        <div className="ad-rhead"><h3>Access codes created</h3><span className="ad-dim">Last {DAYS} days · {last14} total</span></div>
        <Columns days={perDay} />
      </section>

      <div className="ad-rgrid">
        <section className="ad-rcard">
          <div className="ad-rhead"><h3>Access code status</h3></div>
          <Bars rows={[
            { label: 'Ready to use', value: ready },
            { label: 'Used up', value: codes.filter((c) => !c.revoked && c.uses >= c.max_uses).length },
            { label: 'Lapsed (not used in time)', value: lapsed, tone: 'pink' },
            { label: 'Revoked', value: revoked, tone: 'pink' },
          ]} empty="No access codes yet." />
        </section>

        <section className="ad-rcard">
          <div className="ad-rhead"><h3>Right now</h3><span className="ad-dim">Live</span></div>
          <div className="ad-mini2">
            <div><b>{data.rooms.length}</b><span>Hosts</span></div>
            <div><b>{activeUsers}<small>/{data.people.length}</small></b><span>Active users</span></div>
            <div><b>{playing}</b><span>Singing</span></div>
            <div><b>{waiting}</b><span>Waiting in queue</span></div>
          </div>
        </section>

        <section className="ad-rcard">
          <div className="ad-rhead"><h3>Users per host</h3><span className="ad-dim">Top 6 live</span></div>
          <Bars rows={perHost} empty="No hosts running." />
        </section>

        <section className="ad-rcard">
          <div className="ad-rhead"><h3>Song catalog</h3><span className="ad-dim">{songs.total} songs · {pct(songs.withVideo, songs.total)}% have a video</span></div>
          <Bars rows={langs} empty="No songs." />
          <h4 className="ad-rsub">Where songs came from</h4>
          <Bars rows={sources} empty="No songs." />
        </section>
      </div>

      <Insights setErr={setErr} />

      <div className="ad-row ad-rfoot">
        <button className="ad-btn ghost small" onClick={exportCsv} disabled={!codes.length}><Icon name="download" size={16} />Export access codes (CSV)</button>
        <span className="ad-dim">Hosts and their queues are removed when a session ends, so live figures only show what is running now. Session history comes from access codes.</span>
      </div>
    </div>
  );
}

// ---------- Settings management ----------
function Settings({ setErr }) {
  const [saved, setSaved] = useState(null);       // what is stored (and shown on the landing page when visible)
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    getAnnouncement().then((a) => { setSaved(a); setTitle(a.title); setMessage(a.message); }).catch((e) => setErr(e.message || String(e)));
  }, [setErr]);

  const flash = (t) => { setNote(t); setTimeout(() => setNote(''), 2500); };
  const write = async (next, done) => {
    setErr(''); setBusy(true);
    try { setSaved(await saveAnnouncement(next)); flash(done); } catch (e) { setErr(e.message || String(e)); } finally { setBusy(false); }
  };

  if (!saved) return <p className="ad-dim">Loading settings…</p>;
  const dirty = title.trim() !== (saved.title || '') || message.trim() !== saved.message;
  const visible = saved.visible;
  const toggle = () => {
    if (!visible && !saved.message.trim()) return setErr('Write and save a message first, then make it visible.');
    return write({ ...saved, visible: !visible }, visible ? 'Hidden from the landing page.' : 'Now visible on the landing page.');
  };

  return (
    <div className="ad-settings">
      <section className="ad-rcard">
        <div className="ad-rhead">
          <h3><Icon name="megaphone" size={18} /> Announcement</h3>
          <span className={`ad-status ${visible ? 'ok' : 'dim'}`}>{visible ? 'Visible' : 'Hidden'}</span>
        </div>
        <p className="ad-dim ad-lead">Shown on the landing page as a dropdown. Guests tap it to read the message.</p>

        <form className="ad-form" onSubmit={(e) => { e.preventDefault(); write({ title, message, visible }, 'Saved.'); }}>
          <label>Heading
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder="Announcement!" />
          </label>
          <label>Message
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={5} placeholder="e.g. We are closed on Dec 25. Happy holidays!" />
            <small className="ad-dim ad-count">{message.length}/500</small>
          </label>
          <div className="ad-row">
            <button className="ad-btn" disabled={busy || !dirty || !message.trim()}>Save message</button>
            <button type="button" className={`ad-btn ${visible ? 'danger' : 'dark'}`} onClick={toggle} disabled={busy} aria-pressed={visible}>
              {visible ? 'Hide announcement' : 'Make visible'}
            </button>
            {dirty && <span className="ad-warn">Unsaved changes</span>}
            {note && <span className="ad-dim" role="status">{note}</span>}
          </div>
        </form>

        <h4 className="ad-rsub">Preview</h4>
        <div className={`ad-preview ${visible ? '' : 'off'}`}>
          {message.trim()
            ? <AnnouncementView key={`${title}|${message}`} title={title.trim() || 'Announcement!'} message={message.trim()} defaultOpen />
            : <p className="ad-dim">Nothing to preview yet.</p>}
          {!visible && message.trim() && <p className="ad-dim ad-prev-note">Hidden: guests do not see this yet.</p>}
        </div>
      </section>
      <ActivityLog setErr={setErr} />
    </div>
  );
}

// ---------- who did what ----------
const ACTION_LABEL = {
  end_host: 'Ended a host', create_code: 'Created a code', revoke_code: 'Revoked a code', restore_code: 'Restored a code', delete_code: 'Deleted a code',
  remove_user: 'Removed a user', restore_user: 'Brought a user back', remove_song: 'Removed a queued song', restore_song: 'Brought a song back',
  skip_song: 'Skipped a song', tv_message: 'Sent a TV message', tv_clear: 'Cleared the TV message', delete_catalog_song: 'Deleted from the catalog',
};
const stamp = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function ActivityLog({ setErr }) {
  const [log, setLog] = useState(null);
  const load = useCallback(() => admin.listLog(50).then(setLog).catch((e) => setErr(e.message || String(e))), [setErr]);
  useEffect(() => { load(); }, [load]);
  return (
    <section className="ad-rcard ad-logcard">
      <div className="ad-rhead"><h3><Icon name="list" size={18} /> Admin activity</h3><button type="button" className="ad-link" onClick={load}>Refresh</button></div>
      {!log ? <p className="ad-dim">Loading…</p> : log.missing ? (
        <p className="ad-notice">The activity log is not set up yet. Run <code>supabase/admin-log.sql</code> once in the Supabase SQL editor, then refresh.</p>
      ) : !log.rows.length ? <p className="ad-dim">Nothing yet. Ending hosts, deleting codes, removing users and similar actions will appear here.</p> : (
        <div className="ad-scroll">
          <table className="ad-table ad-logtable">
            <thead><tr><th>When</th><th>Who</th><th>What</th><th>Details</th></tr></thead>
            <tbody>
              {log.rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="When">{stamp(r.at)}</td>
                  <td data-label="Who">{r.admin_email || <span className="ad-dim">—</span>}</td>
                  <td data-label="What">{ACTION_LABEL[r.action] || r.action}</td>
                  <td data-label="Details">{[r.target, r.detail].filter(Boolean).join(' · ') || <span className="ad-dim">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const NAV = [
  ['hosts', 'Hosts and users', 'grid'],
  ['codes', 'Access codes', 'key'],
  ['songs', 'Songs', 'music'],
  ['history', 'Session history', 'clock'],
  ['reports', 'Reports & analytics', 'chart'],
  ['settings', 'Settings', 'gear'],
];
const PANEL = {
  hosts: ['Live hosts', 'Rooms running right now. Press Control to manage one'],
  codes: ['Access codes', 'Codes that let someone start hosting'],
  songs: ['Song catalog', 'Add, edit, import and check songs'],
  history: ['Session history', 'Every hosted session, even after it ended'],
  reports: ['Reports & analytics', 'How the app is being used'],
  settings: ['Settings', 'Announcement and app-wide options'],
};
const SEARCH_HINT = { hosts: 'Search hosts by code or name', codes: 'Search codes or labels', songs: 'Search number, title or artist', history: 'Search by host, room or access code', reports: 'Search is not used here', settings: 'Search is not used here' };

function Dashboard({ onSignOut }) {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('hosts');
  const [search, setSearch] = useState('');
  const refresh = useCallback(() => admin.loadOverview().then(setData).catch((e) => setErr(e.message)), []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, [refresh]);
  const act = (fn) => async (...a) => { setErr(''); try { await fn(...a); await refresh(); return true; } catch (e) { setErr(e.message || String(e)); return false; } };
  const go = (t) => { setTab(t); setSearch(''); };

  const now = Date.now();
  const activeUsers = data ? data.people.filter((p) => now - new Date(p.last_seen).getTime() < ACTIVE_MS).length : 0;
  const timed = data ? data.rooms.filter((r) => r.expires_at).sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at)).slice(0, 5) : [];
  const [title, sub] = PANEL[tab];

  return (
    <main className="ad-shell">
      {/* ---------- sidebar ---------- */}
      <aside className="ad-side">
        <div className="ad-brand"><span className="ad-brand-mark"><Icon name="mic" size={22} /></span><span className="ad-brand-name">TagayOke</span></div>
        <nav className="ad-nav" role="tablist" aria-label="Admin sections">
          {NAV.map(([id, text, icon]) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => go(id)}><Icon name={icon} />{text}</button>
          ))}
        </nav>
        <div className="ad-side-foot">
          <button className="ad-navlink" onClick={() => nav('/')}><Icon name="back" />Back to app</button>
          {!admin.DEMO && <button className="ad-navlink" onClick={onSignOut}><Icon name="out" />Sign out</button>}
          <p>Updates every 5 seconds</p>
        </div>
      </aside>

      <div className="ad-main">
        {/* ---------- top bar ---------- */}
        <header className="ad-topbar">
          <label className="ad-search">
            <Icon name="search" size={18} />
            <input type="search" placeholder={SEARCH_HINT[tab]} value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" disabled={tab === 'reports' || tab === 'settings'} />
          </label>
          <div className="ad-top-right">
            {admin.DEMO && <span className="ad-badge">Demo mode</span>}
            <span className="ad-me"><span className="ad-avatar">A</span><span className="ad-me-name">Admin</span></span>
          </div>
        </header>

        {/* ---------- content panel ---------- */}
        <div className="ad-panelwrap">
          {err && <p className="ad-err" role="alert">{err}</p>}
          <div className="ad-grid">
            <div className="ad-left">
              <section className="ad-hero">
                <div className="ad-hero-text">
                  <h1>Hello, Admin!</h1>
                  <p>
                    {data
                      ? `${data.rooms.length} host${data.rooms.length === 1 ? ' is' : 's are'} running with ${activeUsers} active ${activeUsers === 1 ? 'singer' : 'singers'} and ${data.queue.length} song${data.queue.length === 1 ? '' : 's'} in the queue.`
                      : 'Loading the latest numbers…'}
                  </p>
                  <button className="ad-btn dark" onClick={() => { go('codes'); setTimeout(() => document.getElementById('ad-new-code')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); }}><Icon name="plus" size={18} />New access code</button>
                </div>
                <HeroArt />
              </section>

              <section className="ad-card-panel">
                <div className="ad-panel-head"><h2>{title}</h2><span className="ad-dim">{sub}</span></div>
                {!data && tab === 'hosts' && <p className="ad-dim">Loading…</p>}
                {data && tab === 'hosts' && <Hosts data={data} act={act} filter={search} setErr={setErr} />}
                {tab === 'codes' && <Codes setErr={setErr} filter={search} />}
                {tab === 'reports' && <Reports data={data} setErr={setErr} />}
                {tab === 'settings' && <Settings setErr={setErr} />}
                {tab === 'songs' && (admin.DEMO ? <p className="ad-dim">Songs are managed in Supabase. Connect it to edit the catalog here.</p> : <Songs setErr={setErr} q={search} />)}
                {tab === 'history' && <History setErr={setErr} filter={search} />}
              </section>
            </div>

            <div className="ad-right">
              {data && (
                <>
                  <div className="ad-stat s-blue"><span className="ad-stat-ico"><Icon name="grid" /></span><div><b>{data.rooms.length}</b><span>Hosts</span></div></div>
                  <div className="ad-stat s-pink"><span className="ad-stat-ico"><Icon name="users" /></span><div><b>{activeUsers}</b><span>Active users</span></div></div>
                  <div className="ad-stat s-yellow"><span className="ad-stat-ico"><Icon name="list" /></span><div><b>{data.queue.length}</b><span>Songs queued</span></div></div>
                </>
              )}
              <section className="ad-side-panel">
                <div className="ad-side-head"><h2>Ending soon</h2><span>Timed hosts</span></div>
                {data && !timed.length && <p className="ad-dim ad-pad">No timed hosts running.</p>}
                <ul className="ad-timeline">
                  {timed.map((r) => (
                    <li key={r.code}>
                      <span className="ad-when"><TimeLeft expiresAt={r.expires_at} /></span>
                      <span className="ad-what"><b>{r.name || 'Unnamed'}</b><small className="ad-dim">Code {r.code}</small></span>
                    </li>
                  ))}
                </ul>
                {data && (
                  <div className="ad-mini">
                    <div><b>{data.people.length}</b><span>Total users</span></div>
                    <div><b>{data.songCount}</b><span>Songs in catalog</span></div>
                  </div>
                )}
                <p className="ad-dim ad-pad ad-note">A user is "active" if their phone checked in within the last 2 minutes.</p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Admin() {
  const [gate, setGate] = useState('checking'); // checking | login | denied | ok
  const check = useCallback(async () => {
    try {
      if (admin.DEMO) return setGate('ok');
      if (!(await admin.getSession())) return setGate('login');
      return setGate((await admin.isAdmin()) ? 'ok' : 'denied');
    } catch { return setGate('login'); }
  }, []);
  useEffect(() => { check(); }, [check]);
  const out = async () => { await admin.signOut(); setGate('login'); };

  if (gate === 'checking') return <main className="ad-auth"><p className="ad-dim ad-onblue">Checking access…</p></main>;
  if (gate === 'login') return <Login onDone={check} />;
  if (gate === 'denied') {
    return (
      <main className="ad-auth">
        <div className="ad-auth-card">
          <h1>No access</h1>
          <p className="ad-dim">This account is not an admin. Add its user to the admins table in Supabase, then sign in again.</p>
          <button className="ad-btn ghost" onClick={out}>Sign out</button>
        </div>
      </main>
    );
  }
  return <UiProvider><Dashboard onSignOut={out} /></UiProvider>;
}
