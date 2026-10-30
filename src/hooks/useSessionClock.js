import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services';

// Counts down to the room's end time using the SERVER clock, so a wrong clock on the TV can't stretch a session.
// Re-checks every 20 s, which also picks up time an admin adds from the dashboard.
// `left` is milliseconds remaining, or null while loading / when the room has no limit.
export function useSessionClock(code, onExpire) {
  const [expiresAt, setExpiresAt] = useState(null);
  const [, tick] = useState(0);
  const offset = useRef(0);
  const synced = useRef(false);
  const fired = useRef(false);

  const sync = useCallback(async () => {
    try {
      const s = await api.roomStatus(code);
      offset.current = s.serverOffset;
      synced.current = true;
      setExpiresAt(s.expiresAt ? new Date(s.expiresAt).getTime() : null);
    } catch { /* offline for a moment: keep counting with the last known end time */ }
  }, [code]);

  useEffect(() => { sync(); const t = setInterval(sync, 20000); return () => clearInterval(t); }, [sync]);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);

  const left = synced.current && expiresAt != null ? expiresAt - (Date.now() + offset.current) : null;

  useEffect(() => {
    if (left != null && left > 0) fired.current = false;
    if (left != null && left <= 0 && !fired.current) { fired.current = true; onExpire(); }
  }, [left, onExpire]);

  return { left, expiresAt, resync: sync };
}
