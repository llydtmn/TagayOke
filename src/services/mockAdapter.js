// Demo backend: localStorage + BroadcastChannel. Open /host in one tab and /r in another to see live sync.
import { SEED_SONGS } from '../data/seedSongs';
import { makeRoomCode } from '../utils/roomCode';
import { MAX_QUEUE } from '../config/env';
import { normalizeAccessCode } from '../utils/hostCode';

const KEY = 'tagayoke:mock';
const bc = new BroadcastChannel('tagayoke');
const load = () => JSON.parse(localStorage.getItem(KEY) || '{}');
const save = (db, code) => { localStorage.setItem(KEY, JSON.stringify(db)); bc.postMessage({ code }); };
const uid = () => Math.random().toString(36).slice(2, 10);

export const mode = 'demo';

const CUSTOM = 'tagayoke:custom-songs';
const customSongs = () => JSON.parse(localStorage.getItem(CUSTOM) || '[]');
const allSongs = () => [...SEED_SONGS, ...customSongs()];

export async function addSong({ youtubeId, title, artist }) {
  const all = allSongs();
  const hit = all.find((s) => s.youtubeId === youtubeId);
  if (hit) return hit;
  const code = Math.max(...all.map((s) => s.code)) + 1;
  const song = { id: String(code), code, title, artist: artist || 'Unknown', language: 'Other', youtubeId };
  localStorage.setItem(CUSTOM, JSON.stringify([...customSongs(), song]));
  return song;
}

// Sorted A to Z by title (then code).
const byTitle = (a, b) =>
  a.title.localeCompare(b.title, undefined, { sensitivity: 'base', ignorePunctuation: true }) || a.code - b.code;

export async function listSongs(q = '', offset = 0, limit = 100) {
  const s = q.trim().toLowerCase();
  const list = !s ? allSongs() : allSongs().filter((x) =>
    String(x.code).includes(s) || x.title.toLowerCase().includes(s) || x.artist.toLowerCase().includes(s));
  return list.sort(byTitle).slice(offset, offset + limit);
}
export async function searchOnline() {
  throw new Error('YouTube search needs the Supabase edge function. Connect Supabase to enable it.');
}
// ---- host access codes (demo mode keeps them in localStorage; the admin page writes them) ----
const CODES = 'tagayoke:mock-codes';
const loadCodes = () => JSON.parse(localStorage.getItem(CODES) || '[]');
const saveCodes = (all) => localStorage.setItem(CODES, JSON.stringify(all));
const GRACE_MS = 10 * 60 * 1000; // an expired room stays for a while so the host can press "Continue"
const expired = (r) => r && r.expires_at && new Date(r.expires_at).getTime() + GRACE_MS <= Date.now();
// Drops rooms whose time is up (the live backend does this with a scheduled job).
const sweep = () => {
  const db = load(); const gone = [];
  for (const c of Object.keys(db)) if (expired(db[c])) { delete db[c]; gone.push(c); }
  if (gone.length) { localStorage.setItem(KEY, JSON.stringify(db)); gone.forEach((c) => bc.postMessage({ code: c })); }
  return db;
};

export async function redeemHostCode(input) {
  const wanted = normalizeAccessCode(input);
  const all = loadCodes();
  const c = all.find((x) => x.code === wanted);
  if (!c || c.revoked) throw new Error('That access code is not valid.');
  if (c.redeem_by && new Date(c.redeem_by).getTime() < Date.now()) throw new Error('That access code has expired.');
  if (c.uses >= c.max_uses) throw new Error('That access code has already been used.');
  const db = sweep();
  let code; do { code = makeRoomCode(); } while (db[code]);
  const expiresAt = new Date(Date.now() + (c.duration_seconds ?? c.duration_minutes * 60) * 1000).toISOString();
  db[code] = { queue: [], created_at: new Date().toISOString(), expires_at: expiresAt };
  save(db, code);
  c.uses += 1; c.last_used_at = new Date().toISOString(); saveCodes(all);
  return { code, expiresAt, serverOffset: 0 };
}
// How many more times this access code can start a session (0 when unknown, revoked or out of date).
export async function hostCodeRemaining(input) {
  const c = loadCodes().find((x) => x.code === normalizeAccessCode(input));
  if (!c || c.revoked) return 0;
  if (c.redeem_by && new Date(c.redeem_by).getTime() < Date.now()) return 0;
  return Math.max(c.max_uses - c.uses, 0);
}
// Continue in the SAME room: uses the access code once more and gives the room a fresh full session.
export async function extendRoom(code, input) {
  const all = loadCodes();
  const c = all.find((x) => x.code === normalizeAccessCode(input));
  if (!c || c.revoked) throw new Error('That access code is not valid.');
  if (c.redeem_by && new Date(c.redeem_by).getTime() < Date.now()) throw new Error('That access code has expired.');
  if (c.uses >= c.max_uses) throw new Error('That access code has already been used.');
  const db = load();
  if (!db[code]) throw new Error('This room has already closed.');
  const expiresAt = new Date(Date.now() + (c.duration_seconds ?? c.duration_minutes * 60) * 1000).toISOString();
  db[code].expires_at = expiresAt;
  save(db, code);
  c.uses += 1; c.last_used_at = new Date().toISOString(); saveCodes(all);
  return { expiresAt };
}
export async function roomStatus(code) {
  const r = sweep()[code];
  return { exists: !!r, expiresAt: r?.expires_at || null, serverOffset: 0 };
}
export async function roomExists(code) { return !!sweep()[code]; }
export async function closeRoom(code) {
  const db = load(); delete db[code]; save(db, code);
}
export function closeRoomOnExit(code) {
  const db = load(); delete db[code]; save(db, code);
}
export function subscribeRoom(code, cb) {
  const h = (e) => { if (e.data.code === code && !load()[code]) cb(); };
  bc.addEventListener('message', h);
  return () => bc.removeEventListener('message', h);
}
export async function fetchQueue(code) { return load()[code]?.queue ?? []; }
export function subscribeQueue(code, cb) {
  const h = (e) => { if (e.data.code === code) fetchQueue(code).then(cb); };
  bc.addEventListener('message', h);
  return () => bc.removeEventListener('message', h);
}
export async function enqueue(code, song, singer, opts = {}) {
  const db = load(); if (!db[code]) return;
  if (db[code].queue.length >= MAX_QUEUE) throw new Error(`The queue is full (${MAX_QUEUE} songs max).`);
  const item = { id: uid(), singer, status: 'queued', song };
  const q = db[code].queue;
  const at = opts.first ? q.findIndex((x) => x.status === 'queued') : -1;
  if (at === -1) q.push(item); else q.splice(at, 0, item);
  save(db, code);
}
export async function removeItem(code, id) {
  const db = load(); if (!db[code]) return;
  db[code].queue = db[code].queue.filter((i) => i.id !== id); save(db, code);
}
export async function advance(code) {
  const db = load(); if (!db[code]) return;
  db[code].queue = db[code].queue.filter((i) => i.status !== 'playing');
  const next = db[code].queue.find((i) => i.status === 'queued');
  if (next) next.status = 'playing';
  save(db, code);
}