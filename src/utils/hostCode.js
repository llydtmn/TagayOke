// Access codes handed out by the admin (e.g. K7M2-Q9XA). Same safe alphabet as room codes, plus digits.
const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const makeAccessCode = () => {
  const r = crypto.getRandomValues(new Uint32Array(8));
  const s = Array.from(r, (n) => CHARS[n % CHARS.length]).join('');
  return `${s.slice(0, 4)}-${s.slice(4)}`;
};
// People may type it without the dash, in lowercase, with spaces.
export const normalizeAccessCode = (v) => {
  const s = String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return s.length > 4 ? `${s.slice(0, 4)}-${s.slice(4, 8)}` : s;
};
// Seconds -> "1h 30m 5s".
export const formatDuration = (secs) => {
  const t = Math.max(0, Math.round(secs || 0));
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return [h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(' ') || '0s';
};
// Milliseconds left, as "2:59:03" or "4:12".
export const formatLeft = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
};

// Where the host screen remembers which access code started a room (this tab only), so it can offer "continue" when time is up.
export const accessKey = (room) => `tagayoke:access:${room}`;
