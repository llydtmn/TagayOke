import { supabase } from './supabaseClient';
import { normalizeAccessCode } from '../utils/hostCode';
import { SUPABASE_URL, SUPABASE_ANON_KEY, MAX_QUEUE } from '../config/env';

export const mode = 'live';

const toSong = (r) => ({
  id: r.id, code: r.code, title: r.title, artist: r.artist, youtubeId: r.youtube_id, language: r.language,
});
const toItem = (r) => ({ id: r.id, singer: r.singer, status: r.status, song: toSong(r.song) });
const check = ({ data, error }) => { if (error) throw error; return data; };

// Sorted A to Z by title (then code, so paging stays stable when titles repeat).
export async function listSongs(q = '', offset = 0, limit = 100) {
  let query = supabase.from('songs').select('*').order('title').order('code').range(offset, offset + limit - 1);
  const s = q.trim().replace(/[,()%]/g, ' ');
  if (s) query = /^\d+$/.test(s) ? query.eq('code', Number(s)) : query.or(`title.ilike.%${s}%,artist.ilike.%${s}%`);
  return check(await query).map(toSong);
}
export async function addSong({ youtubeId, title, artist }) {
  const { data: found } = await supabase.from('songs').select('*').eq('youtube_id', youtubeId).maybeSingle();
  if (found) return toSong(found);
  const row = check(await supabase.from('songs')
    .insert({ title, artist: artist || 'Unknown', youtube_id: youtubeId, language: 'Other', source: 'user' })
    .select().single());
  return toSong(row);
}
export async function searchOnline(q) {
  const data = check(await supabase.functions.invoke('yt-search', { body: { q } }));
  return (data.songs || []).map(toSong);
}
// Turns an admin-issued access code into a room. The server checks the code, creates the room and starts the clock.
export async function redeemHostCode(input) {
  const t0 = Date.now();
  const { data, error } = await supabase.rpc('redeem_host_code', { p_code: normalizeAccessCode(input) });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { code: row.out_room, expiresAt: row.out_expires, serverOffset: new Date(row.out_now).getTime() - Date.now() + (Date.now() - t0) / 2 };
}
// How many more times this access code can start a session (needs supabase/host-code-remaining.sql).
export async function hostCodeRemaining(input) {
  const { data, error } = await supabase.rpc('host_code_remaining', { p_code: normalizeAccessCode(input) });
  if (error) throw new Error(error.message);
  return Number(data) || 0;
}
// Continue in the SAME room: the server checks the access code, uses it once more and resets the room's end time
// (needs supabase/continue-room.sql).
export async function extendRoom(code, input) {
  const { data, error } = await supabase.rpc('continue_room', { p_room: code, p_code: normalizeAccessCode(input) });
  if (error) throw new Error(error.message);
  return { expiresAt: data };
}
// Does the room still exist, when does it end, and how far is this device's clock from the server's?
export async function roomStatus(code) {
  const t0 = Date.now();
  const { data, error } = await supabase.rpc('room_status', { p_code: code });
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return { exists: !!row?.out_exists, expiresAt: row?.out_expires || null, serverOffset: new Date(row.out_now).getTime() - Date.now() + (Date.now() - t0) / 2 };
}
export async function roomExists(code) {
  try { return (await roomStatus(code)).exists; } catch { return false; }
}
// Host ends the session: deletes the room (and its queue) from Supabase.
export async function closeRoom(code) {
  await supabase.from('queue_items').delete().eq('room_code', code);
  check(await supabase.from('rooms').delete().eq('code', code));
}
// Used when the host tab/browser is closing. Normal requests get cancelled on page exit,
// so this uses a raw fetch with keepalive. Queue rows go away via ON DELETE CASCADE (see room-cleanup.sql).
export function closeRoomOnExit(code) {
  fetch(`${SUPABASE_URL}/rest/v1/rooms?code=eq.${encodeURIComponent(code)}`, {
    method: 'DELETE',
    keepalive: true,
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  }).catch(() => {});
}
// Fires cb when the room row is deleted.
export function subscribeRoom(code, cb) {
  const channel = supabase.channel(`room-closed:${code}`)
    .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
      () => cb())
    .subscribe();
  return () => supabase.removeChannel(channel);
}
export async function fetchQueue(code) {
  const data = check(await supabase.from('queue_items')
    .select('id, singer, status, created_at, song:songs(*)')
    .eq('room_code', code).neq('status', 'done').order('created_at'));
  return data.map(toItem);
}
export function subscribeQueue(code, cb) {
  const channel = supabase.channel(`room:${code}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'queue_items', filter: `room_code=eq.${code}` },
      () => fetchQueue(code).then(cb))
    .subscribe();
  return () => supabase.removeChannel(channel);
}
export async function enqueue(code, song, singer, opts = {}) {
  const { count } = await supabase.from('queue_items')
    .select('id', { count: 'exact', head: true }).eq('room_code', code).neq('status', 'done');
  if ((count ?? 0) >= MAX_QUEUE) throw new Error(`The queue is full (${MAX_QUEUE} songs max).`);
  const row = { room_code: code, song_id: song.id, singer };
  if (opts.first) {
    const { data } = await supabase.from('queue_items').select('created_at')
      .eq('room_code', code).eq('status', 'queued').order('created_at').limit(1);
    if (data?.length) row.created_at = new Date(new Date(data[0].created_at).getTime() - 1000).toISOString();
  }
  check(await supabase.from('queue_items').insert(row));
}
export async function removeItem(code, id) {
  check(await supabase.from('queue_items').delete().eq('id', id));
}
export async function advance(code) {
  const q = await fetchQueue(code);
  const playing = q.find((i) => i.status === 'playing');
  const next = q.find((i) => i.status === 'queued');
  if (playing) check(await supabase.from('queue_items').update({ status: 'done' }).eq('id', playing.id));
  if (next) check(await supabase.from('queue_items').update({ status: 'playing' }).eq('id', next.id));
}

// A TV or phone says "this video does not work". Fire and forget: a failed report must never disturb the song.
export async function reportSong(songId, reason = 'broken') {
  try { await supabase.rpc('report_song', { p_song_id: String(songId), p_reason: reason }); } catch { /* ignore */ }
}
