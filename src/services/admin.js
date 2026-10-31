// Everything the admin dashboard reads and writes. Demo mode uses localStorage; live mode uses Supabase.
import { USE_MOCK } from '../config/env';
import { supabase } from './supabaseClient';
import { SEED_SONGS } from '../data/seedSongs';
import { makeRoomCode } from '../utils/roomCode';
import { PEOPLE_KEY } from './presence';
import { makeAccessCode } from '../utils/hostCode';
import { api } from './index';

export const DEMO = USE_MOCK;
const ROOMS_KEY = 'tagayoke:mock'; // same store the demo adapter uses
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const check = ({ data, error }) => { if (error) throw error; return data; };
const loadRooms = () => JSON.parse(localStorage.getItem(ROOMS_KEY) || '{}');
const saveRooms = (db) => localStorage.setItem(ROOMS_KEY, JSON.stringify(db));
const CODES_KEY = 'tagayoke:mock-codes'; // same store the demo adapter reads
const loadCodes = () => JSON.parse(localStorage.getItem(CODES_KEY) || '[]');
const saveCodes = (all) => localStorage.setItem(CODES_KEY, JSON.stringify(all));
const loadPeople = () => JSON.parse(localStorage.getItem(PEOPLE_KEY) || '[]');
const savePeople = (all) => localStorage.setItem(PEOPLE_KEY, JSON.stringify(all));

// ---- sign in (live mode only; demo mode has no login) ----
export async function getSession() { return (await supabase.auth.getSession()).data.session; }
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export const signOut = () => supabase.auth.signOut();
// Row level security only shows a user their own row, so a row back means "this user is an admin".
export async function isAdmin() {
  const { data } = await supabase.from('admins').select('user_id').maybeSingle();
  return !!data;
}

// ---- overview: hosts (rooms), users (participants), queued songs ----
export async function loadOverview() {
  if (DEMO) {
    const db = loadRooms();
    for (const c of Object.keys(db)) if (db[c].expires_at && new Date(db[c].expires_at) <= new Date()) delete db[c];
    saveRooms(db);
    return {
      rooms: Object.entries(db).map(([code, r]) => ({ code, name: r.name || null, created_at: r.created_at || null, expires_at: r.expires_at || null })),
      people: loadPeople().filter((p) => db[p.room_code]),
      queue: Object.entries(db).flatMap(([code, r]) => (r.queue || []).map((i) => ({ room_code: code, status: i.status }))),
      songCount: SEED_SONGS.length,
    };
  }
  await supabase.rpc('purge_expired_rooms'); // belt and braces next to the scheduled job
  const [rooms, people, queue, songs] = await Promise.all([
    supabase.from('rooms').select('*').order('created_at', { ascending: false }),
    supabase.from('participants').select('*').order('joined_at'),
    supabase.from('queue_items').select('id, room_code, status').neq('status', 'done'),
    supabase.from('songs').select('id', { count: 'exact', head: true }),
  ]);
  return { rooms: check(rooms), people: check(people), queue: check(queue), songCount: songs.count ?? 0 };
}

// ---- hosts ----
export async function createRoom(name, minutes = 0) {
  const code = makeRoomCode();
  const expires_at = minutes ? new Date(Date.now() + minutes * 60000).toISOString() : null;
  if (DEMO) {
    const db = loadRooms();
    db[code] = { queue: [], name: name || null, created_at: new Date().toISOString(), expires_at };
    saveRooms(db);
    return code;
  }
  check(await supabase.from('rooms').insert({ code, name: name || null, expires_at }));
  return code;
}
export async function renameRoom(code, name) {
  if (DEMO) { const db = loadRooms(); if (db[code]) { db[code].name = name || null; saveRooms(db); } return; }
  check(await supabase.from('rooms').update({ name: name || null }).eq('code', code));
}
export async function deleteRoom(code) {
  const info = await roomInfo(code); // read before it is gone, for the activity log
  if (DEMO) { const db = loadRooms(); delete db[code]; saveRooms(db); savePeople(loadPeople().filter((p) => p.room_code !== code)); }
  else check(await supabase.from('rooms').delete().eq('code', code)); // queue and users go with it (ON DELETE CASCADE)
  await logAction('end_host', code, info);
}

// Adds time to a host session (or sets a limit on one that had none). Negative minutes shorten it.
export async function extendRoom(code, minutes, currentExpiresAt) {
  const base = currentExpiresAt ? new Date(currentExpiresAt).getTime() : Date.now();
  const expires_at = new Date(Math.max(base, Date.now()) + minutes * 60000).toISOString();
  if (DEMO) { const db = loadRooms(); if (db[code]) { db[code].expires_at = expires_at; saveRooms(db); } return; }
  check(await supabase.from('rooms').update({ expires_at }).eq('code', code));
}

// ---- host access codes ----
export async function listCodes() {
  if (DEMO) return loadCodes().sort((a, b) => b.created_at.localeCompare(a.created_at));
  return check(await supabase.from('host_codes').select('*').order('created_at', { ascending: false }));
}
// `seconds` null/0 = unlimited session (needs supabase/unlimited-host-codes.sql in live mode).
export async function createCode({ label, seconds, maxUses, redeemByHours }) {
  const row = {
    code: makeAccessCode(), label: label || null, duration_seconds: seconds || null, max_uses: maxUses || 1,
    redeem_by: redeemByHours ? new Date(Date.now() + redeemByHours * 3600000).toISOString() : null,
  };
  const detail = `${row.label || 'no label'} · ${row.duration_seconds ? `${Math.round(row.duration_seconds / 60)} min` : 'unlimited'}`;
  if (DEMO) { saveCodes([...loadCodes(), { ...row, id: uid(), uses: 0, revoked: false, created_at: new Date().toISOString(), last_used_at: null }]); await logAction('create_code', row.code, detail); return row.code; }
  check(await supabase.from('host_codes').insert(row));
  await logAction('create_code', row.code, detail);
  return row.code;
}
export async function setCodeRevoked(id, revoked, code = '') {
  if (DEMO) saveCodes(loadCodes().map((c) => (c.id === id ? { ...c, revoked } : c)));
  else check(await supabase.from('host_codes').update({ revoked }).eq('id', id));
  await logAction(revoked ? 'revoke_code' : 'restore_code', code || id);
}
export async function deleteCode(id, code = '') {
  if (DEMO) saveCodes(loadCodes().filter((c) => c.id !== id));
  else check(await supabase.from('host_codes').delete().eq('id', id));
  await logAction('delete_code', code || id);
}

// ---- users (participants) ----
export async function addPerson(code, name) {
  if (DEMO) {
    const now = new Date().toISOString();
    savePeople([...loadPeople(), { id: uid(), room_code: code, device_id: `admin-${uid()}`, name, joined_at: now, last_seen: now }]);
    return;
  }
  check(await supabase.from('participants').insert({ room_code: code, device_id: `admin-${uid()}`, name }));
}
export async function renamePerson(id, name) {
  if (DEMO) { const all = loadPeople(); const p = all.find((x) => x.id === id); if (p) { p.name = name; savePeople(all); } return; }
  check(await supabase.from('participants').update({ name }).eq('id', id));
}
export async function deletePerson(id, label = '') {
  if (DEMO) savePeople(loadPeople().filter((p) => p.id !== id));
  else check(await supabase.from('participants').delete().eq('id', id));
  await logAction('remove_user', label || id);
}

// ---- songs (live mode only) ----
export async function listSongs(q = '') {
  let query = supabase.from('songs').select('*').order('code').limit(200);
  const s = q.trim().replace(/[,()%]/g, ' ');
  if (s) query = /^\d+$/.test(s) ? query.eq('code', Number(s)) : query.or(`title.ilike.%${s}%,artist.ilike.%${s}%`);
  return check(await query);
}
export async function saveSong({ id, title, artist, youtube_id, language }) {
  const row = { title, artist, youtube_id: youtube_id || null, language: language || 'Other' };
  if (id) {
    check(await supabase.from('songs').update(row).eq('id', id));
    if (row.youtube_id) await resolveSongReport(id).catch(() => {}); // a new video link counts as a fix
  } else check(await supabase.from('songs').insert({ ...row, source: 'admin' }));
}
export async function deleteSong(id, label = '') {
  const { error } = await supabase.from('songs').delete().eq('id', id);
  if (error?.code === '23503') throw new Error('That song is in a queue right now. Try again after it has played.');
  if (error) throw error;
  await logAction('delete_catalog_song', label || id);
}

// ---- reports & analytics ----
// Access codes live on after a session ends, so they give the history. Rooms/users/queue are "right now" (loadOverview).
export async function loadReports() {
  const countBy = (list, key) => list.reduce((m, x) => { const k = key(x) || 'Other'; m[k] = (m[k] || 0) + 1; return m; }, {});
  if (DEMO) {
    let custom = [];
    try { custom = JSON.parse(localStorage.getItem('tagayoke:custom-songs') || '[]'); } catch { /* ignore */ }
    const songs = [...SEED_SONGS, ...custom];
    return {
      codes: loadCodes(),
      songs: {
        total: songs.length,
        withVideo: songs.filter((s) => s.youtubeId).length,
        byLanguage: countBy(songs, (s) => s.language),
        bySource: countBy(songs, (s) => (custom.includes(s) ? 'user' : 'built-in')),
      },
    };
  }
  const [codes, songs] = await Promise.all([
    supabase.from('host_codes').select('*').order('created_at', { ascending: false }).limit(5000),
    supabase.from('songs').select('language, youtube_id, source').limit(20000),
  ]);
  const rows = check(songs);
  return {
    codes: check(codes),
    songs: {
      total: rows.length,
      withVideo: rows.filter((s) => s.youtube_id).length,
      byLanguage: countBy(rows, (s) => s.language),
      bySource: countBy(rows, (s) => s.source),
    },
  };
}

// ---- session history (live mode only; needs supabase/session-history-and-song-reports.sql) ----
const needsSql = (e) => !!e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(e.message || ''));

export async function listSessions(days = 30) {
  if (DEMO) return { rows: [], missing: false };
  let q = supabase.from('host_sessions').select('*').order('started_at', { ascending: false }).limit(1000);
  if (days) q = q.gte('started_at', new Date(Date.now() - days * 86400000).toISOString());
  const { data, error } = await q;
  if (error) { if (needsSql(error)) return { rows: [], missing: true }; throw error; }
  return { rows: data, missing: false };
}

// Karaoke insights (needs supabase/session-insights.sql). One RPC call returns counts, never raw rows.
export async function loadInsights(days = 30) {
  if (DEMO) return { missing: false, demo: true };
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const { data, error } = await supabase.rpc('admin_insights', { p_days: days, p_tz: tz });
  if (error) { if (error.code === 'PGRST202' || needsSql(error)) return { missing: true }; throw error; }
  return data;
}

// ---- song catalog health (live mode only) ----
const PAGE = 1000; // Supabase returns at most 1000 rows per request
export async function loadCatalogLite() {
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from('songs').select('id, code, title, artist, language, youtube_id').order('code').range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...data);
    if (data.length < PAGE) break;
  }
  return out;
}

export async function listSongReports() {
  const { data, error } = await supabase.from('song_reports').select('*').eq('resolved', false).order('last_reported_at', { ascending: false }).limit(500);
  if (error) { if (needsSql(error)) return { rows: [], missing: true }; throw error; }
  return { rows: data, missing: false };
}
export async function resolveSongReport(songId) {
  const { error } = await supabase.from('song_reports').update({ resolved: true }).eq('song_id', songId);
  if (error && !needsSql(error)) throw error;
}
export async function countNoVideo() {
  const { count } = await supabase.from('songs').select('id', { count: 'exact', head: true }).is('youtube_id', null);
  return count ?? 0;
}

// One page of the catalog. filter: 'all' | 'novideo' | 'reported'.
export async function listSongsPage({ q = '', filter = 'all', offset = 0, limit = 50 }) {
  let query = supabase.from('songs').select('*', { count: 'exact' }).order('code').range(offset, offset + limit - 1);
  const s = q.trim().replace(/[,()%]/g, ' ');
  if (s) query = /^\d+$/.test(s) ? query.eq('code', Number(s)) : query.or(`title.ilike.%${s}%,artist.ilike.%${s}%`);
  if (filter === 'novideo') query = query.is('youtube_id', null);
  if (filter === 'reported') {
    const ids = (await listSongReports()).rows.map((r) => r.song_id);
    if (!ids.length) return { rows: [], total: 0 };
    query = query.in('id', ids);
  }
  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data, total: count ?? data.length };
}

// Deletes songs one by one. Songs that are in a queue right now are skipped, not an error.
export async function deleteSongsSafe(ids) {
  let deleted = 0; let blocked = 0;
  for (const id of ids) {
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (!error) deleted += 1;
    else if (error.code === '23503') blocked += 1;
    else throw error;
  }
  if (deleted) await logAction('delete_catalog_song', `${deleted} song${deleted === 1 ? '' : 's'}`, blocked ? `${blocked} skipped (in a queue)` : '');
  return { deleted, blocked };
}

// Inserts in batches of 200. If a batch trips a unique rule, it falls back to row by row and skips the clashes.
export async function importSongs(rows, onProgress) {
  let added = 0; let skipped = 0;
  const shape = (r) => ({ title: r.title, artist: r.artist, language: r.language || 'Other', youtube_id: r.youtube_id || null, source: 'admin' });
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200).map(shape);
    const { error } = await supabase.from('songs').insert(chunk);
    if (!error) added += chunk.length;
    else if (error.code === '23505') {
      for (const r of chunk) {
        const one = await supabase.from('songs').insert(r);
        if (!one.error) added += 1; else if (one.error.code === '23505') skipped += 1; else throw one.error;
      }
    } else throw error;
    onProgress?.(Math.min(rows.length, i + 200));
  }
  return { added, skipped };
}

// ---- session control: look into one running room and act on it ----
const NO_RIGHTS = 'The database refused this change. Run supabase/session-control.sql once in the Supabase SQL editor, then try again.';
const isMissingFn = (e) => !!e && (e.code === 'PGRST202' || /could not find the function/i.test(e.message || ''));
const shapeItem = (r) => ({ id: r.id, singer: r.singer, status: r.status, song: { code: r.song?.code, title: r.song?.title || 'Unknown song', artist: r.song?.artist || '' } });

// The queue (now playing + waiting) and the message currently on the TV for one room.
export async function loadRoomQueue(code) {
  if (DEMO) {
    const r = loadRooms()[code];
    return {
      items: (r?.queue || []).map(shapeItem),
      message: r?.tv_message ? { text: r.tv_message, until: r.tv_message_until } : null,
      messagesReady: true,
    };
  }
  const [q, r] = await Promise.all([
    supabase.from('queue_items').select('id, singer, status, created_at, song:songs(code, title, artist)')
      .eq('room_code', code).neq('status', 'done').order('created_at'),
    supabase.from('rooms').select('tv_message, tv_message_until').eq('code', code).maybeSingle(),
  ]);
  return {
    items: check(q).map(shapeItem),
    message: !r.error && r.data?.tv_message ? { text: r.data.tv_message, until: r.data.tv_message_until } : null,
    messagesReady: !r.error, // false until session-control.sql has been run
  };
}

// Ends the song that is playing and starts the next one.
export async function skipSong(code, label = '') {
  if (DEMO) await api.advance(code);
  else {
    const q = check(await supabase.from('queue_items').select('id, status').eq('room_code', code).neq('status', 'done').order('created_at'));
    const playing = q.find((i) => i.status === 'playing');
    const next = q.find((i) => i.status === 'queued');
    if (playing) {
      const done = check(await supabase.from('queue_items').update({ status: 'done' }).eq('id', playing.id).select('id'));
      if (!done.length) throw new Error(NO_RIGHTS);
    }
    if (next) check(await supabase.from('queue_items').update({ status: 'playing' }).eq('id', next.id).select('id'));
  }
  await logAction('skip_song', code, label);
}

export async function removeQueueItem(code, id, label = '') {
  if (DEMO) await api.removeItem(code, id);
  else {
    const gone = check(await supabase.from('queue_items').delete().eq('id', id).select('id'));
    if (!gone.length) throw new Error(NO_RIGHTS);
  }
  await logAction('remove_song', code, label);
}

// Shows a short message on the host's TV for `seconds`. Empty text clears it.
export async function sendTvMessage(code, text, seconds = 20) {
  const t = (text || '').trim().slice(0, 120);
  if (DEMO) {
    const db = loadRooms();
    if (!db[code]) throw new Error('That room has already closed.');
    if (!t) { delete db[code].tv_message; delete db[code].tv_message_until; delete db[code].tv_message_at; }
    else {
      db[code].tv_message = t;
      db[code].tv_message_until = new Date(Date.now() + seconds * 1000).toISOString();
      db[code].tv_message_at = new Date().toISOString();
    }
    saveRooms(db);
    await logTv(code, t);
    return;
  }
  const { error } = await supabase.rpc('send_tv_message', { p_room: code, p_text: t, p_seconds: seconds });
  if (error) throw new Error(isMissingFn(error) ? NO_RIGHTS : error.message);
  await logTv(code, t);
}
const logTv = (code, t) => (t ? logAction('tv_message', code, t) : logAction('tv_clear', code));
export const clearTvMessage = (code) => sendTvMessage(code, '');

// ---- admin activity log ----
// Best effort on purpose: if the table is missing or the write fails, the admin action itself still goes through.
const LOG_KEY = 'tagayoke:admin-log';
const logMissing = (e) => !!e && (e.code === '42P01' || e.code === 'PGRST205' || /admin_log/i.test(e.message || ''));
export async function logAction(action, target = '', detail = '') {
  try {
    if (DEMO) {
      const all = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
      all.unshift({ id: uid(), at: new Date().toISOString(), admin_email: 'demo', action, target, detail });
      localStorage.setItem(LOG_KEY, JSON.stringify(all.slice(0, 200)));
      return;
    }
    const { data } = await supabase.auth.getSession();
    await supabase.from('admin_log').insert({ admin_email: data.session?.user?.email || null, action, target: target || null, detail: detail || null });
  } catch { /* never block the action */ }
}
export async function listLog(limit = 50) {
  if (DEMO) return { rows: JSON.parse(localStorage.getItem(LOG_KEY) || '[]').slice(0, limit), missing: false };
  const { data, error } = await supabase.from('admin_log').select('*').order('at', { ascending: false }).limit(limit);
  if (error) { if (logMissing(error)) return { rows: [], missing: true }; throw error; }
  return { rows: data, missing: false };
}

// A short description of a host, read just before it is ended.
async function roomInfo(code) {
  try {
    if (DEMO) {
      const r = loadRooms()[code];
      return `${r?.name || 'Unnamed'} · ${loadPeople().filter((p) => p.room_code === code).length} users · ${(r?.queue || []).length} songs queued`;
    }
    const [r, u, q] = await Promise.all([
      supabase.from('rooms').select('name').eq('code', code).maybeSingle(),
      supabase.from('participants').select('id', { count: 'exact', head: true }).eq('room_code', code),
      supabase.from('queue_items').select('id', { count: 'exact', head: true }).eq('room_code', code).neq('status', 'done'),
    ]);
    return `${r.data?.name || 'Unnamed'} · ${u.count ?? 0} users · ${q.count ?? 0} songs queued`;
  } catch { return ''; }
}

// ---- undo support: copy a row before removing it, put the same row back if the admin taps Undo ----
export async function snapshotPerson(id) {
  if (DEMO) return loadPeople().find((p) => p.id === id) || null;
  return check(await supabase.from('participants').select('*').eq('id', id).maybeSingle());
}
export async function restorePerson(row, label = '') {
  if (!row) throw new Error('Nothing to restore.');
  if (DEMO) { const all = loadPeople(); if (!all.some((p) => p.id === row.id)) savePeople([...all, row]); }
  else {
    const { error } = await supabase.from('participants').insert(row);
    if (error) throw new Error(error.code === '23503' ? 'That room has already closed.' : error.message);
  }
  await logAction('restore_user', label || row.name);
}
export async function snapshotQueueItem(code, id) {
  if (DEMO) {
    const q = loadRooms()[code]?.queue || [];
    const index = q.findIndex((i) => i.id === id);
    return index < 0 ? null : { item: q[index], index };
  }
  return check(await supabase.from('queue_items').select('*').eq('id', id).maybeSingle());
}
export async function restoreQueueItem(code, snap, label = '') {
  if (!snap) throw new Error('Nothing to restore.');
  if (DEMO) {
    const db = loadRooms();
    if (!db[code]) throw new Error('That room has already closed.');
    if (!db[code].queue) db[code].queue = [];
    db[code].queue.splice(Math.min(snap.index, db[code].queue.length), 0, snap.item);
    saveRooms(db);
  } else {
    const { error } = await supabase.from('queue_items').insert(snap);
    if (error) throw new Error(error.code === '23503' ? 'That room has already closed.' : error.message);
  }
  await logAction('restore_song', code, label);
}
