// App-wide settings. Right now: the announcement shown on the landing page.
// Demo mode keeps it in localStorage; live mode uses the Supabase `app_settings` table (see supabase/app-settings.sql).
import { USE_MOCK } from '../config/env';
import { supabase } from './supabaseClient';

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
