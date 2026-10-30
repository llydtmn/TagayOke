import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services';
import { APP_NAME, TAGLINE, USE_MOCK } from '../config/env';
import { normalizeAccessCode, accessKey } from '../utils/hostCode';
import { enterPageFullscreen, exitPageFullscreen } from '../utils/fullscreen';

export default function Landing() {
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const { state } = useLocation();
  const [err, setErr] = useState(
    state?.expired ? 'Your hosting time is up and the session has ended. Ask for a new access code to host again.'
      : state?.closed ? 'The host ended the session.' : '');
  const [asking, setAsking] = useState(false);   // true once "Host on this screen" was pressed
  const [access, setAccess] = useState('');
  const [busy, setBusy] = useState(false);

  // Back on the start page (session ended or time up): leave full screen.
  useEffect(() => { exitPageFullscreen(); }, []);

  const host = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    enterPageFullscreen(); // must happen right now, inside the tap, so the host screen opens already in full screen
    try {
      const { code: room } = await api.redeemHostCode(access);
      try { sessionStorage.setItem(accessKey(room), normalizeAccessCode(access)); } catch { /* private mode: no "continue" offer */ }
      nav(`/host/${room}`);
    } catch (x) { exitPageFullscreen(); setErr(x.message || 'Could not start hosting.'); }
    finally { setBusy(false); }
  };
  const join = async (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    (await api.roomExists(c)) ? nav(`/r/${c}`) : setErr(`No room "${c}". Check the code on the TV.`);
  };

  return (
    <main className="landing">
      <h1 className="logo">{APP_NAME}</h1>
      <p className="tagline">{TAGLINE}</p>
      <p className="lede">Reserve songs from your phone while someone else is mid-chorus. Numbered songs, a song book and a queue, like the real machine.</p>
      <div className="actions">
        {!asking ? (
          <button className="primary big" onClick={() => { setErr(''); setAsking(true); }}>Host on this screen</button>
        ) : (
          <form onSubmit={host} className="host-code">
            <label className="field"><span>Enter your host access code</span>
              <input value={access} onChange={(e) => setAccess(normalizeAccessCode(e.target.value))} maxLength={9}
                placeholder="XXXX-XXXX" autoCapitalize="characters" autoComplete="off" spellCheck={false} autoFocus />
            </label>
            <div className="host-code-btns">
              <button className="primary big" type="submit" disabled={busy || access.length < 9}>{busy ? 'Checking…' : 'Start hosting'}</button>
              <button className="ghost" type="button" onClick={() => { setAsking(false); setAccess(''); setErr(''); }}>Cancel</button>
            </div>
          </form>
        )}
        <form onSubmit={join} className="join">
          <label className="field"><span>Have a room code?</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={4} placeholder="ABCD" autoCapitalize="characters" />
          </label>
          <button className="ghost" type="submit">Join room</button>
        </form>
      </div>
      {err && <p className="error" role="alert">{err}</p>}
      {USE_MOCK && <p className="muted">Demo mode: create an access code in /admin first, then use it here. Open Host in one tab and Join in another tab of this browser.</p>}
      <p className="fine">Drink responsibly. Never drive after drinking.</p>
      {/* Hidden admin entrance: an invisible button sitting over one face in the background photo */}
      <button type="button" className="admin-secret" aria-label="Admin" tabIndex={-1} onClick={() => nav('/admin')} />
    </main>
  );
}
