import { useEffect, useRef, useState } from 'react';
import { api } from '../services';

const POLL_MS = 3000;

// Watches for a message an admin sent to this room's TV.
// Returns { text, key, until } while one should be on screen, otherwise null.
export function useTvMessage(code) {
  const [msg, setMsg] = useState(null);
  const dismissed = useRef(null); // key of a message that already timed out here, so a late poll can't bring it back

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      let m;
      try { m = await api.getTvMessage(code); } catch { return; } // offline for a moment: keep what we have
      if (!alive) return;
      if (!m) { dismissed.current = null; setMsg(null); return; }
      if (m.key === dismissed.current) return;
      setMsg((cur) => (cur && cur.key === m.key ? cur : { text: m.text, key: m.key, until: Date.now() + m.left * 1000 }));
    };
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => { alive = false; clearInterval(t); };
  }, [code]);

  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => { dismissed.current = msg.key; setMsg(null); }, Math.max(0, msg.until - Date.now()));
    return () => clearTimeout(t);
  }, [msg]);

  return msg;
}
