import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as admin from '../../services/admin';
import { parseYouTubeId } from '../../utils/youtube';
import { parseCsv, toCsv, normKey, downloadText } from '../../utils/csv';
import '../../styles/admin-extra.css';

const PAGE = 50;
const SQL_FILE = 'supabase/session-history-and-song-reports.sql';
const today = () => new Date().toISOString().slice(0, 10);
const videoUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
const LANGS = { opm: 'OPM', english: 'English' };

// ---------- duplicates ----------
function Duplicates({ setErr, onChanged }) {
  const [songs, setSongs] = useState(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => admin.loadCatalogLite().then(setSongs).catch((e) => setErr(e.message || String(e))), [setErr]);
  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => {
    if (!songs) return [];
    const push = (m, k, s) => m.set(k, [...(m.get(k) || []), s]);
    const byVid = new Map(); const byTitle = new Map();
    songs.forEach((s) => {
      if (s.youtube_id) push(byVid, s.youtube_id, s);
      const t = normKey(s.title);
      if (t) push(byTitle, `${t}|${normKey(s.artist)}`, s);
    });
    const out = []; const seen = new Set();
    byVid.forEach((list, k) => { if (list.length > 1) { out.push({ key: `v:${k}`, why: 'Same video', list }); list.forEach((s) => seen.add(s.id)); } });
    byTitle.forEach((list, k) => { if (list.length > 1 && !list.every((s) => seen.has(s.id))) out.push({ key: `t:${k}`, why: 'Same title and artist', list }); });
    return out.sort((a, b) => b.list.length - a.list.length);
  }, [songs]);

  const keeper = (list) => [...list].sort((a, b) => (!!b.youtube_id - !!a.youtube_id) || a.code - b.code)[0];
  const remove = async (ids, label) => {
    setBusy(true); setErr(''); setMsg('');
    try {
      const { deleted, blocked } = await admin.deleteSongsSafe(ids);
      setMsg(`${label}: deleted ${deleted}${blocked ? `, skipped ${blocked} that are in a queue right now` : ''}.`);
      await load(); onChanged();
    } catch (e) { setErr(e.message || String(e)); } finally { setBusy(false); }
  };

  if (!songs) return <p className="ad-dim">Scanning the catalog…</p>;
  return (
    <>
      <p className="ad-dim ad-lead">{songs.length} songs scanned. {groups.length ? `${groups.length} group${groups.length === 1 ? '' : 's'} look like duplicates.` : 'No duplicates found.'}</p>
      {msg && <p className="ad-ok" role="status">{msg}</p>}
      <div className="ad-dups">
        {groups.slice(0, 100).map((g) => {
          const keep = keeper(g.list);
          const others = g.list.filter((s) => s.id !== keep.id);
          return (
            <div className="ad-dup" key={g.key}>
              <div className="ad-dup-head">
                <b>{g.why}: {keep.title}</b>
                <button className="ad-btn small danger" disabled={busy} onClick={() => window.confirm(`Keep #${keep.code} and delete ${others.length} other${others.length === 1 ? '' : 's'}?`) && remove(others.map((s) => s.id), `#${keep.code} kept`)}>
                  Keep #{keep.code}, delete {others.length}
                </button>
              </div>
              <ul>
                {g.list.map((s) => (
                  <li key={s.id}>
                    <span className="ad-code small">{s.code}</span>
                    <span><b>{s.title}</b> · {s.artist}</span>
                    <span className="ad-dim">{s.youtube_id ? <a className="ad-vidlink" href={videoUrl(s.youtube_id)} target="_blank" rel="noopener noreferrer">{s.youtube_id}</a> : 'no video'}{s.id === keep.id ? ' · kept' : ''}</span>
                    {s.id !== keep.id && <button className="ad-link danger" disabled={busy} onClick={() => remove([s.id], `#${s.code}`)}>Delete</button>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {groups.length > 100 && <p className="ad-dim">Showing the first 100 groups. Clean these up and scan again to see the rest.</p>}
    </>
  );
}

// ---------- CSV import ----------
function ImportCsv({ setErr, onChanged }) {
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState('');
  const fileRef = useRef(null);

  const template = () => downloadText('tagayoke-songs-template.csv', toCsv(['title', 'artist', 'language', 'youtube'], [
    ['Tadhana', 'Up Dharma Down', 'OPM', 'https://www.youtube.com/watch?v=XXXXXXXXXXX'],
    ['My Way', 'Frank Sinatra', 'English', ''],
  ]));

  const pick = async (e) => {
    const file = e.target.files?.[0];
    setPlan(null); setDone(''); setErr('');
    if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error('The file has no song rows.');
      if (rows.length > 5001) throw new Error('That is more than 5,000 rows. Split the file and import it in parts.');
      const head = rows[0].map((h) => h.trim().toLowerCase());
      const col = (...names) => head.findIndex((h) => names.includes(h));
      const iT = col('title', 'song', 'song title'); const iA = col('artist', 'singer');
      const iL = col('language', 'lang'); const iV = col('youtube', 'youtube_id', 'video', 'url', 'link');
      if (iT < 0 || iA < 0) throw new Error('The first row must have "title" and "artist" columns (language and youtube are optional).');

      const existing = await admin.loadCatalogLite();
      const vids = new Set(existing.map((s) => s.youtube_id).filter(Boolean));
      const keys = new Set(existing.map((s) => `${normKey(s.title)}|${normKey(s.artist)}`));
      const fresh = []; const bad = []; let dup = 0;
      rows.slice(1).forEach((r, i) => {
        const line = i + 2;
        const title = (r[iT] || '').trim(); const artist = (r[iA] || '').trim();
        if (!title || !artist) return bad.push({ line, why: 'missing title or artist' });
        if (title.length > 100 || artist.length > 100) return bad.push({ line, why: 'title or artist is over 100 characters' });
        const rawV = iV >= 0 ? (r[iV] || '').trim() : '';
        const vid = rawV ? parseYouTubeId(rawV) : null;
        if (rawV && !vid) return bad.push({ line, why: 'not a YouTube link or video ID' });
        const key = `${normKey(title)}|${normKey(artist)}`;
        if ((vid && vids.has(vid)) || keys.has(key)) { dup += 1; return undefined; }
        if (vid) vids.add(vid);
        keys.add(key);
        const lang = iL >= 0 ? (r[iL] || '').trim().toLowerCase() : '';
        fresh.push({ title, artist, youtube_id: vid, language: LANGS[lang] || 'Other' });
        return undefined;
      });
      setPlan({ fresh, dup, bad, total: rows.length - 1 });
    } catch (x) { setErr(x.message || String(x)); }
    finally { if (fileRef.current) fileRef.current.value = ''; }
  };

  const run = async () => {
    setBusy(true); setErr(''); setProgress(0);
    try {
      const { added, skipped } = await admin.importSongs(plan.fresh, setProgress);
      setDone(`Imported ${added} song${added === 1 ? '' : 's'}${skipped ? `, ${skipped} skipped because they already exist` : ''}.`);
      setPlan(null); onChanged();
    } catch (x) { setErr(x.message || String(x)); } finally { setBusy(false); }
  };

  return (
    <div className="ad-import">
      <p className="ad-dim">Upload a CSV with <b>title</b> and <b>artist</b> columns. <b>language</b> (OPM, English or Other) and <b>youtube</b> (link or video ID) are optional. Songs that already exist are skipped.</p>
      <div className="ad-tools">
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={pick} aria-label="Choose a CSV file" />
        <button className="ad-btn ghost small" onClick={template}>Download template</button>
      </div>
      {done && <p className="ad-ok" role="status">{done}</p>}
      {plan && (
        <div className="ad-notice">
          <b>{plan.fresh.length} new song{plan.fresh.length === 1 ? '' : 's'}</b> ready to import out of {plan.total} rows.
          {plan.dup ? ` ${plan.dup} already exist and will be skipped.` : ''}
          {plan.bad.length ? ` ${plan.bad.length} row${plan.bad.length === 1 ? ' has' : 's have'} a problem and will be skipped:` : ''}
          {!!plan.bad.length && (
            <ul className="ad-badlist">
              {plan.bad.slice(0, 8).map((b) => <li key={b.line}>Line {b.line}: {b.why}</li>)}
              {plan.bad.length > 8 && <li>…and {plan.bad.length - 8} more</li>}
            </ul>
          )}
          <div className="ad-row" style={{ marginTop: '.7rem', marginBottom: 0 }}>
            <button className="ad-btn" disabled={busy || !plan.fresh.length} onClick={run}>{busy ? `Importing… ${progress}/${plan.fresh.length}` : `Import ${plan.fresh.length} song${plan.fresh.length === 1 ? '' : 's'}`}</button>
            <button className="ad-btn ghost" disabled={busy} onClick={() => setPlan(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- main catalog ----------
export default function Songs({ setErr, q }) {
  const blank = { title: '', artist: '', youtube_id: '', language: 'OPM' };
  const [view, setView] = useState('list');          // list | dups | import
  const [filter, setFilter] = useState('all');       // all | novideo | reported
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(blank);
  const [reports, setReports] = useState({ rows: [], missing: false });
  const [noVideo, setNoVideo] = useState(null);
  const reportOf = useMemo(() => Object.fromEntries(reports.rows.map((r) => [String(r.song_id), r])), [reports]);

  const loadMeta = useCallback(() => {
    admin.listSongReports().then(setReports).catch((e) => setErr(e.message || String(e)));
    admin.countNoVideo().then(setNoVideo).catch(() => {});
  }, [setErr]);
  const load = useCallback(() => admin.listSongsPage({ q, filter, offset: page * PAGE, limit: PAGE })
    .then((r) => { setRows(r.rows); setTotal(r.total); }).catch((e) => setErr(e.message || String(e))), [q, filter, page, setErr]);

  useEffect(() => { loadMeta(); }, [loadMeta]);
  useEffect(() => { setPage(0); }, [q, filter]);
  useEffect(() => { if (view !== 'list') return undefined; const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load, view]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const run = async (fn) => { setErr(''); try { await fn(); await load(); loadMeta(); } catch (e) { setErr(e.message || String(e)); } };
  const changed = () => { loadMeta(); load(); };

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

  const exportCsv = () => run(async () => {
    const all = await admin.loadCatalogLite();
    downloadText(`tagayoke-songs-${today()}.csv`, toCsv(['code', 'title', 'artist', 'language', 'youtube_id'], all.map((s) => [s.code, s.title, s.artist, s.language, s.youtube_id])));
  });

  const pages = Math.max(1, Math.ceil(total / PAGE));
  const from = total ? page * PAGE + 1 : 0;
  const to = Math.min(total, (page + 1) * PAGE);
  const edit = (s) => { setView('list'); setForm({ id: s.id, title: s.title, artist: s.artist, youtube_id: s.youtube_id || '', language: s.language || 'Other' }); setTimeout(() => document.getElementById('ad-song-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); };

  return (
    <>
      {reports.missing && (
        <p className="ad-notice">Broken-video reports are not set up yet. Run <code>{SQL_FILE}</code> in the Supabase SQL Editor to turn them on.</p>
      )}
      <div className="ad-toolbar">
        <div className="ad-chips" role="group" aria-label="Catalog view">
          <button className="ad-chip" aria-pressed={view === 'list' && filter === 'all'} onClick={() => { setView('list'); setFilter('all'); }}>All songs</button>
          <button className="ad-chip" aria-pressed={view === 'list' && filter === 'novideo'} onClick={() => { setView('list'); setFilter('novideo'); }}>No video{noVideo != null && <span className="n">{noVideo}</span>}</button>
          <button className="ad-chip" aria-pressed={view === 'list' && filter === 'reported'} onClick={() => { setView('list'); setFilter('reported'); }}>Reported{reports.rows.length > 0 && <span className="n">{reports.rows.length}</span>}</button>
        </div>
        <div className="ad-tools">
          <button className="ad-chip" aria-pressed={view === 'dups'} onClick={() => setView(view === 'dups' ? 'list' : 'dups')}>Find duplicates</button>
          <button className="ad-chip" aria-pressed={view === 'import'} onClick={() => setView(view === 'import' ? 'list' : 'import')}>Import CSV</button>
          <button className="ad-chip" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      {view === 'dups' && <Duplicates setErr={setErr} onChanged={loadMeta} />}
      {view === 'import' && <ImportCsv setErr={setErr} onChanged={changed} />}

      {view === 'list' && (
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
              <thead><tr><th>#</th><th>Title</th><th>Artist</th><th>Lang</th><th>Video</th><th>Status</th><th /></tr></thead>
              <tbody>
                {rows.map((s) => {
                  const rep = reportOf[String(s.id)];
                  return (
                    <tr key={s.id}>
                      <td><span className="ad-code small">{s.code}</span></td>
                      <td className="ad-song-title">{s.title}</td><td data-label="Artist">{s.artist}</td><td data-label="Language">{s.language}</td>
                      <td data-label="Video">{s.youtube_id ? <a className="ad-vidlink" href={videoUrl(s.youtube_id)} target="_blank" rel="noopener noreferrer">Open</a> : <span className="ad-dim">No</span>}</td>
                      <td data-label="Status">
                        {rep ? <span className="ad-status bad" title={`Last reported ${new Date(rep.last_reported_at).toLocaleString()}`}>Reported ×{rep.report_count}</span>
                          : !s.youtube_id ? <span className="ad-status dim">No video</span> : <span className="ad-status ok">OK</span>}
                      </td>
                      <td className="ad-actions">
                        {rep && <button className="ad-btn ghost small" onClick={() => run(() => admin.resolveSongReport(s.id))}>Mark fixed</button>}
                        <button className="ad-btn ghost small" onClick={() => edit(s)}>Edit</button>
                        <button className="ad-btn danger small" onClick={() => window.confirm(`Delete #${s.code} ${s.title}?`) && run(() => admin.deleteSong(s.id, `#${s.code} ${s.title}`))}>Delete</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && <p className="ad-dim">{filter === 'reported' ? 'No open reports. Nice.' : filter === 'novideo' ? 'Every song has a video.' : 'No songs found.'}</p>}
          </div>
          <div className="ad-pager">
            <span className="ad-dim">{total ? `Showing ${from}–${to} of ${total}` : ' '}</span>
            <div className="ad-tools">
              <button className="ad-btn ghost small" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="ad-dim">Page {page + 1} of {pages}</span>
              <button className="ad-btn ghost small" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
