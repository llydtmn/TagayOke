import { useEffect, useRef } from 'react';

// Smart TV and keyboard media keys. TV browsers report them as key names (standard) or key codes (webOS, Tizen, Android TV).
//   Play/Pause 179 · 10252   Play 415   Pause 19   Stop 178 · 413   Next 176 · 10233 · Fast-forward 417 (used as "next")
const TV_KEYS = ['MediaPlayPause', 'MediaPlay', 'MediaPause', 'MediaStop', 'MediaTrackNext', 'MediaFastForward'];

function actionFor(e) {
  const k = e.key; const c = e.keyCode;
  if (k === 'MediaPlayPause' || c === 179 || c === 10252) return 'toggle';
  if (k === 'MediaPlay' || c === 415) return 'play';
  if (k === 'MediaPause' || c === 19) return 'pause';
  if (k === 'MediaStop' || c === 178 || c === 413) return 'stop';
  if (k === 'MediaTrackNext' || k === 'MediaFastForward' || c === 176 || c === 10233 || c === 417) return 'next';
  return null;
}

// handlers: { toggle, play, pause, stop, next }, all optional. Always calls the latest handlers.
export function useMediaKeys(handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (e) => {
      const action = actionFor(e);
      const fn = action && ref.current[action];
      if (!fn) return;
      e.preventDefault();
      fn();
    };
    window.addEventListener('keydown', onKey);

    // Samsung (Tizen) only delivers media keys to the page after they are registered.
    try { TV_KEYS.forEach((k) => window.tizen?.tvinputdevice?.registerKey(k)); } catch { /* not a Tizen TV */ }

    // Media Session covers browsers that route hardware media keys there (Chrome, Android TV).
    const ms = navigator.mediaSession;
    const actions = { play: 'play', pause: 'pause', stop: 'stop', nexttrack: 'next' };
    if (ms) {
      Object.entries(actions).forEach(([act, name]) => {
        try { ms.setActionHandler(act, () => ref.current[name]?.()); } catch { /* action not supported */ }
      });
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      if (ms) Object.keys(actions).forEach((act) => { try { ms.setActionHandler(act, null); } catch { /* ignore */ } });
    };
  }, []);
}