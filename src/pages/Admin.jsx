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

function Hosts({ data, act, filter }) {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState(0);
  const [open, setOpen] = useState(null);
  const now = Date.now();
  const usersOf = (c) => data.people.filter((p) => p.room_code === c);
  const queuedOf = (c) => data.queue.filter((q) => q.room_code === c).length;
  const live = (p) => now - new Date(p.last_seen).getTime() < ACTIVE_MS;
  const f = filter.trim().toLowerCase();
  const rooms = f ? data.rooms.filter((r) => `${r.code} ${r.name || ''}`.toLowerCase().includes(f)) : data.rooms;
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
                    <button className="ad-btn ghost small" onClick={() => setOpen(open === r.code ? null : r.code)}>{open === r.code ? 'Hide users' : 'Users'}</button>
                    <button className="ad-btn danger small" onClick={() => window.confirm(`End host ${r.code} now? This closes the room and removes its queue and users.`) && act(admin.deleteRoom)(r.code)}>End now</button>
                  </div>
                </li>
                {open === r.code && <li className="ad-item-sub"><Users code={r.code} users={users} live={live} act={act} /></li>}
              </Fragment>
            );
          })}
        </ul>
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

function Codes({ setErr, filter }) {
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
  const f = filter.trim().toLowerCase();
  const shown = f ? rows.filter((c) => `${c.code} ${c.label || ''}`.toLowerCase().includes(f)) : rows;

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
      <form id="ad-new-code" className="ad-form ad-songform" onSubmit={create}>
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
            {shown.map((c) => {
              const [st, tone] = codeStatus(c);
              return (
                <tr key={c.id}>
                  <td><span className="ad-code">{c.code}</span></td>
                  <td data-label="Label">{c.label || <span className="ad-dim">—</span>}</td>
                  <td data-label="Length">{formatDuration(c.duration_seconds ?? c.duration_minutes * 60)}</td>
                  <td data-label="Used">{c.uses}/{c.max_uses}</td>
                  <td data-label="Status"><span className={`ad-status ${tone}`}>{st}</span></td>
                  <td data-label="Created">{ago(c.created_at)}</td>
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
        {!shown.length && <p className="ad-dim">{rows.length ? `No access codes match "${filter}".` : 'No access codes yet. Generate one above, then give it to whoever will host.'}</p>}
      </div>
    </>
  );
}

function Songs({ setErr, q }) {
  const blank = { title: '', artist: '', youtube_id: '', language: 'OPM' };
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
      <form id="ad-song-form" className="ad-form ad-songform" onSubmit={save}>
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
      <div className="ad-scroll">
        <table className="ad-table">
          <thead><tr><th>#</th><th>Title</th><th>Artist</th><th>Lang</th><th>Video</th><th /></tr></thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td><span className="ad-code small">{s.code}</span></td>
                <td className="ad-song-title">{s.title}</td><td data-label="Artist">{s.artist}</td><td data-label="Language">{s.language}</td>
                <td data-label="Video">{s.youtube_id ? 'Yes' : <span className="ad-dim">No</span>}</td>
                <td className="ad-actions">
                  <button className="ad-btn ghost small" onClick={() => { setForm({ id: s.id, title: s.title, artist: s.artist, youtube_id: s.youtube_id || '', language: s.language || 'Other' }); document.getElementById('ad-song-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Edit</button>
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

const NAV = [
  ['hosts', 'Hosts and users', 'grid'],
  ['codes', 'Access codes', 'key'],
  ['songs', 'Songs', 'music'],
];
const PANEL = {
  hosts: ['Live hosts', 'Rooms running right now'],
  codes: ['Access codes', 'Codes that let someone start hosting'],
  songs: ['Song catalog', 'Add, edit and remove songs'],
};
const SEARCH_HINT = { hosts: 'Search hosts by code or name', codes: 'Search codes or labels', songs: 'Search number, title or artist' };

function Dashboard({ onSignOut }) {
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('hosts');
  const [search, setSearch] = useState('');
  const refresh = useCallback(() => admin.loadOverview().then(setData).catch((e) => setErr(e.message)), []);
  useEffect(() => { refresh(); const t = setInterval(refresh, 5000); return () => clearInterval(t); }, [refresh]);
  const act = (fn) => async (...a) => { setErr(''); try { await fn(...a); await refresh(); } catch (e) { setErr(e.message || String(e)); } };
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
            <input type="search" placeholder={SEARCH_HINT[tab]} value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search" />
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
                {data && tab === 'hosts' && <Hosts data={data} act={act} filter={search} />}
                {tab === 'codes' && <Codes setErr={setErr} filter={search} />}
                {tab === 'songs' && (admin.DEMO ? <p className="ad-dim">Songs are managed in Supabase. Connect it to edit the catalog here.</p> : <Songs setErr={setErr} q={search} />)}
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
  return <Dashboard onSignOut={out} />;
}
