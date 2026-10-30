import { Fragment, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as admin from '../services/admin';
import { parseYouTubeId } from '../utils/youtube';
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

function Login({ onDone }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try { await admin.signIn(email.trim(), password); onDone(); } catch (x) { setErr(x.message); }
  };
  return (
    <main className="ad ad-narrow">
      <h1>TagayOke Admin</h1>
      <form onSubmit={submit} className="ad-form">
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
        <button className="ad-btn">Sign in</button>
        {err && <p className="ad-err" role="alert">{err}</p>}
      </form>
    </main>
  );
}

function Users({ code, users, live, act }) {
  const [name, setName] = useState('');
  return (
    <div className="ad-users">
      {!users.length && <p className="ad-dim">No phones have joined this host yet.</p>}
      {users.map((u) => (
        <div key={u.id} className="ad-user">
          <span className={`ad-dot ${live(u) ? 'on' : ''}`} title={live(u) ? 'Active' : 'Away'} />
          <Editable value={u.name} onSave={(v) => (v ? act(admin.renamePerson)(u.id, v) : null)} />
          <span className="ad-dim">joined {ago(u.joined_at)} · seen {ago(u.last_seen)}</span>
          <button className="ad-link danger" onClick={() => act(admin.deletePerson)(u.id)}>Remove</button>
        </div>
      ))}
      <form className="ad-row" onSubmit={(e) => { e.preventDefault(); if (name.trim()) act(admin.addPerson)(code, name.trim()); setName(''); }}>
        <input placeholder="Add a user by name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} />
        <button className="ad-btn small">Add user</button>
      </form>
    </div>
  );
}

function Hosts({ data, act }) {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(0);
  const [open, setOpen] = useState(null);
  const now = Date.now();
  const usersOf = (c) => data.people.filter((p) => p.room_code === c);
  const queuedOf = (c) => data.queue.filter((q) => q.room_code === c).length;
  const live = (p) => now - new Date(p.last_seen).getTime() < ACTIVE_MS;
  return (
    <>
      <form className="ad-row" onSubmit={(e) => { e.preventDefault(); act(admin.createRoom)(name.trim(), Number(minutes)); setName(''); }}>
        <input placeholder="New host name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} />
        <select value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Time limit">
          <option value={0}>No time limit</option><option value={60}>1 hour</option><option value={120}>2 hours</option>
          <option value={180}>3 hours</option><option value={360}>6 hours</option>
        </select>
        <button className="ad-btn">Create host</button>
      </form>
      {!data.rooms.length ? (
        <p className="ad-dim">No hosts right now. One appears when someone enters an access code on "Host on this screen".</p>
      ) : (
        <div className="ad-scroll">
          <table className="ad-table">
            <thead><tr><th>Code</th><th>Name</th><th>Users</th><th>Queue</th><th>Time left</th><th>Created</th><th /></tr></thead>
            <tbody>
              {data.rooms.map((r) => {
                const users = usersOf(r.code);
                return (
                  <Fragment key={r.code}>
                    <tr>
                      <td><span className="ad-code">{r.code}</span></td>
                      <td><Editable value={r.name} placeholder="Unnamed" onSave={(v) => act(admin.renameRoom)(r.code, v)} /></td>
                      <td>{users.length} <span className="ad-dim">({users.filter(live).length} active)</span></td>
                      <td>{queuedOf(r.code)}</td>
                      <td><TimeLeft expiresAt={r.expires_at} /></td>
                      <td>{ago(r.created_at)}</td>
                      <td className="ad-actions">
                        <button className="ad-btn ghost small" title="Add 30 minutes" onClick={() => act(admin.extendRoom)(r.code, 30, r.expires_at)}>+30m</button>
                        <button className="ad-btn ghost small" title="Add 1 hour" onClick={() => act(admin.extendRoom)(r.code, 60, r.expires_at)}>+1h</button>
                        <button className="ad-btn ghost small" onClick={() => setOpen(open === r.code ? null : r.code)}>{open === r.code ? 'Hide users' : 'Users'}</button>
                        <button className="ad-btn danger small" onClick={() => window.confirm(`End host ${r.code} now? This closes the room and removes its queue and users.`) && act(admin.deleteRoom)(r.code)}>End now</button>
                      </td>
                    </tr>
                    {open === r.code && <tr className="ad-sub"><td colSpan={7}><Users code={r.code} users={users} live={live} act={act} /></td></tr>}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

const UNITS = [[1, 'Seconds'], [60, 'Minutes'], [3600, 'Hours']]; // [seconds in one unit, label]
const MAX_SECONDS = 24 * 3600;
const REDEEM_BY = [[0, 'Any time'], [1, 'Within 1 hour'], [24, 'Within 24 hours'], [168, 'Within 7 days']];

function codeStatus(c) {
  if (c.revoked) return ['Revoked', 'bad'];
  if (c.redeem_by && new Date(c.redeem_by) < new Date()) return ['Expired', 'bad'];
  if (c.uses >= c.max_uses) return ['Used up', 'dim'];
  return ['Ready', 'ok'];
}

function Codes({ setErr }) {
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
  const flashCopy = async (code) => { if (await copy(code)) { setCopied(code); setTimeout(() => setCopied(''), 1500); } };

  const create = (e) => {
    e.preventDefault();
    const seconds = Math.round(Number(amount) * Number(unit));
    if (!(seconds >= 1 && seconds <= MAX_SECONDS)) { setErr('Session length must be between 1 second and 24 hours.'); return; }
    return run(async () => {
      const code = await admin.createCode({ label: label.trim(), seconds, maxUses: Number(maxUses), redeemByHours: Number(redeemBy) });
      setFresh(code); setLabel('');
    });
  };

  return (
    <>
      <form className="ad-form ad-songform" onSubmit={create}>
        <strong>New host access code</strong>
        <label>Label (who is it for?)<input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Maria's birthday" maxLength={40} /></label>
        <label>Session length
          <span className="ad-duration">
            <input type="number" min="1" step="any" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 30" required />
            <select value={unit} onChange={(e) => setUnit(Number(e.target.value))} aria-label="Unit of time">{UNITS.map(([s, t]) => <option key={s} value={s}>{t}</option>)}</select>
          </span>
        </label>
        <label>Times it can be used<input type="number" min={1} max={50} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} /></label>
        <label>Code must be used<select value={redeemBy} onChange={(e) => setRedeemBy(e.target.value)}>{REDEEM_BY.map(([h, t]) => <option key={h} value={h}>{t}</option>)}</select></label>
        <div className="ad-row"><button className="ad-btn">Generate code</button></div>
      </form>
      {fresh && (
        <div className="ad-fresh">
          <span className="ad-dim">Give this code to the host. The clock starts when they enter it.</span>
          <b className="ad-bigcode">{fresh}</b>
          <button className="ad-btn small" onClick={() => flashCopy(fresh)}>{copied === fresh ? 'Copied' : 'Copy'}</button>
        </div>
      )}
      <div className="ad-scroll">
        <table className="ad-table">
          <thead><tr><th>Code</th><th>Label</th><th>Length</th><th>Used</th><th>Status</th><th>Created</th><th /></tr></thead>
          <tbody>
            {rows.map((c) => {
              const [st, tone] = codeStatus(c);
              return (
                <tr key={c.id}>
                  <td><span className="ad-code">{c.code}</span></td>
                  <td>{c.label || <span className="ad-dim">—</span>}</td>
                  <td>{formatDuration(c.duration_seconds ?? c.duration_minutes * 60)}</td>
                  <td>{c.uses}/{c.max_uses}</td>
                  <td><span className={`ad-status ${tone}`}>{st}</span></td>
                  <td>{ago(c.created_at)}</td>
                  <td className="ad-actions">
                    <button className="ad-btn ghost small" onClick={() => flashCopy(c.code)}>{copied === c.code ? 'Copied' : 'Copy'}</button>
                    <button className="ad-btn ghost small" onClick={() => run(() => admin.setCodeRevoked(c.id, !c.revoked))}>{c.revoked ? 'Restore' : 'Revoke'}</button>
                    <button className="ad-btn danger small" onClick={() => window.confirm(`Delete code ${c.code}? Sessions already running keep going until their time is up.`) && run(() => admin.deleteCode(c.id))}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="ad-dim">No access codes yet. Generate one above, then give it to whoever will host.</p>}
      </div>
    </>
  );
}

function Songs({ setErr }) {
  const blank = { title: '', artist: '', youtube_id: '', language: 'OPM' };
  const [q, setQ] = useState('');
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(blank);
  const load = useCallback(() => admin.listSongs(q).then(setRows).catch((e) => setErr(e.message)), [q, setErr]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const run = async (fn) => { setErr(''); try { await fn(); await load(); } catch (e) { setErr(e.message || String(e)); } };

  const save = (e) => {
    e.preventDefault();
    const raw = form.youtube_id.trim();
    const vid = raw ? parseYouTubeId(raw) : null;
    if (raw && !vid) return setErr('That is not a YouTube link or video ID.');
    return run(async () => {
      await admin.saveSong({ ...form, title: form.title.trim(), artist: form.artist.trim(), youtube_id: vid });
      setForm(blank);
    });
  };

  return (
    <>
      <form className="ad-form ad-songform" onSubmit={save}>
        <strong>{form.id ? 'Edit song' : 'Add song'}</strong>
        <input placeholder="Title" value={form.title} onChange={set('title')} maxLength={100} required />
        <input placeholder="Artist" value={form.artist} onChange={set('artist')} maxLength={100} required />
        <input placeholder="YouTube link or video ID (optional)" value={form.youtube_id} onChange={set('youtube_id')} />
        <select value={form.language} onChange={set('language')}><option>OPM</option><option>English</option><option>Other</option></select>
        <div className="ad-row">
          <button className="ad-btn">{form.id ? 'Save changes' : 'Add song'}</button>
          {form.id && <button type="button" className="ad-btn ghost" onClick={() => setForm(blank)}>Cancel</button>}
        </div>
      </form>
      <div className="ad-row"><input placeholder="Search number, title or artist" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <div className="ad-scroll">
        <table className="ad-table">
          <thead><tr><th>#</th><th>Title</th><th>Artist</th><th>Lang</th><th>Video</th><th /></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td><span className="ad-code small">{s.code}</span></td>
                <td>{s.title}</td><td>{s.artist}</td><td>{s.language}</td>
                <td>{s.youtube_id ? 'Yes' : <span className="ad-dim">No</span>}</td>
                <td className="ad-actions">
                  <button className="ad-btn ghost small" onClick={() => { setForm({ id: s.id, title: s.title, artist: s.artist, youtube_id: s.youtube_id || '', language: s.language || 'Other' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Edit</button>
                  <button className="ad-btn danger small" onClick={() => window.confirm(`Delete #${s.code} ${s.title}?`) && run(() => admin.deleteSong(s.id))}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="ad-dim">No songs found.</p>}
      </div>
    </>
  );
}

function Dashboard({ onSignOut }) {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('hosts');
  const refresh = useCallback(() => admin.loadOverview().then(setData).catch((e) => setErr(e.message)), []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, [refresh]);
  const act = (fn) => async (...a) => { setErr(''); try { await fn(...a); await refresh(); } catch (e) { setErr(e.message || String(e)); } };

  const now = Date.now();
  const activeUsers = data ? data.people.filter((p) => now - new Date(p.last_seen).getTime() < ACTIVE_MS).length : 0;
  const cards = data && [
    ['Hosts', data.rooms.length], ['Users', data.people.length], ['Active users', activeUsers],
    ['Songs queued', data.queue.length], ['Songs in catalog', data.songCount],
  ];

  return (
    <main className="ad">
      <header className="ad-top">
        <h1>TagayOke Admin</h1>
        <div className="ad-row">
          {admin.DEMO && <span className="ad-badge">Demo mode</span>}
          <button className="ad-btn ghost small" onClick={() => nav('/')}>Back to app</button>
          {!admin.DEMO && <button className="ad-btn ghost small" onClick={onSignOut}>Sign out</button>}
        </div>
      </header>
      {err && <p className="ad-err" role="alert">{err}</p>}
      {cards && <section className="ad-cards">{cards.map(([label, n]) => <div className="ad-card" key={label}><b>{n}</b><span>{label}</span></div>)}</section>}
      <nav className="ad-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'hosts'} onClick={() => setTab('hosts')}>Hosts and users</button>
        <button role="tab" aria-selected={tab === 'codes'} onClick={() => setTab('codes')}>Access codes</button>
        <button role="tab" aria-selected={tab === 'songs'} onClick={() => setTab('songs')}>Songs</button>
      </nav>
      {!data && <p className="ad-dim">Loading…</p>}
      {data && tab === 'hosts' && <Hosts data={data} act={act} />}
      {tab === 'codes' && <Codes setErr={setErr} />}
      {tab === 'songs' && (admin.DEMO ? <p className="ad-dim">Songs are managed in Supabase. Connect it to edit the catalog here.</p> : <Songs setErr={setErr} />)}
      <p className="ad-dim ad-foot">Updates every 5 seconds. A user is "active" if their phone checked in within the last 2 minutes.</p>
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

  if (gate === 'checking') return <main className="ad ad-narrow"><p className="ad-dim">Checking access…</p></main>;
  if (gate === 'login') return <Login onDone={check} />;
  if (gate === 'denied') {
    return (
      <main className="ad ad-narrow">
        <h1>No access</h1>
        <p className="ad-dim">This account is not an admin. Add its user to the admins table in Supabase, then sign in again.</p>
        <button className="ad-btn ghost" onClick={out}>Sign out</button>
      </main>
    );
  }
  return <Dashboard onSignOut={out} />;
}
