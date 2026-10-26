import { useEffect, useRef, useState } from 'react';

// YouTube end screens (the suggestion cards) are drawn inside the player and cannot be removed from our side.
// So: (1) move to the next song this many seconds before the video ends, and
// (2) cover the player with a clear shield for the last stretch so a click can't open a suggestion.
// Raise END_TRIM_SECONDS (up to about 20) if an uploader's cards still appear; lower it to keep more of the outro.
const END_TRIM_SECONDS = 8;
const SHIELD_SECONDS = 25;

let ytReady;
const loadYT = () => {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return (ytReady ??= new Promise((res) => {
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    window.onYouTubeIframeAPIReady = () => res(window.YT);
    document.head.appendChild(s);
  }));
};

// Official IFrame Player only. Errors (removed or non-embeddable video) skip to the next song.
export default function YouTubePlayer({ videoId, onEnded }) {
  const host = useRef(null);
  const cb = useRef(onEnded);
  cb.current = onEnded;
  const [shield, setShield] = useState(false);

  useEffect(() => {
    let player; let timer; let dead = false; let fired = false;

    const finish = () => {
      if (fired) return;
      fired = true;
      try { player?.pauseVideo(); } catch { /* player not ready */ }
      cb.current();
    };

    const tick = () => {
      if (!player?.getDuration) return;
      const total = player.getDuration();
      const now = player.getCurrentTime();
      if (!total || !now || total < END_TRIM_SECONDS * 3) return; // skip live streams and very short clips
      const left = total - now;
      setShield(left <= SHIELD_SECONDS);
      if (left <= END_TRIM_SECONDS) finish();
    };

    loadYT().then((YT) => {
      if (dead) return;
      player = new YT.Player(host.current, {
        videoId, width: '100%', height: '100%',
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: () => { timer = setInterval(tick, 250); },
          onStateChange: (e) => e.data === YT.PlayerState.ENDED && finish(),
          onError: finish,
        },
      });
    });

    return () => { dead = true; clearInterval(timer); player?.destroy?.(); };
  }, [videoId]);

  return (
    <div className="yt-frame">
      <div className="yt-slot"><div ref={host} /></div>
      {shield && <div className="yt-shield" aria-hidden="true" />}
    </div>
  );
}
