// App-wide settings. Right now: the announcement shown on the landing page.
// Demo mode keeps it in localStorage; live mode uses the Supabase `app_settings` table (see supabase/app-settings.sql).
import { USE_MOCK } from '../config/env';
import { supabase } from './supabaseClient';
import { makeAccessCode } from '../utils/hostCode';

const KEY = 'tagayoke:settings';
const ANNOUNCEMENT = 'announcement';
export const DEFAULT_ANNOUNCEMENT = { title: 'Announcement!', message: '', visible: false, updated_at: null };

const check = ({ data, error }) => { if (error) throw error; return data; };
const loadLocal = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };

// Everyone (landing page): returns the announcement, or null when it is hidden or empty.
export async function getPublicAnnouncement() {
  try {
    const a = await getAnnouncement();
    return a.visible && a.message.trim() ? a : null;
  } catch { return null; } // never break the landing page over an announcement
}

// Admin: always returns the saved announcement, hidden or not.
export async function getAnnouncement() {
  if (USE_MOCK) return { ...DEFAULT_ANNOUNCEMENT, ...(loadLocal()[ANNOUNCEMENT] || {}) };
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', ANNOUNCEMENT).maybeSingle();
  if (error) throw error;
  return { ...DEFAULT_ANNOUNCEMENT, ...(data?.value || {}) };
}

export async function saveAnnouncement({ title, message, visible }) {
  const value = {
    title: (title || '').trim() || DEFAULT_ANNOUNCEMENT.title,
    message: (message || '').trim(),
    visible: !!visible,
    updated_at: new Date().toISOString(),
  };
  if (USE_MOCK) {
    localStorage.setItem(KEY, JSON.stringify({ ...loadLocal(), [ANNOUNCEMENT]: value }));
    return value;
  }
  check(await supabase.from('app_settings').upsert({ key: ANNOUNCEMENT, value, updated_at: value.updated_at }, { onConflict: 'key' }));
  return value;
}

// ---------- free host code ----------
// The announcement can contain {{FREE_CODE}}. Guests see a real, unused host code in its place. As soon as that code
// is used (or revoked), the next visit creates a fresh one, so there is always one free code waiting.
// Live mode: the Supabase function get_free_host_code() does the work (see supabase/free-host-code.sql).
export const FREE_TOKEN = '{{FREE_CODE}}';
export const FREE_LABEL = 'Free welcome code'; // label on the auto-made codes (shows in Codes and History)
export const DEFAULT_FREE = { enabled: false, minutes: 60, onePerDevice: true }; // minutes 0 = unlimited session
const FREE = 'free_code';
const CODES = 'tagayoke:mock-codes';       // demo mode: same store the mock adapter reads
const SHOWN = 'tagayoke:free-shown';       // the free code this device was last shown
const CLAIMED = 'tagayoke:free-claimed';   // set once this device used a free code

export async function getFreeConfig() {
  if (USE_MOCK) return { ...DEFAULT_FREE, ...(loadLocal()[FREE] || {}) };
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', FREE).maybeSingle();
  if (error) throw error;
  return { ...DEFAULT_FREE, ...(data?.value || {}) };
}

export async function saveFreeConfig({ enabled, minutes, onePerDevice }) {
  const value = { enabled: !!enabled, minutes: Math.max(0, Number(minutes) || 0), onePerDevice: !!onePerDevice };
  if (USE_MOCK) { localStorage.setItem(KEY, JSON.stringify({ ...loadLocal(), [FREE]: value })); return value; }
  check(await supabase.from('app_settings').upsert({ key: FREE, value, updated_at: new Date().toISOString() }, { onConflict: 'key' }));
  return value;
}

// Landing page: the free code to show right now, or null (feature off, already claimed on this device, or any error).
export async function getFreeCode() {
  try {
    const cfg = await getFreeConfig();
    if (!cfg.enabled) return null;
    if (cfg.onePerDevice && localStorage.getItem(CLAIMED)) return null;
    let code = null;
    if (USE_MOCK) {
      const all = JSON.parse(localStorage.getItem(CODES) || '[]');
      const open = all.filter((c) => c.label === FREE_LABEL && !c.revoked && c.uses < c.max_uses)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      if (open) code = open.code;
      else {
        code = makeAccessCode();
        all.push({ id: Math.random().toString(36).slice(2), code, label: FREE_LABEL, duration_seconds: cfg.minutes ? cfg.minutes * 60 : null,
          max_uses: 1, uses: 0, revoked: false, redeem_by: null, created_at: new Date().toISOString(), last_used_at: null });
        localStorage.setItem(CODES, JSON.stringify(all));
      }
    } else {
      const { data, error } = await supabase.rpc('get_free_host_code');
      if (error) throw error;
      code = data || null;
    }
    if (code) localStorage.setItem(SHOWN, code);
    return code;
  } catch { return null; }
}

// Called after a host code worked: if it was the free one, this device will not be offered another.
export function noteFreeCodeUsed(access) {
  try { if (access && localStorage.getItem(SHOWN) === access) localStorage.setItem(CLAIMED, '1'); } catch { /* private mode */ }
}

// Puts the code into the message. With no code, the lines that mention {{FREE_CODE}} are dropped.
export function fillFreeCode(message, code) {
  if (!message.includes(FREE_TOKEN)) return message;
  if (code) return message.split(FREE_TOKEN).join(code);
  return message.split('\n').filter((l) => !l.includes(FREE_TOKEN)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
