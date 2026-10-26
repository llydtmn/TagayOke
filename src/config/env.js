export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const USE_MOCK = !SUPABASE_URL || !SUPABASE_ANON_KEY;
export const MAX_QUEUE = 12; // most songs allowed in a room's queue at once (also enforced in room-limit.sql)
export const APP_NAME = 'TagayOke';
export const TAGLINE = 'Sing. Sip. Repeat.';