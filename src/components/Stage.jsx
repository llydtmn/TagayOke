import { fsActive, enterPageFullscreen, exitPageFullscreen } from '../utils/fullscreen';
import { useCallback, useEffect, useRef, useState } from 'react';
import YouTubePlayer from './YouTubePlayer';
import DemoStage from './DemoStage';
import IdleTV from './IdleTV';
import TvMessage from './TvMessage';
import { formatLeft } from '../utils/hostCode';
import Icon from './Icon';
import { api } from '../services';

const MAX_SHOWN = 4; // how many reserved songs fit on the top bar before "+N more"

// Top-bar rotation during a song. Each message shows twice per song, then the bar returns to the reserved list.
const MSG_SECONDS = 5;        // how long "Current song" / "Next song" stays up (3 to 5 is a good range)
const FIRST_CURRENT_AT = 3;   // seconds into the song
// Later windows are fractions of the song: "next" at 25% and 75%, "current" again at 50%.
// A 3:30 song therefore shows: current at 0:03, next at 0:52, current at 1:45, next at 2:37.
function pickMode(t, total) {
  if (!total) return 'queue';
  const windows = total >= 60
    ? [['current', FIRST_CURRENT_AT], ['next', total * 0.25], ['current', total * 0.5], ['next', total * 0.75]]
    : [['current', 2], ['next', Math.max(8, total * 0.55)]]; // very short clips (demo songs)
  const hit = windows.find(([, at]) => t >= at && t < at + MSG_SECONDS);
  return hit ? hit[0] : 'queue';
}

const WARN_MS = 10 * 60 * 1000;   // timer turns pink
const REMIND_MS = 60 * 1000;      // pop-up reminder fires when this much time is left
const REMIND_SHOW_MS = 10 * 1000; // how long the pop-up stays on screen

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

// Pop-up shown once when 1 minute is left. Lives inside the stage box, so it also shows in full screen.
function TimeReminder({ left }) {
  const [show, setShow] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (left == null) return;
    if (left > REMIND_MS) { fired.current = false; return; } // time was added: allow the reminder again
    if (left > 0 && !fired.current) {
      fired.current = true;
      setShow(true);
    }
  }, [left]);

  useEffect(() => {
    if (!show) return undefined;
    const t = setTimeout(() => setShow(false), REMIND_SHOW_MS);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;
  return (
    <div className="time-reminder" role="alert">
      <span className="time-reminder-icon" aria-hidden="true">⏰</span>
      <div>
        <p className="time-reminder-title">1 minute left!</p>
        <p className="time-reminder-sub">The session ends soon. Finish up your song.</p>
      </div>
    </div>
  );
}

// Shown when the clock hits zero and the access code still has uses left. Lives inside the stage box so it works in full screen.
function TimeUpPanel({ timeUp }) {
  const { remaining, onContinue, onEnd, busy, error } = timeUp;
  return (
    <div className="timeup" role="alertdialog" aria-live="assertive">
      <div className="timeup-card">
        <p className="timeup-icon" aria-hidden="true">⏰</p>
        <h2 className="timeup-title">Time's up!</h2>
        <p className="timeup-text">
          This access code can be used {remaining} more {remaining === 1 ? 'time' : 'times'}. Continue to keep going in this room with a fresh session.
        </p>
        <div className="timeup-btns">
          <button className="primary big" autoFocus onClick={onContinue} disabled={busy}>{busy ? 'Starting…' : 'Continue session'}</button>
          <button className="ghost" onClick={onEnd} disabled={busy}>End session</button>
        </div>
        <p className="timeup-note">Your reserved songs stay, and the current song carries on where it stopped.</p>
        {error && <p className="error" role="alert">{error}</p>}
      </div>
    </div>
  );
}

// The top bar of a traditional videoke: reserved count, then the reserved songs / current song / next song.
function ReservedBar({ item, upNext, mode, left }) {
  const nextItem = upNext[0];
  const view = mode === 'next' && !nextItem ? 'queue' : mode; // nothing to announce when the queue is empty
  const shown = upNext.slice(0, MAX_SHOWN);
  const more = upNext.length - shown.length;

  return (
    <div className="reserved-bar" role="status" aria-live="polite">
      <div className="reserved-count">
        <span className="reserved-label">RESERVED</span>
        <span className="reserved-num">{upNext.length}</span>
      </div>
      <span className="reserved-colon" aria-hidden="true">:</span>

      {view === 'current' && (
        <p className="reserved-msg" key="current">
          <span className="msg-label">Current song:</span>
          <b className="msg-title">{item.song.title}</b>
          <span className="msg-sub">· {item.song.artist}</span>
        </p>
      )}

      {view === 'next' && (
        <p className="reserved-msg" key="next">
          <span className="msg-label next">Next song:</span>
          <b className="msg-title">{nextItem.song.title}</b>
          <span className="msg-sub">· {nextItem.singer}</span>
        </p>
      )}

      {view === 'queue' && (shown.length ? (
        <ol className="reserved-list" key="queue">
          {shown.map((i, idx) => (
            <li key={i.id}>
              <span className="reserved-pos">{idx + 1}</span>
              <span className="reserved-code">#{i.song.code}</span>
              <span className="reserved-title">{i.song.title}</span>
              <span className="reserved-singer">{i.singer}</span>
            </li>
          ))}
          {more > 0 && <li className="reserved-more">+{more} more</li>}
        </ol>
      ) : (
        <p className="reserved-empty" key="empty">No reserved songs. Reserve one from your phone.</p>
      ))}

      {left != null && (
        <div className={`fs-timer ${left <= WARN_MS ? 'warn' : ''} ${left <= REMIND_MS ? 'urgent' : ''}`} role="timer" aria-live="off">
          <span className="fs-timer-label">Session ends in</span>
          <b className="fs-timer-time">{formatLeft(left)}</b>
        </div>
      )}
    </div>
  );
}

export default function Stage({ item, roomCode, onEnded, upNext = [], left = null, timeUp = null, startAt = 0, onPosition, tvMessage = null }) {
  const screen = useRef(null);
  const [isFs, setIsFs] = useState(() => !!fsElement()); // may already be in full screen when this screen opens
  const [mode, setMode] = useState('queue'); // 'queue' | 'current' | 'next'

  useEffect(() => {
    const sync = () => setIsFs(!!fsElement());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  // New song: start from the reserved list again.
  useEffect(() => { setMode('queue'); }, [item?.id]);

  // Called about 4 times a second by the player; setMode does nothing when the mode hasn't changed.
  const posCb = useRef(onPosition);
  posCb.current = onPosition;
  const onProgress = useCallback((t, total) => { setMode(pickMode(t, total)); posCb.current?.(t); }, []);

  // Fullscreen the WHOLE PAGE (not just the player box), so it stays full screen when the queue finishes
  // and the player gives way to the idle TV. The top bar and layout adapt through the host-fs class.
  const toggleFullscreen = useCallback(() => {
    if (fsActive()) exitPageFullscreen(); else enterPageFullscreen();
  }, []);

  if (!item) {
    return (
      <div className="stage idle">
        <IdleTV roomCode={roomCode} />
        {isFs && left != null && (
          <div className={`idle-timer ${left <= WARN_MS ? 'warn' : ''}`} role="timer" aria-live="off">
            <span>Session ends in</span> <b>{formatLeft(left)}</b>
          </div>
        )}
        <TimeReminder left={left} />
        <TvMessage message={tvMessage} />
        {timeUp && <TimeUpPanel timeUp={timeUp} />}
      </div>
    );
  }
  const { song, singer } = item;
  return (
    <div className="stage">
      <div className="stage-screen" ref={screen}>
        {timeUp ? null : song.youtubeId
          ? <YouTubePlayer key={item.id} videoId={song.youtubeId} onEnded={onEnded} onProgress={onProgress} onVideoError={() => api.reportSong(song.id, 'broken')} startAt={startAt} />
          : <DemoStage key={item.id} song={song} onEnded={onEnded} onProgress={onProgress} startAt={startAt} />}
        {isFs && <ReservedBar item={item} upNext={upNext} mode={mode} left={left} />}
        <TimeReminder left={left} />
        <TvMessage message={tvMessage} />
        {timeUp && <TimeUpPanel timeUp={timeUp} />}
      </div>
      <div className="now">
        <span className="chip">#{song.code}</span>
        <div className="grow"><h2>{song.title}</h2><p className="muted">{song.artist} · sung by {singer}</p></div>
        <button className="ghost" onClick={toggleFullscreen}><Icon name="maximize" size={18} />Full screen</button>
      </div>
    </div>
  );
}