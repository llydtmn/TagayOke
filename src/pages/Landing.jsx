import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services';
import { APP_NAME, TAGLINE, USE_MOCK } from '../config/env';

export default function Landing() {
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const { state } = useLocation();
  const [err, setErr] = useState(state?.closed ? 'The host ended the session.' : '');

  const host = async () => { try { nav(`/host/${await api.createRoom()}`); } catch (e) { setErr(e.message); } };
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
        <button className="primary big" onClick={host}>Host on this screen</button>
        <form onSubmit={join} className="join">
          <label className="field"><span>Have a room code?</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={4} placeholder="ABCD" autoCapitalize="characters" />
          </label>
          <button className="ghost" type="submit">Join room</button>
        </form>
      </div>
      {err && <p className="error" role="alert">{err}</p>}
      {USE_MOCK && <p className="muted">Demo mode: open Host in one tab and Join in another tab of this browser.</p>}
      <p className="fine">Drink responsibly. Never drive after drinking.</p>
    </main>
  );
}