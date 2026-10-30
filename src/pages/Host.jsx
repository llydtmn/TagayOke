import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services';
import { useQueue } from '../hooks/useQueue';
import { useSessionClock } from '../hooks/useSessionClock';
import SessionTimer from '../components/SessionTimer';
import { joinUrl } from '../utils/roomCode';
import { accessKey } from '../utils/hostCode';
import Stage from '../components/Stage';
import QueueList from '../components/QueueList';
import { enterPageFullscreen, fsNow } from '../utils/fullscreen';

// Keyed by room code, so continuing into a new room starts the screen fresh.
export default function Host() {
  const { code } = useParams();
  return <HostRoom key={code} code={code} />;
}

function HostRoom({ code }) {
  const nav = useNavigate();
  const [exists, setExists] = useState(null);
  const [started, setStarted] = useState(false); // one tap satisfies browser autoplay rules
  const [timeUp, setTimeUp] = useState(null);   // { remaining } while we ask "continue?"
  const [busy, setBusy] = useState(false);
  const [timeErr, setTimeErr] = useState('');
  const [fs, setFs] = useState(fsNow); // in full screen the TV fills the whole display and the side panel hides
  useEffect(() => {
    const sync = () => setFs(fsNow());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);
  const { nowPlaying, upNext, remove, advance, error } = useQueue(code);

  // Playback position of the current song, kept up to date by the player (seconds).
  const pos = useRef(0);
  useEffect(() => { pos.current = 0; }, [nowPlaying?.id]);

  // Where the song stopped when time ran out, so it can carry on from there after "Continue".
  const [resumeAt, setResumeAt] = useState(null); // { itemId, at }
  const startAt = resumeAt && nowPlaying && resumeAt.itemId === nowPlaying.id ? resumeAt.at : 0;

  useEffect(() => { api.roomExists(code).then(setExists); }, [code]);

  // Time's up: end the room for everyone (phones are sent home by the same "room closed" signal) and go back to the start.
  const finishExpired = useCallback(async () => {
    try { await api.closeRoom(code); } catch { /* the server job may have removed it already */ }
    try { sessionStorage.removeItem(accessKey(code)); } catch { /* ignore */ }
    nav('/', { replace: true, state: { expired: true } });
  }, [code, nav]);

  // If the access code that started this room has uses left, ask whether to continue. Otherwise (single-use code,
  // or we don't know the code) there is nothing to ask: end like before.
  const onExpire = useCallback(async () => {
    let remaining = 0;
    try {
      const access = sessionStorage.getItem(accessKey(code));
      if (access) remaining = await api.hostCodeRemaining(access);
    } catch { /* can't tell: treat as no uses left */ }
    if (remaining > 0) setTimeUp({ remaining }); else finishExpired();
  }, [code, finishExpired]);
  const { left, resync } = useSessionClock(code, onExpire);

  // An admin added time while the question was showing: carry on.
  useEffect(() => { if (timeUp && left != null && left > 0) setTimeUp(null); }, [left, timeUp]);

  // Use the access code again and stay in the SAME room: same QR, same queue, and the song carries on where it stopped.
  const continueSession = async () => {
    setBusy(true); setTimeErr('');
    try {
      const access = sessionStorage.getItem(accessKey(code));
      const at = Math.max(0, Math.floor(pos.current || 0));
      await api.extendRoom(code, access);
      if (nowPlaying) setResumeAt({ itemId: nowPlaying.id, at });
      await resync();
      setTimeUp(null);
    } catch (x) {
      setTimeErr(x.message || 'Could not continue.');
    }
    setBusy(false);
  };

  // The room only ends when the host presses "End session". Refreshing the page keeps it alive.
  const endSession = async () => {
    try { await api.closeRoom(code); } catch { /* room may already be gone */ }
    try { sessionStorage.removeItem(accessKey(code)); } catch { /* ignore */ }
    nav('/', { replace: true });
  };
  useEffect(() => {
    if (started && !nowPlaying && upNext.length) advance();
  }, [started, nowPlaying, upNext.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (exists === false) {
    return <main className="landing"><p className="error">Room {code} was not found.</p><Link to="/">Back to start</Link></main>;
  }

  return (
    <main className={`host${fs ? ' host-fs' : ''}`}>
      <div className="host-main">
        <Stage item={nowPlaying} roomCode={code} onEnded={advance} upNext={upNext} left={left} startAt={startAt} onPosition={(t) => { pos.current = t; }}
          timeUp={timeUp && { remaining: timeUp.remaining, onContinue: continueSession, onEnd: finishExpired, busy, error: timeErr }} />
        {!started && (
          <div className="gate">
            <button className="primary big" onClick={() => { enterPageFullscreen(); setStarted(true); }}>Start the session</button>
            <p className="muted">One tap lets the browser play sound automatically.</p>
          </div>
        )}
        <SessionTimer left={left} />
        {started && nowPlaying && <button className="ghost" onClick={advance}>Skip this song</button>}
        <button className="ghost" onClick={endSession}>End session</button>
      </div>
      <aside className="host-side">
        {/* While idle, the big QR lives on the TV screen. Show this card before the session starts and while a song plays. */}
        {(nowPlaying || !started) && (
          <div className="join-card">
            <QRCodeSVG value={joinUrl(code)} size={132} bgColor="#fff6c2" fgColor="#0a1650" />
            <div>
              <p className="muted">Scan to join, or enter</p>
              <p className="room-code">{code}</p>
            </div>
          </div>
        )}
        <h3>Up next{upNext.length ? ` (${upNext.length})` : ''}</h3>
        <QueueList items={upNext} onRemove={remove} canRemoveAll empty="Queue is empty. Reserve a song from your phone." />
        {error && <p className="error">{error}</p>}
      </aside>
    </main>
  );
}