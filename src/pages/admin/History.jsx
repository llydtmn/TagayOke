import { useEffect, useMemo, useState } from 'react';
import * as admin from '../../services/admin';
import { formatDuration } from '../../utils/hostCode';
import { toCsv, downloadText } from '../../utils/csv';
import '../../styles/admin-extra.css';

const PAGE = 25;
const RANGES = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [0, 'All time']];
const SQL_FILE = 'supabase/session-history-and-song-reports.sql';
const when = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const lenOf = (s, now) => Math.max(0, ((s.ended_at ? new Date(s.ended_at) : now) - new Date(s.started_at)) / 1000);

function Reason({ s }) {
  if (!s.ended_at) return <span className="ad-badge-soft run">Running</span>;
  return s.end_reason === 'time_up' ? <span className="ad-badge-soft time">Time ran out</span> : <span className="ad-badge-soft">Ended early</span>;
}

export default function History({ setErr, filter }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let alive = true;
    const load = () => admin.listSessions(days).then((r) => alive && setData(r)).catch((e) => setErr(e.message || String(e)));
    setData(null); load();
    const t = setInterval(load, 15000);
    return () => { alive = false; clearInterval(t); };
  }, [days, setErr]);
  useEffect(() => { setPage(0); }, [filter, days]);

  const now = new Date();
  const f = filter.trim().toLowerCase();
  const rows = useMemo(() => (data?.rows || []).filter((s) => !f || `${s.room_code} ${s.room_name || ''} ${s.code || ''} ${s.code_label || ''}`.toLowerCase().includes(f)), [data, f]);

  if (admin.DEMO) return <p className="ad-dim">Session history is recorded in Supabase. Connect it to see past sessions here.</p>;
  if (!data) return <p className="ad-dim">Loading the history…</p>;
  if (data.missing) return <p className="ad-notice">Session history is not set up yet. Run <code>{SQL_FILE}</code> in the Supabase SQL Editor, then reload this page. Sessions are recorded from that moment on.</p>;

  const finished = rows.filter((s) => s.ended_at);
  const avg = finished.length ? finished.reduce((n, s) => n + lenOf(s, now), 0) / finished.length : 0;
  const songs = rows.reduce((n, s) => n + (s.songs_played || 0), 0);
  const people = rows.reduce((n, s) => n + (s.people_joined || 0), 0);
  const timeUp = finished.filter((s) => s.end_reason === 'time_up').length;
  const shown = rows.slice(page * PAGE, (page + 1) * PAGE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));

  const exportCsv = () => downloadText(`tagayoke-sessions-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(
    ['room', 'host_name', 'access_code', 'code_label', 'started_at', 'ended_at', 'length_seconds', 'planned_end', 'end_reason', 'songs_played', 'people_joined'],
    rows.map((s) => [s.room_code, s.room_name, s.code, s.code_label, s.started_at, s.ended_at, Math.round(lenOf(s, now)), s.planned_end, s.ended_at ? s.end_reason : 'running', s.songs_played, s.people_joined]),
  ));

  return (
    <div className="ad-reports">
      <div className="ad-toolbar">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Time range">{RANGES.map(([d, t]) => <option key={d} value={d}>{t}</option>)}</select>
        <button className="ad-btn ghost small" onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
      </div>
      <div className="ad-kpis">
        <div className="ad-kpi"><b>{rows.length}</b><span>Sessions</span></div>
        <div className="ad-kpi"><b>{finished.length ? formatDuration(avg) : '—'}</b><span>Average real length</span></div>
        <div className="ad-kpi"><b>{songs}</b><span>Songs played</span></div>
        <div className="ad-kpi"><b>{people}</b><span>Phones joined</span></div>
        <div className="ad-kpi"><b>{finished.length ? `${Math.round((timeUp / finished.length) * 100)}%` : '—'}</b><span>Ended by the time limit</span></div>
      </div>

      {!rows.length ? (
        <p className="ad-dim">{data.rows.length ? 'No sessions match your search.' : 'No sessions in this range yet. They appear here as hosts start and finish.'}</p>
      ) : (
        <>
          <div className="ad-scroll">
            <table className="ad-table ad-sessions">
              <thead><tr><th>Host</th><th>Access code</th><th>Started</th><th>Length</th><th>Result</th><th>Songs</th><th>Phones</th></tr></thead>
              <tbody>
                {shown.map((s) => (
                  <tr key={s.id}>
                    <td className="ad-song-title"><span className="ad-code small">{s.room_code}</span> {s.room_name || <span className="ad-dim">Unnamed</span>}</td>
                    <td data-label="Access code">{s.code ? <><b>{s.code}</b>{s.code_label && <span className="ad-sub-line">{s.code_label}</span>}</> : <span className="ad-dim">Made by admin</span>}</td>
                    <td data-label="Started">{when(s.started_at)}</td>
                    <td data-label="Length">{formatDuration(lenOf(s, now))}{s.planned_end && s.ended_at ? <span className="ad-sub-line">limit was {formatDuration((new Date(s.planned_end) - new Date(s.started_at)) / 1000)}</span> : null}</td>
                    <td data-label="Result"><Reason s={s} /></td>
                    <td data-label="Songs">{s.songs_played}</td>
                    <td data-label="Phones">{s.people_joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="ad-pager">
            <span className="ad-dim">Showing {page * PAGE + 1}–{Math.min(rows.length, (page + 1) * PAGE)} of {rows.length}</span>
            <div className="ad-tools">
              <button className="ad-btn ghost small" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="ad-dim">Page {page + 1} of {pages}</span>
              <button className="ad-btn ghost small" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        </>
      )}
      <p className="ad-dim">Length and songs are measured while the session runs, so they show what really happened, not just the time that was granted. A song counts when it starts playing.</p>
    </div>
  );
}
