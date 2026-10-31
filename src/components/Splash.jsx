import { useCallback, useEffect, useState } from 'react';
import { APP_NAME, TAGLINE } from '../config/env';
import { HatchDefs, Mic, Notes, Waves, Burst } from './VintageArt';
import '../styles/splash.css';

const OUT_MS = 650; // length of the exit wipe (keep in sync with sp-out in splash.css)

// Animated intro shown once per tab before the landing page. Tap, click or press any key to skip.
export default function Splash({ onDone, showMs = 3000 }) {
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ms = reduced ? 900 : showMs;
  const [out, setOut] = useState(false);
  const leave = useCallback(() => setOut(true), []);

  useEffect(() => { const t = setTimeout(leave, ms); return () => clearTimeout(t); }, [ms, leave]);
  useEffect(() => { if (!out) return undefined; const t = setTimeout(onDone, reduced ? 300 : OUT_MS); return () => clearTimeout(t); }, [out, onDone, reduced]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', leave);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', leave); };
  }, [leave]);

  return (
    <div className={`vt splash${out ? ' out' : ''}`} style={{ '--sp-ms': `${ms}ms` }} onClick={leave} role="status" aria-label={`Loading ${APP_NAME}`}>
      <HatchDefs />
      <div className="sp-stage">
        <div className="sp-hero" aria-hidden="true">
          <span className="sp-burst"><Burst size={230} /></span>
          <span className="sp-mic"><Mic size={132} /></span>
          <span className="sp-note n1"><Notes size={46} /></span>
          <span className="sp-note n2"><Notes size={34} /></span>
          <span className="sp-wave w1"><Waves size={84} /></span>
          <span className="sp-wave w2"><Waves size={64} /></span>
        </div>
        <div className="sp-logo" aria-hidden="true">
          {[...APP_NAME].map((c, i) => <span key={i} style={{ '--i': i, '--r': `${i % 2 ? 9 : -9}deg` }}>{c}</span>)}
        </div>
        <p className="sp-tag" aria-hidden="true">{TAGLINE}</p>
        <div className="sp-load" aria-hidden="true"><i /></div>
        <p className="sp-hint" aria-hidden="true">Warming up the mic… tap to skip</p>
      </div>
    </div>
  );
}
