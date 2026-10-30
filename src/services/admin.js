// Everything the admin dashboard reads and writes. Demo mode uses localStorage; live mode uses Supabase.
import { USE_MOCK } from '../config/env';
import { supabase } from './supabaseClient';
import { SEED_SONGS } from '../data/seedSongs';
import { makeRoomCode } from '../utils/roomCode';
import { PEOPLE_KEY } from './presence';
import { makeAccessCode } from '../utils/hostCode';

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
  if (DEMO) { const db = loadRooms(); delete db[code]; saveRooms(db); savePeople(loadPeople().filter((p) => p.room_code !== code)); return; }
  check(await supabase.from('rooms').delete().eq('code', code)); // queue and users go with it (ON DELETE CASCADE)
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
export async function createCode({ label, seconds, maxUses, redeemByHours }) {
  const row = {
    code: makeAccessCode(), label: label || null, duration_seconds: seconds, max_uses: maxUses || 1,
    redeem_by: redeemByHours ? new Date(Date.now() + redeemByHours * 3600000).toISOString() : null,
  };
  if (DEMO) { saveCodes([...loadCodes(), { ...row, id: uid(), uses: 0, revoked: false, created_at: new Date().toISOString(), last_used_at: null }]); return row.code; }
  check(await supabase.from('host_codes').insert(row));
  return row.code;
}
export async function setCodeRevoked(id, revoked) {
  if (DEMO) { saveCodes(loadCodes().map((c) => (c.id === id ? { ...c, revoked } : c))); return; }
  check(await supabase.from('host_codes').update({ revoked }).eq('id', id));
}
export async function deleteCode(id) {
  if (DEMO) { saveCodes(loadCodes().filter((c) => c.id !== id)); return; }
  check(await supabase.from('host_codes').delete().eq('id', id));
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
export async function deletePerson(id) {
  if (DEMO) { savePeople(loadPeople().filter((p) => p.id !== id)); return; }
  check(await supabase.from('participants').delete().eq('id', id));
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
  if (id) check(await supabase.from('songs').update(row).eq('id', id));
  else check(await supabase.from('songs').insert({ ...row, source: 'admin' }));
}
export async function deleteSong(id) {
  const { error } = await supabase.from('songs').delete().eq('id', id);
  if (error?.code === '23503') throw new Error('That song is in a queue right now. Try again after it has played.');
  if (error) throw error;
}
