// Records each phone that joins a room, so the admin dashboard can count users per host.
import { USE_MOCK } from '../config/env';
import { supabase } from './supabaseClient';

export const PEOPLE_KEY = 'tagayoke:mock-people';
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export function deviceId() {
  try {
    let id = localStorage.getItem('tagayoke:device');
    if (!id) { id = uid(); localStorage.setItem('tagayoke:device', id); }
    return id;
  } catch { return 'anon'; }
}

const loadPeople = () => JSON.parse(localStorage.getItem(PEOPLE_KEY) || '[]');
const savePeople = (all) => localStorage.setItem(PEOPLE_KEY, JSON.stringify(all));

// Called once when a phone enters a room. Keeps an existing record (and any name an admin set) as is.
export async function joinRoom(code, name) {
  const now = new Date().toISOString();
  const device = deviceId();
  if (USE_MOCK) {
    const all = loadPeople();
    if (!all.some((p) => p.room_code === code && p.device_id === device)) {
      all.push({ id: uid(), room_code: code, device_id: device, name, joined_at: now, last_seen: now });
      savePeople(all);
    }
    return;
  }
  const { error } = await supabase.from('participants')
    .upsert({ room_code: code, device_id: device, name, last_seen: now }, { onConflict: 'room_code,device_id', ignoreDuplicates: true });
  if (error) throw error;
}

// Called every ~30 seconds while the phone has the room open.
export async function pingRoom(code) {
  const now = new Date().toISOString();
  const device = deviceId();
  if (USE_MOCK) {
    const all = loadPeople();
    const me = all.find((p) => p.room_code === code && p.device_id === device);
    if (me) { me.last_seen = now; savePeople(all); }
    return;
  }
  const { error } = await supabase.from('participants').update({ last_seen: now }).eq('room_code', code).eq('device_id', device);
  if (error) throw error;
}
