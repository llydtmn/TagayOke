import { useCallback, useEffect, useRef, useState } from 'react';
import YouTubePlayer from './YouTubePlayer';
import DemoStage from './DemoStage';
import IdleTV from './IdleTV';

const MAX_SHOWN = 4; // how many reserved songs fit on the top bar before "+N more"

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;

// The top bar of a traditional videoke: how many songs are reserved and which ones are coming.
function ReservedBar({ upNext }) {
  const shown = upNext.slice(0, MAX_SHOWN);
  const more = upNext.length - shown.length;
  return (
    <div className="reserved-bar" role="status" aria-live="polite">
      <div className="reserved-count">
        <span className="reserved-label">RESERVED</span>
        <span className="reserved-num">{upNext.length}</span>
      </div>
      {shown.length ? (
        <ol className="reserved-list">
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
        <p className="reserved-empty">No reserved songs. Reserve one from your phone.</p>
      )}
    </div>
  );
}

export default function Stage({ item, roomCode, onEnded, upNext = [] }) {
  const screen = useRef(null);
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const sync = () => setIsFs(!!screen.current && fsElement() === screen.current);
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  // Fullscreen the whole screen box (video + reserved bar), not just the YouTube iframe,
  // otherwise our bar would be hidden behind the player's own fullscreen.
  const toggleFullscreen = useCallback(() => {
    const el = screen.current;
    if (!el) return;
    if (fsElement()) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
    } else {
      (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
    }
  }, []);

  if (!item) {
    return (
      <div className="stage idle">
        <IdleTV roomCode={roomCode} />
      </div>
    );
  }
  const { song, singer } = item;
  return (
    <div className="stage">
      <div className="stage-screen" ref={screen}>
        {song.youtubeId
          ? <YouTubePlayer key={item.id} videoId={song.youtubeId} onEnded={onEnded} />
          : <DemoStage key={item.id} song={song} onEnded={onEnded} />}
        {isFs && <ReservedBar upNext={upNext} />}
      </div>
      <div className="now">
        <span className="chip">#{song.code}</span>
        <div className="grow"><h2>{song.title}</h2><p className="muted">{song.artist} · sung by {singer}</p></div>
        <button className="ghost" onClick={toggleFullscreen}>Full screen</button>
      </div>
    </div>
  );
}
