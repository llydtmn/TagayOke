import { useCallback, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services';
import { useQueue } from '../hooks/useQueue';
import { useSessionClock } from '../hooks/useSessionClock';
import SessionTimer from '../components/SessionTimer';
import { joinUrl } from '../utils/roomCode';
import Stage from '../components/Stage';
import QueueList from '../components/QueueList';

export default function Host() {
  const { code } = useParams();
  const nav = useNavigate();
  const [exists, setExists] = useState(null);
  const [started, setStarted] = useState(false); // one tap satisfies browser autoplay rules
  const { nowPlaying, upNext, remove, advance, error } = useQueue(code);

  useEffect(() => { api.roomExists(code).then(setExists); }, [code]);

  // Time's up: end the room for everyone (phones are sent home by the same "room closed" signal) and go back to the start.
  const onExpire = useCallback(async () => {
    try { await api.closeRoom(code); } catch { /* the server job may have removed it already */ }
    nav('/', { replace: true, state: { expired: true } });
  }, [code, nav]);
  const { left } = useSessionClock(code, onExpire);

  // The room only ends when the host presses "End session". Refreshing the page keeps it alive.
  const endSession = async () => {
    try { await api.closeRoom(code); } catch { /* room may already be gone */ }
    nav('/', { replace: true });
  };
  useEffect(() => {
    if (started && !nowPlaying && upNext.length) advance();
  }, [started, nowPlaying, upNext.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (exists === false) {
    return <main className="landing"><p className="error">Room {code} was not found.</p><Link to="/">Back to start</Link></main>;
  }

  return (
    <main className="host">
      <div className="host-main">
        <Stage item={nowPlaying} roomCode={code} onEnded={advance} upNext={upNext} left={left} />
        {!started && (
          <div className="gate">
            <button className="primary big" onClick={() => setStarted(true)}>Start the session</button>
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