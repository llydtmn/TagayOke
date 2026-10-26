import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services';

export function useQueue(code) {
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState('');
  const busy = useRef(false);

  const refresh = useCallback(
    () => api.fetchQueue(code).then(setQueue).catch((e) => setError(String(e.message || e))), [code]);

  useEffect(() => {
    refresh();
    return api.subscribeQueue(code, setQueue);
  }, [code, refresh]);

  // One action at a time, so a double tap or a double "ended" event can't skip two songs.
  // Resolves to true when the action worked, false when it failed or was ignored.
  const run = (fn) => async (...a) => {
    if (busy.current) return false;
    busy.current = true;
    setError('');
    try { await fn(code, ...a); await refresh(); return true; }
    catch (e) { setError(String(e.message || e)); return false; }
    finally { busy.current = false; }
  };

  return {
    queue, error,
    nowPlaying: queue.find((i) => i.status === 'playing') || null,
    upNext: queue.filter((i) => i.status === 'queued'),
    add: run(api.enqueue), remove: run(api.removeItem), advance: run(api.advance),
  };
}