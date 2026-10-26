// Demo backend: localStorage + BroadcastChannel. Open /host in one tab and /r in another to see live sync.
import { SEED_SONGS } from '../data/seedSongs';
import { makeRoomCode } from '../utils/roomCode';
import { MAX_QUEUE } from '../config/env';

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

export async function listSongs(q = '') {
  const s = q.trim().toLowerCase();
  if (!s) return allSongs();
  return allSongs().filter((x) =>
    String(x.code).includes(s) || x.title.toLowerCase().includes(s) || x.artist.toLowerCase().includes(s));
}
export async function searchOnline() {
  throw new Error('YouTube search needs the Supabase edge function. Connect Supabase to enable it.');
}
export async function createRoom() {
  const db = load(); const code = makeRoomCode();
  db[code] = { queue: [] }; save(db, code); return code;
}
export async function roomExists(code) { return !!load()[code]; }
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